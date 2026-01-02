# Student Course Management – DevOps Project

This repository demonstrates an **end-to-end DevOps workflow** for deploying a simple Student Course Management application using modern cloud and DevOps tools.

The primary goal of this project is to showcase **CI/CD, Infrastructure as Code, Kubernetes, and GitOps principles**, rather than application complexity.

> This project is designed for cloud-native deployment on AWS EKS.
> Local execution instructions are provided later for development purposes only.

---

## Project Overview

The application allows:

- Managing students
- Managing courses
- Enrolling students in courses

From a DevOps perspective, this project demonstrates:

- Containerized frontend and backend services
- Automated Docker image builds using GitHub Actions
- Infrastructure provisioning with Terraform
- Kubernetes deployments on AWS EKS
- GitOps-based continuous delivery using Argo CD

---

## Architecture Diagram

![Architecture Diagram](Student%20Course%20Diagram%20Flow.png)

### High-Level Flow

1. Developer pushes code to GitHub
2. GitHub Actions builds Docker images for frontend and backend
3. Images are pushed to Docker Hub
4. Kubernetes manifests are stored in GitHub
5. Argo CD (running inside EKS) watches the repository
6. Argo CD syncs and deploys the application to Kubernetes

---

## Technologies Used

- **Frontend:** React, Axios
- **Backend:** Node.js, Express
- **Database:** MySQL
- **Containerization:** Docker
- **CI:** GitHub Actions
- **CD (GitOps):** Argo CD
- **Infrastructure as Code:** Terraform
- **Orchestration:** Kubernetes (EKS)
- **Cloud Provider:** AWS

---

## 📁 Repository Structure

```
.
├── .github/workflows/devops.yaml     # CI: build & push Docker images
│
├── argocd/app/
│   ├── backend-deploy.yaml           # ArgoCD Application (backend)
│   └── frontend-deploy.yaml          # ArgoCD Application (frontend)
│
├── backend/                           # Node.js API
├── frontend/                          # React app
│
├── k8s/
│   ├── backend/
│   │   ├── deployment.yaml            # Backend Deployment
│   │   ├── service.yaml               # Backend Service
│   │   ├── mysql-statefulset.yaml     # MySQL StatefulSet
│   │   ├── mysql-service.yaml         # MySQL Service
│   │   └── pvc.yaml                   # PersistentVolumeClaim (MySQL)
│   │
│   └── frontend/
│       ├── deployment.yaml            # Frontend Deployment
│       └── service.yaml               # Frontend Service
│
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
│
└── README.md
```

---

## CI/CD Pipeline

### Continuous Integration (GitHub Actions)

GitHub Actions is responsible for **CI only**.

The pipeline:

- Builds Docker images for frontend and backend
- Tags images using the Git commit SHA
- Pushes images to Docker Hub

> The pipeline does **not** run Terraform and does **not** deploy to Kubernetes directly.
> Deployment is handled via GitOps using Argo CD.

---

## Infrastructure Provisioning (Terraform)

Terraform is used to provision AWS infrastructure, including:

- VPC
- EKS Cluster
- IAM roles and permissions

### Provision Infrastructure

From the `terraform/` directory:

```bash
terraform init
terraform plan
terraform apply
```

After this step:

- The EKS cluster is created
- `kubectl` can connect to the cluster

---

## Argo CD (GitOps Deployment)

Argo CD is installed **inside the EKS cluster** and continuously monitors this GitHub repository.

### Important Concept

> ArgoCD runs **inside the EKS cluster**, but you install it using `kubectl` from your local machine.

### 1️⃣ Connect kubectl to EKS

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name main_devops-cluster
```

"main_devops-cluster" is the name of the cluster created

Verify:

```bash
kubectl get nodes
```

### 2️⃣ Install ArgoCD using the shell that used to create EKS (VSCode or EC2 Instance Shell)

```bash
kubectl create namespace argocd

kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Verify:

```bash
kubectl get pods -n argocd
```

### What Argo CD Does

- Watches Kubernetes manifests in GitHub
- Detects changes automatically
- Syncs Deployments and Services into the cluster
- Ensures the cluster state matches Git

This follows a **GitOps deployment model**.

---

## Deploy Apps with ArgoCD

```bash
kubectl apply -f argocd/app/backend-deploy.yaml
kubectl apply -f argocd/app/frontend-deploy.yaml
```

## Kubernetes Deployment

Kubernetes manifests define:

- Frontend Deployment and Service
- Backend Deployment and Service
- MySQL Deployment and Service
- Kubernetes Secrets for configuration

Apply manifests manually or allow Argo CD to sync them:

```bash
kubectl apply -f k8s/
```

---

## Secrets Management

Database credentials are managed using **Kubernetes Secrets**.

### Notes

- `stringData` is used in Secrect file for readability
- Kubernetes automatically encodes secrets internally
- No credentials are hardcoded in application code

> In a production environment, secrets would typically be managed using AWS Secrets Manager or SSM.
> For this portfolio project, Kubernetes Secrets are sufficient.

---

## Running the Application Locally (Optional)

This is **only for development**.
Local MySQL (XAMPP) is **not used in Kubernetes**.

### Requirements

- Node.js
- MySQL (XAMPP or local MySQL)

### 1️⃣ Create Database & Tables

```sql
CREATE DATABASE university_db;
USE university_db;

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255)
);

CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  credits INT
);

CREATE TABLE enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  course_id INT
);
```

### 2️⃣ Backend

```bash
cd backend
npm install
node server.js
```

Runs at:

```
http://localhost:5000
```

### 3️⃣ Frontend

```bash
cd frontend
npm install
npm start
```

Runs at:

```
http://localhost:3000
```

Frontend talks to backend using:

```js
REACT_APP_API_URL=http://localhost:5000
```

---

## 🗄 MySQL, StatefulSet & PVC (Important)

### Why a PVC is Needed

- MySQL stores data on disk
- Pods can restart or move nodes
- Without a PVC → **data is lost**

### How It Works

```
StatefulSet (MySQL)
        |
        v
PersistentVolumeClaim (pvc.yaml)
        |
        v
PersistentVolume (AWS EBS gp3)
```

- The PVC is defined in `k8s/backend/pvc.yaml`
- Kubernetes automatically provisions an **EBS volume**
- Data survives pod restarts

You do **not** manually create a PV in EKS.

---

## 🌐 Frontend → Backend Communication (Kubernetes)

Inside Kubernetes:

```js
REACT_APP_API_URL=http://backend-service:5000
```

Why this works:

- `backend-service` is a Kubernetes Service
- Kubernetes DNS resolves it automatically

---

## Monitoring & Observability (Future Improvement)

Basic monitoring and logging (CloudWatch, Prometheus, or ELK) can be added as an enhancement.
This project focuses primarily on **deployment automation and GitOps**.

---

## Security Considerations

- No credentials are committed in source code
- GitHub Secrets are used in CI pipelines
- Kubernetes Secrets are used for runtime configuration
- `.gitignore` prevents sensitive files from being committed

---

## Key DevOps Concepts Demonstrated

- CI vs CD separation
- Containerized microservices
- Infrastructure as Code
- Kubernetes application deployment
- GitOps workflow using Argo CD
- Secure configuration management

---

## Author

**Hasan Abdirahman**
Cloud / DevOps Engineer

GitHub: [Link](https://github.com/HasanAbdirahman) \
LinkedIn: [Link](https://www.linkedin.com/in/hasan-abdirahman/)
