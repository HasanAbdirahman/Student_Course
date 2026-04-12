# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Student Course Management** app built as an end-to-end DevOps showcase. The application logic is intentionally simple; the real complexity lives in the CI/CD pipeline, Kubernetes orchestration, and GitOps workflow.

## Local Development

### Backend (Node.js/Express, port 5000)
```bash
cd backend
npm install
node server.js
```

### Frontend (React, port 3000)
```bash
cd frontend
npm install
npm start
```

The frontend reads `REACT_APP_API_URL` at **build time** (baked into the bundle by CRA). For local dev it defaults to `http://localhost:5000`. For Docker/Kubernetes builds, the GitHub Actions pipeline sets it to `http://backend-service:5000`.

### Docker Builds
```bash
docker build -t backend-student:latest ./backend

docker build \
  --build-arg REACT_APP_API_URL=http://backend-service:5000 \
  -t frontend-student:latest ./frontend
```

### Tests
No test suites are currently implemented. The frontend has `npm test` (CRA/Jest) and the backend has no test runner configured.

## Architecture

### Application Stack
- **Frontend**: React 19 (Create React App) served via Nginx in production. Axios client configured in `frontend/src/api.js`.
- **Backend**: Express 5 REST API (`backend/server.js`). Routes under `backend/routes/` cover auth, students, courses, and enrollments. MySQL connection in `backend/db.js` (configurable via `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` env vars). Additional env vars: `JWT_SECRET` (defaults to `dev_secret_change_in_production`), `ALLOWED_ORIGINS` (comma-separated, defaults to `http://localhost:3000`).
- **Database**: MySQL running as a Kubernetes StatefulSet with a 5Gi EBS-backed PVC. Schema initialised by `backend/db-init.sql`.

### Database Schema
Four tables: `users` (id, username, password), `students` (id, name, email), `courses` (id, title, credits), `enrollments` (id, student_id, course_id — unique constraint on the pair).

### Authentication
JWT-based auth (`backend/routes/auth.js`). `POST /auth/register` and `POST /auth/login` are public. All other routes (`/students`, `/courses`, `/enrollments`) require a `Bearer` token via `Authorization` header. The frontend stores the token in `localStorage` and attaches it via an Axios request interceptor (`frontend/src/api.js`); a 401 response clears the token and redirects to `/`.

### Monitoring
Prometheus metrics are exposed at `GET /metrics` (unauthenticated). `backend/logger.js` uses Winston for structured JSON logging; `backend/metrics.js` exports Prometheus counters/histograms for request duration and count. The kube-prometheus-stack Helm chart installs Prometheus + Grafana + Alertmanager into the `monitoring` namespace:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  -f k8s/monitoring/helm-values.yaml \
  --set alertmanager.config.global.smtp_auth_password="<gmail-app-password>"
```

`k8s/monitoring/servicemonitor.yaml` tells Prometheus to scrape the backend. `k8s/monitoring/alertmanager-rules.yaml` defines alert rules. Grafana is exposed as a LoadBalancer; its admin password is read from the `grafana-admin-secret` Kubernetes Secret (create it manually before running Helm).

### CI/CD Pipeline (`.github/workflows/devops.yaml`)
Triggers on pushes to `main` (excluding `k8s/` changes to avoid loops):
1. Builds and pushes both Docker images to Docker Hub (`hasanabdirahman/`) tagged with the commit SHA.
2. Patches the image tags in `k8s/backend/deployment.yaml` and `k8s/frontend/deployment.yaml`.
3. Commits the updated manifests back to the repo — this is the GitOps trigger.

### GitOps / ArgoCD
ArgoCD runs inside EKS and watches this repo. `argocd/app/applicationset.yaml` is a single ApplicationSet that replaces the older per-app manifests and manages three apps: `backend` (`k8s/backend`), `frontend` (`k8s/frontend`), and `backend-staging` (`k8s/staging`). All three have auto-sync, prune, and self-heal enabled, and will create their namespaces if missing. Apply with:

```bash
kubectl apply -f argocd/app/applicationset.yaml
```

When the CI pipeline commits updated image tags, ArgoCD detects the diff and rolls out new pods automatically.

### Infrastructure (Terraform / AWS EKS)
`terraform/` provisions: VPC (10.0.0.0/16) with 2 public + 2 private subnets, NAT gateways, an EKS cluster (`main_devops-cluster`, us-east-1), a managed node group of 3× t3.medium (min 2, max 5), and the EBS CSI driver addon for persistent volumes.

```bash
cd terraform
terraform init && terraform plan && terraform apply

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name main_devops-cluster
```

### Kubernetes Namespaces
- `argocd` — ArgoCD control plane
- `backend` — Backend API pod + MySQL StatefulSet
- `frontend` — Frontend Nginx pod
- `staging` — Staging backend deployment (single replica, shares the backend image, `REPLACE_ME` tag patched at deploy time)
- `monitoring` — kube-prometheus-stack (Prometheus, Grafana, Alertmanager)

MySQL credentials are stored in `k8s/backend/mysql-secret.yaml` as a Kubernetes Secret.

## Key Relationships to Keep in Mind
- `REACT_APP_API_URL` is a **build-time** env var — changing the backend service URL requires rebuilding the frontend image.
- The CI pipeline writes back to `k8s/` manifests; avoid editing those files manually on `main` or the pipeline and GitOps state will diverge.
- The ArgoCD app manifests in `argocd/app/` reference `github.com/HasanAbdirahman/Student_Course` — update these if the repo is forked/renamed.
