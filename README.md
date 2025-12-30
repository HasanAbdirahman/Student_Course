---

# 🎓 Student Course Management System

**React · Node.js · MySQL · Docker · GitHub Actions · Terraform · Kubernetes · ArgoCD**

This project demonstrates a **clear, real-world DevOps workflow** showing how an application goes from local development to running on **AWS EKS**, using **GitOps with ArgoCD**.

The focus is on **understanding the process**, not over-complicating it.

---

## 🧠 Big Picture (Read First)

Each tool has **one responsibility**:

| Tool           | What it does                    |
| -------------- | ------------------------------- |
| GitHub Actions | Build & push Docker images      |
| Terraform      | Create AWS infrastructure (EKS) |
| Kubernetes     | Run application workloads       |
| ArgoCD         | Deploy apps from Git (GitOps)   |

❗ GitHub Actions **does not deploy to Kubernetes**
❗ Terraform **does not deploy applications**
❗ ArgoCD **does not build Docker images**

---

## 🏗 Architecture Overview

```
Browser
  ↓
Frontend (React)
  ↓ HTTP (Axios)
Backend (Node.js / Express)
  ↓
MySQL (StatefulSet + PVC)
```

Everything except local development runs **inside Kubernetes**.

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

## 🧑‍💻 Part 1: Run Locally (Optional / Learning Only)

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

## 🐳 Part 2: GitHub Actions (CI Only)

### What Happens

When code is pushed to `main`:

1. GitHub Actions builds backend Docker image
2. Builds frontend Docker image
3. Tags images with **Git commit SHA**
4. Pushes images to Docker Hub

Example:

```
hasanabdirahman/backend-repo:<commit-sha>
hasanabdirahman/frontend-repo:<commit-sha>
```

### What Does NOT Happen

- ❌ Terraform
- ❌ kubectl
- ❌ ArgoCD
- ❌ Kubernetes deployment

This separation is intentional and correct.

---

## ☁️ Part 3: Infrastructure with Terraform (Manual)

Terraform is used **only to create infrastructure**.

### Where Terraform Runs

You run Terraform from your **local terminal (VS Code)**.

### Steps

```bash
cd terraform
terraform init
terraform apply
```

Terraform creates:

- EKS cluster
- Worker nodes
- Networking
- Default StorageClass (`gp3`)

At this point:

- Kubernetes exists
- No apps are deployed yet

---

## 🚀 Part 4: Install ArgoCD (Inside the Cluster)

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

---

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

---

## 🔁 Part 5: Deploy Apps with ArgoCD

```bash
kubectl apply -f argocd/app/backend-deploy.yaml
kubectl apply -f argocd/app/frontend-deploy.yaml
```

ArgoCD will:

- Watch this GitHub repository
- Apply Kubernetes manifests
- Continuously keep cluster in sync with Git

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

## 🔄 Full End-to-End Flow

```
Developer
   |
   | git push
   v
GitHub Repo
   |
   | GitHub Actions
   v
Docker Hub
   |
   | image pull
   v
EKS Cluster
   |
   ├── Frontend Deployment
   │       |
   │       v
   ├── Backend Deployment
   │       |
   │       v
   └── MySQL StatefulSet
          |
          v
        PVC → EBS
```

---

## ✅ Correct Order (Summary)

1. Write code
2. Push to GitHub
3. GitHub Actions builds & pushes images
4. Run Terraform (manual)
5. Install ArgoCD (once)
6. Apply ArgoCD Applications
7. ArgoCD deploys apps

---

## 🎯 Why This Project Is Strong

- Clear GitOps workflow
- Correct DevOps separation
- Uses StatefulSets & PVCs correctly
- Easy to explain in interviews
- Production-aligned design

---
