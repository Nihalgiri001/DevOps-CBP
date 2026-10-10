# CommunityLink

A full-stack community management platform built as a B.Tech DevOps laboratory project. CommunityLink lets residential communities manage announcements, organize events, and handle role-based user access — while demonstrating end-to-end DevOps practices including containerization, Kubernetes orchestration, CI/CD pipelines, API testing, and monitoring.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Architecture](#3-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Prerequisites](#5-prerequisites)
6. [Local Development Setup](#6-local-development-setup)
7. [Docker Deployment](#7-docker-deployment)
8. [Kubernetes Deployment](#8-kubernetes-deployment)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [API Reference](#10-api-reference)
11. [Testing](#11-testing)
12. [Monitoring and Logging](#12-monitoring-and-logging)
13. [Git Workflow](#13-git-workflow)
14. [DevOps Laboratory Mapping](#14-devops-laboratory-mapping)
15. [Known Limitations](#15-known-limitations)

---

## 1. Project Overview

CommunityLink is a three-tier web application:

- **Frontend** — React.js SPA served via Nginx
- **Backend** — Node.js + Express REST API with JWT authentication
- **Database** — MongoDB with Mongoose ODM

The system supports two user roles: **Resident** (read-only community member) and **Administrator** (full content management). All DevOps infrastructure — Docker images, Kubernetes manifests, and a GitHub Actions pipeline — is included in the repository.

---

## 2. Features

### Implemented
- User registration and login with bcrypt password hashing and JWT tokens
- Role-based access control (Resident / Administrator)
- Community announcements CRUD (admin create/update/delete, public read)
- Community events CRUD (admin create/update/delete, public read)
- System health endpoint (`/health`) for liveness/readiness probes
- Centralized error handling and structured request logging
- Docker Compose for local multi-container deployment
- Kubernetes manifests for production-grade orchestration
- GitHub Actions CI/CD pipeline (test → build → Docker push → K8s deploy)
- Postman collection for manual API testing
- Automated Jest test suite for the backend

### Optional / Not Implemented
- Community forums and discussion threads
- Polls and surveys
- Facility booking / reservation management
- Visitor management system
- Email notifications

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────┐
│                     User Browser                     │
└──────────────────────┬───────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────┐
│              Frontend Container (port 3000)          │
│         React.js SPA  ·  Nginx production server     │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP REST / JSON
                       ▼
┌──────────────────────────────────────────────────────┐
│              Backend Container (port 5000)           │
│       Node.js + Express  ·  JWT middleware           │
│       Role-based auth  ·  Centralized error handler  │
└──────────────────────┬───────────────────────────────┘
                       │ MongoDB wire protocol
                       ▼
┌──────────────────────────────────────────────────────┐
│              Database Container (port 27017)         │
│          MongoDB 6.0  ·  Persistent volume           │
└──────────────────────────────────────────────────────┘
```

**Docker Compose** runs all three containers on a shared bridge network (`communitylink-network`). MongoDB data is persisted in the `communitylink-mongodb-data` named volume.

**Kubernetes** deploys each tier as a `Deployment` with 2 replicas (1 for MongoDB) inside the `communitylink` namespace. A `LoadBalancer` service exposes the frontend; `ClusterIP` services handle internal communication between tiers.

---

## 4. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 18 |
| Frontend routing | React Router DOM | 6 |
| HTTP client | Axios | 1.6 |
| Frontend build | Create React App / react-scripts | 5 |
| Frontend server | Nginx | Alpine |
| Backend framework | Node.js + Express | 18 / 4.18 |
| Authentication | JSON Web Tokens (jsonwebtoken) | 9 |
| Password hashing | bcrypt | 5 |
| Validation | express-validator | 7 |
| Database | MongoDB | 6 |
| ODM | Mongoose | 7 |
| Environment config | dotenv | 16 |
| Test runner | Jest + Supertest | 29 / 6 |
| Containerization | Docker + Docker Compose | 24+ / 2+ |
| Orchestration | Kubernetes (kubectl) | 1.28+ |
| CI/CD | GitHub Actions | — |

---

## 5. Prerequisites

### Local Development (no Docker)
- **Node.js** 18 or later — https://nodejs.org
- **npm** 9 or later (bundled with Node.js)
- **MongoDB** 6.0 running locally — https://www.mongodb.com/docs/manual/installation/

### Docker Deployment
- **Docker** 24 or later — https://docs.docker.com/get-docker/
- **Docker Compose** v2 or later (bundled with Docker Desktop)

### Kubernetes Deployment
- **kubectl** 1.28 or later — https://kubernetes.io/docs/tasks/tools/
- A running Kubernetes cluster (Minikube, Kind, or cloud-managed)

### CI/CD
- A GitHub repository with Actions enabled
- Docker Hub account (for image pushing)
- Kubernetes cluster with a valid kubeconfig (for automated deployment)

---

## 6. Local Development Setup

### 6.1 Clone the Repository

```bash
git clone https://github.com/<your-org>/communitylink.git
cd communitylink
```

### 6.2 Configure Environment Variables

**Backend:**

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/communitylink
JWT_SECRET=your-super-secret-jwt-key-change-this
```

**Frontend:**

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 6.3 Start MongoDB

Make sure a local MongoDB instance is running on port 27017. If you have it installed:

```bash
mongod --dbpath /data/db
```

Or run it in a single Docker container:

```bash
docker run -d -p 27017:27017 --name mongo-local mongo:6.0
```

### 6.4 Install and Start the Backend

```bash
cd backend
npm install
npm start          # production mode
# or
npm run dev        # development mode with nodemon auto-reload
```

The API will be available at `http://localhost:5000`.

### 6.5 Install and Start the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm start
```

The React dev server will be available at `http://localhost:3000`.

### 6.6 Verify the Setup

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T12:00:00.000Z",
  "uptime": 12.3,
  "database": "connected",
  "environment": "development"
}
```

---

## 7. Docker Deployment

Docker Compose orchestrates all three services — MongoDB, backend, and frontend — in a single command.

### 7.1 Build All Images

```bash
docker compose build
```

To force a clean rebuild (no cache):

```bash
docker compose build --no-cache
```

### 7.2 Start All Services

```bash
docker compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

To start and follow logs in the foreground:

```bash
docker compose up
```

### 7.3 View Container Logs

All services:

```bash
docker compose logs -f
```

A specific service:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

### 7.4 Stop Containers

Stop without removing volumes:

```bash
docker compose down
```

Stop and remove the MongoDB data volume (⚠ destroys all data):

```bash
docker compose down -v
```

### 7.5 Environment Variable Override

You can override variables at runtime without editing `.env`:

```bash
JWT_SECRET=my-strong-secret docker compose up -d
```

---

## 8. Kubernetes Deployment

### 8.1 Prerequisites

- `kubectl` configured and connected to your target cluster (`kubectl cluster-info`)
- Docker images pushed to a registry accessible by the cluster (see [CI/CD](#9-cicd-pipeline))

### 8.2 Update the Secret

Before applying, generate a real JWT secret and base64-encode it:

```bash
echo -n "your-strong-jwt-secret-here" | base64
```

Edit `k8s/secret.yaml` and replace the `JWT_SECRET` value with the output above.

Alternatively, create the secret directly with kubectl (skips the base64 step):

```bash
kubectl create secret generic communitylink-secret \
  --from-literal=JWT_SECRET="your-strong-jwt-secret-here" \
  --namespace communitylink
```

### 8.3 Apply All Manifests

Apply in dependency order (namespace → config → storage → workloads):

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

Or apply the entire directory (Kubernetes resolves ordering):

```bash
kubectl apply -f k8s/
```

### 8.4 Check Deployment Status

```bash
# List all resources in the namespace
kubectl get all -n communitylink

# Wait for a specific deployment to finish rolling out
kubectl rollout status deployment/backend-deployment -n communitylink
kubectl rollout status deployment/frontend-deployment -n communitylink
kubectl rollout status deployment/mongodb-deployment -n communitylink
```

### 8.5 View Pod Logs

```bash
# List pods
kubectl get pods -n communitylink

# Follow logs for a specific pod
kubectl logs -f <pod-name> -n communitylink

# Follow logs for all pods of a deployment
kubectl logs -f deployment/backend-deployment -n communitylink
```

### 8.6 Access Services

```bash
# Get service details (including external IP for LoadBalancer)
kubectl get services -n communitylink
```

On **Minikube**, get the external URL for the frontend:

```bash
minikube service frontend-service -n communitylink --url
```

The backend ClusterIP service is reachable inside the cluster at `http://backend-service:5000`.

### 8.7 Scale Deployments

```bash
# Scale backend to 3 replicas
kubectl scale deployment backend-deployment --replicas=3 -n communitylink

# Scale frontend to 3 replicas
kubectl scale deployment frontend-deployment --replicas=3 -n communitylink
```

### 8.8 Delete All Resources

```bash
kubectl delete namespace communitylink
```

This removes all resources in the namespace, including deployments, services, and the PVC.

---

## 9. CI/CD Pipeline

The pipeline is defined in `.github/workflows/ci-cd.yml` and runs on GitHub Actions.

### 9.1 Pipeline Stages

```
Push to main/develop  ──►  test-backend ──┐
Pull request to main  ──►  build-frontend ─┤
                                           ▼
                                     docker-build  (main only)
                                           │
                                           ▼
                                      deploy-k8s  (main only)
```

| Job | Trigger | What it does |
|-----|---------|-------------|
| `test-backend` | All pushes and PRs | Spins up MongoDB service, runs Jest tests with coverage |
| `build-frontend` | All pushes and PRs | Installs deps, runs `npm run build`, uploads artifact |
| `docker-build` | Push to `main` only (after both above pass) | Builds and pushes backend + frontend images to Docker Hub |
| `deploy-k8s` | Push to `main` only (after docker-build) | Applies k8s manifests, verifies rollout status |

### 9.2 Required GitHub Secrets

Configure these under **Settings → Secrets and variables → Actions** in your repository:

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password or access token |
| `KUBE_CONFIG` | Base64-encoded kubeconfig file for your cluster |

### 9.3 Configuring Secrets

**Docker Hub credentials:**

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Click **New repository secret**
3. Add `DOCKER_USERNAME` with your Docker Hub username
4. Add `DOCKER_PASSWORD` with a Docker Hub access token (recommended over password)
   - Generate at: https://hub.docker.com/settings/security

**Kubernetes config:**

```bash
# Base64-encode your kubeconfig
cat ~/.kube/config | base64 | tr -d '\n'
```

Paste the output as the value of the `KUBE_CONFIG` secret.

### 9.4 Update Image References

Before the pipeline can push images, update the image names in `k8s/backend-deployment.yaml` and `k8s/frontend-deployment.yaml` to match your Docker Hub username:

```yaml
image: <your-dockerhub-username>/communitylink-backend:latest
image: <your-dockerhub-username>/communitylink-frontend:latest
```

---

## 10. API Reference

All API endpoints are prefixed with `/api` unless noted. JSON is the only accepted content type.

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { },
  "message": "Human-readable description"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error description",
  "message": "Human-readable description",
  "statusCode": 400
}
```

### Authentication

Protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Admin-only endpoints additionally require the user to have the `Administrator` role.

---

### 10.1 Auth Endpoints

#### POST /api/auth/register

Register a new user account.

**Auth required:** No

**Request body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

| Field | Type | Rules |
|-------|------|-------|
| username | string | required, 3–50 chars |
| email | string | required, valid email format |
| password | string | required, min 6 chars |

**201 Created:**
```json
{
  "success": true,
  "data": {
    "userId": "64abc123...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "Resident"
  },
  "message": "User registered successfully"
}
```

| Status | Meaning |
|--------|---------|
| 201 | User created |
| 400 | Missing or invalid fields |
| 409 | Email already registered |
| 500 | Server error |

---

#### POST /api/auth/login

Authenticate and receive a JWT token.

**Auth required:** No

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**200 OK:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64abc123...",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "Resident"
    }
  },
  "message": "Login successful"
}
```

Token expires after **24 hours**. Payload contains `{ userId, email, role }`.

| Status | Meaning |
|--------|---------|
| 200 | Login successful, token returned |
| 400 | Missing email or password |
| 401 | Invalid credentials |
| 500 | Server error |

---

### 10.2 Announcements Endpoints

#### POST /api/announcements

Create a new announcement.

**Auth required:** Yes — Administrator role

**Request body:**
```json
{
  "title": "Pool Maintenance Notice",
  "content": "The community pool will be closed on Saturday for maintenance.",
  "author": "Admin Team"
}
```

| Field | Type | Rules |
|-------|------|-------|
| title | string | required, max 200 chars |
| content | string | required, max 5000 chars |
| author | string | required |

**201 Created:**
```json
{
  "success": true,
  "data": {
    "_id": "64def456...",
    "title": "Pool Maintenance Notice",
    "content": "The community pool will be closed on Saturday for maintenance.",
    "author": "Admin Team",
    "createdAt": "2026-01-15T10:30:00.000Z"
  },
  "message": "Announcement created successfully"
}
```

| Status | Meaning |
|--------|---------|
| 201 | Created |
| 400 | Invalid input |
| 401 | Missing or invalid token |
| 403 | Not an Administrator |
| 500 | Server error |

---

#### GET /api/announcements

Retrieve all announcements, newest first.

**Auth required:** No

**200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64def456...",
      "title": "Pool Maintenance Notice",
      "content": "The pool will be closed...",
      "author": "Admin Team",
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "message": "Announcements retrieved successfully"
}
```

---

#### GET /api/announcements/:id

Retrieve a single announcement by ID.

**Auth required:** No

**200 OK:** Returns the announcement object.

| Status | Meaning |
|--------|---------|
| 200 | Found |
| 400 | Invalid ID format |
| 404 | Not found |
| 500 | Server error |

---

#### PUT /api/announcements/:id

Update an announcement. All body fields are optional — only provided fields are updated.

**Auth required:** Yes — Administrator role

**Request body (partial update supported):**
```json
{
  "title": "Updated Title",
  "content": "Updated content."
}
```

**200 OK:** Returns the updated announcement object.

| Status | Meaning |
|--------|---------|
| 200 | Updated |
| 400 | Invalid input or ID format |
| 401 | Missing or invalid token |
| 403 | Not an Administrator |
| 404 | Not found |
| 500 | Server error |

---

#### DELETE /api/announcements/:id

Delete an announcement.

**Auth required:** Yes — Administrator role

**200 OK:**
```json
{
  "success": true,
  "data": null,
  "message": "Announcement deleted successfully"
}
```

| Status | Meaning |
|--------|---------|
| 200 | Deleted |
| 400 | Invalid ID format |
| 401 | Missing or invalid token |
| 403 | Not an Administrator |
| 404 | Not found |
| 500 | Server error |

---

### 10.3 Events Endpoints

#### POST /api/events

Create a new event.

**Auth required:** Yes — Administrator role

**Request body:**
```json
{
  "title": "Annual Community BBQ",
  "description": "Join us for our annual summer BBQ in the garden.",
  "date": "2026-07-15",
  "time": "18:00",
  "location": "Community Garden"
}
```

| Field | Type | Rules |
|-------|------|-------|
| title | string | required, max 200 chars |
| description | string | required, max 5000 chars |
| date | string | required, ISO 8601 (YYYY-MM-DD) |
| time | string | required, HH:MM 24-hour format |
| location | string | required, max 300 chars |

**201 Created:**
```json
{
  "success": true,
  "data": {
    "_id": "64ghi789...",
    "title": "Annual Community BBQ",
    "description": "Join us for our annual summer BBQ in the garden.",
    "date": "2026-07-15",
    "time": "18:00",
    "location": "Community Garden",
    "createdAt": "2026-01-15T11:00:00.000Z"
  },
  "message": "Event created successfully"
}
```

| Status | Meaning |
|--------|---------|
| 201 | Created |
| 400 | Invalid input (missing fields, bad date/time format) |
| 401 | Missing or invalid token |
| 403 | Not an Administrator |
| 500 | Server error |

---

#### GET /api/events

Retrieve all events, sorted by date ascending (earliest first).

**Auth required:** No

**200 OK:** Returns an array of event objects.

---

#### GET /api/events/:id

Retrieve a single event by ID.

**Auth required:** No

**200 OK:** Returns the event object.

| Status | Meaning |
|--------|---------|
| 200 | Found |
| 400 | Invalid ID format |
| 404 | Not found |
| 500 | Server error |

---

#### PUT /api/events/:id

Update an event. All body fields are optional.

**Auth required:** Yes — Administrator role

**200 OK:** Returns the updated event object.

| Status | Meaning |
|--------|---------|
| 200 | Updated |
| 400 | Invalid input or ID format |
| 401 | Missing or invalid token |
| 403 | Not an Administrator |
| 404 | Not found |
| 500 | Server error |

---

#### DELETE /api/events/:id

Delete an event.

**Auth required:** Yes — Administrator role

**200 OK:**
```json
{
  "success": true,
  "data": null,
  "message": "Event deleted successfully"
}
```

---

### 10.4 Health Endpoint

#### GET /health

Returns system operational status. Used by Kubernetes liveness/readiness probes.

**Auth required:** No

**200 OK (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T12:00:00.000Z",
  "uptime": 3600.5,
  "database": "connected",
  "environment": "production"
}
```

**500 (unhealthy — database disconnected):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-15T12:00:00.000Z",
  "uptime": 3600.5,
  "database": "disconnected",
  "environment": "production"
}
```

---

## 11. Testing

### 11.1 Run Automated Backend Tests

The test suite uses **Jest** and **Supertest**. Tests connect to MongoDB directly (no mocking).

```bash
cd backend
npm test
```

This runs all test files in `backend/tests/`, generates a coverage report in `backend/coverage/`, and exits automatically.

To run tests in watch mode (development):

```bash
npm run test:watch
```

**Test database:** The test suite reads `MONGODB_URI` (or `TEST_MONGODB_URI`) from the environment. Set a separate URI to avoid corrupting development data:

```bash
MONGODB_URI=mongodb://localhost:27017/communitylink_test npm test
```

### 11.2 Postman Collection — Manual API Testing

The collection file is at `postman/CommunityLink_API.postman_collection.json`.

**Import the collection:**

1. Open Postman
2. Click **Import** → select `postman/CommunityLink_API.postman_collection.json`
3. The collection appears with all requests grouped by resource

**Collection variables** (edit under the collection's Variables tab):

| Variable | Default | Description |
|----------|---------|-------------|
| `baseUrl` | `http://localhost:5000` | Backend base URL |
| `token` | _(empty)_ | Set automatically after Login request |
| `announcementId` | _(empty)_ | Set manually or by a test script |
| `eventId` | _(empty)_ | Set manually or by a test script |

**Recommended workflow:**

1. Run **Register User** to create an account
2. Run **Login User** — the test script saves the token to the `token` variable automatically
3. Run announcement and event requests — they use `{{token}}` in the Authorization header

### 11.3 Testing as Administrator

By default all registered users get the `Resident` role. To test admin-only endpoints (create/update/delete), manually promote a user in MongoDB:

**Using MongoDB shell:**

```bash
# Connect to local MongoDB
mongosh

use communitylink

db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "Administrator" } }
)
```

**Using Docker Compose:**

```bash
docker exec -it communitylink-mongodb mongosh

use communitylink

db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "Administrator" } }
)
```

**Using Kubernetes:**

```bash
kubectl exec -it deployment/mongodb-deployment -n communitylink -- mongosh

use communitylink

db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "Administrator" } }
)
```

After the update, log in again to receive a new token containing the `Administrator` role.

---

## 12. Monitoring and Logging

### 12.1 Health Endpoint

The backend exposes a `/health` endpoint that reports the real-time operational status of the application. It requires no authentication and is safe to poll frequently.

```bash
curl http://localhost:5000/health
```

**Healthy response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T12:00:00.000Z",
  "uptime": 3600.5,
  "database": "connected",
  "environment": "production"
}
```

**Unhealthy response (500 Internal Server Error):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-15T12:00:01.000Z",
  "uptime": 3601.2,
  "database": "disconnected",
  "environment": "production"
}
```

| Field | Description |
|-------|-------------|
| `status` | `"healthy"` when all systems nominal, `"unhealthy"` when the database is unreachable |
| `timestamp` | ISO 8601 UTC time of the response |
| `uptime` | Seconds the Node.js process has been running (`process.uptime()`) |
| `database` | `"connected"` or `"disconnected"` based on current Mongoose connection state |
| `environment` | Value of the `NODE_ENV` environment variable |

**Polling the endpoint manually:**

```bash
# One-off check
curl -s http://localhost:5000/health | python3 -m json.tool

# Continuous poll every 5 seconds (Bash)
watch -n 5 curl -s http://localhost:5000/health
```

**Kubernetes probe configuration** (from `k8s/backend-deployment.yaml`):

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 10

livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 20
```

- **Readiness probe**: Kubernetes waits 10 s after pod startup, then checks `/health` every 10 s. Traffic is only routed to a pod once the readiness probe passes.
- **Liveness probe**: Kubernetes checks `/health` every 20 s starting 30 s after startup. A failing liveness probe triggers an automatic pod restart.

---

### 12.2 Application Logs

All backend log output goes to **stdout** so it is automatically captured by Docker and Kubernetes log collectors.

#### Startup sequence

```
MongoDB connected successfully
Server running on port 5000 in development mode
```

#### Request log format

Every HTTP request produces a single log line:

```
[<ISO timestamp>] <METHOD> <path> - <status code> (<duration>ms)
```

**Examples:**

```
[2026-01-15T12:00:01.234Z] GET /api/announcements - 200 (12ms)
[2026-01-15T12:00:02.100Z] POST /api/auth/login - 200 (45ms)
[2026-01-15T12:00:03.500Z] POST /api/announcements - 403 (3ms)
[2026-01-15T12:00:04.800Z] GET /api/events/invalid-id - 400 (2ms)
[2026-01-15T12:00:05.000Z] GET /health - 200 (1ms)
```

| Field | Example | Description |
|-------|---------|-------------|
| Timestamp | `2026-01-15T12:00:01.234Z` | ISO 8601 UTC, includes milliseconds |
| Method | `GET` | HTTP method |
| Path | `/api/announcements` | URL path (no query string) |
| Status | `200` | HTTP response status code |
| Duration | `(12ms)` | Round-trip time from request receipt to response send |

#### Error log format

Application errors are logged with an `[ERROR]` prefix:

```
[ERROR] Announcement not found
[ERROR] JWT token expired
[ERROR] Cast to ObjectId failed for value "bad-id"
[ERROR] MongoServerError: E11000 duplicate key error collection: communitylink.users
```

Errors from unexpected exceptions include a stack trace in development mode (`NODE_ENV=development`).

#### What is NOT logged

The logger intentionally omits:
- Request bodies (prevents passwords and tokens appearing in logs)
- Authorization header values
- Response bodies

---

### 12.3 Viewing Logs

**Local development** — logs print to the terminal running `npm start`.

**Docker Compose:**

```bash
# All services, follow in real time
docker compose logs -f

# Backend only
docker compose logs -f backend

# Last 50 lines from each service, no follow
docker compose logs --tail=50

# Logs since a specific time
docker compose logs --since="2026-01-15T12:00:00" backend
```

**Kubernetes:**

```bash
# List pods to get pod names
kubectl get pods -n communitylink

# Follow logs for all backend replicas (streams from first matching pod)
kubectl logs -f deployment/backend-deployment -n communitylink

# Follow logs for a specific pod
kubectl logs -f <pod-name> -n communitylink

# Last 100 lines with timestamps
kubectl logs --timestamps --tail=100 deployment/backend-deployment -n communitylink

# Logs from a previous (crashed) container
kubectl logs <pod-name> --previous -n communitylink

# Logs from all pods matching a label
kubectl logs -f -l app=backend -n communitylink
```

---

### 12.4 Common Issues and Solutions

#### Backend / API issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB not running locally | Start MongoDB: `mongod --dbpath /data/db` or `docker run -d -p 27017:27017 mongo:6.0` |
| `MongooseServerSelectionError` on Docker | Wrong `MONGODB_URI` hostname | Use `mongodb` (container name), not `localhost`: `MONGODB_URI=mongodb://mongodb:27017/communitylink` |
| `MongoServerError: E11000 duplicate key` | Email already registered | Use a different email or delete the existing user in MongoDB |
| API returns `401 Unauthorized` | Missing or expired JWT | Log in again and use the new token in `Authorization: Bearer <token>` |
| `JsonWebTokenError: invalid signature` | `JWT_SECRET` mismatch between restarts | Ensure `JWT_SECRET` is the same value in all running containers/pods |
| `TokenExpiredError` | Token is older than 24 hours | Log in again to receive a fresh 24-hour token |
| API returns `403 Forbidden` on admin routes | User role is `Resident` | Promote user to `Administrator` in MongoDB (see [Section 11.3](#113-testing-as-administrator)) |
| `400 Bad Request` on event creation | `time` field not in `HH:MM` format | Use 24-hour format, e.g. `"18:00"` not `"6:00 PM"` |
| `400 Bad Request` with `"Invalid ObjectId"` | Malformed `:id` in URL | Verify the ID is a valid 24-character MongoDB ObjectId |
| `500 Internal Server Error` | Unhandled exception in controller | Check backend logs for `[ERROR]` lines and stack trace |

#### Frontend issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Blank page after login | `REACT_APP_API_URL` not set or wrong | Check `frontend/.env`: must be `REACT_APP_API_URL=http://localhost:5000/api`; rebuild after changing |
| CORS error in browser console | Backend not running or wrong URL | Verify backend is running at the URL in `REACT_APP_API_URL` |
| `ERR_CONNECTION_REFUSED` in browser | Backend container not started | Run `docker compose up backend` or check `npm start` in `backend/` |
| Admin buttons not showing | Logged in as `Resident`, not `Administrator` | Promote the user in MongoDB and log in again |

#### Docker issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `port is already allocated` on `docker compose up` | Port 3000 or 5000 in use | Stop the conflicting process: `lsof -i :5000` then `kill <PID>` |
| Frontend container builds but shows old code | Docker build cache | Force rebuild: `docker compose build --no-cache frontend` |
| Backend exits immediately | Missing environment variable | Check `docker compose logs backend`; ensure all required vars are in `.env` |
| MongoDB data lost after `docker compose down` | `-v` flag used | Omit `-v`: use `docker compose down` (not `docker compose down -v`) to preserve data |

#### Kubernetes issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Pods stuck in `Pending` | PVC not bound (no StorageClass) | Check: `kubectl get pvc -n communitylink`; on Minikube run `minikube addons enable storage-provisioner` |
| Pods in `CrashLoopBackOff` | Missing env var or DB unreachable | Inspect logs: `kubectl logs <pod-name> -n communitylink --previous` |
| `ImagePullBackOff` | Image not pushed to registry | Push images first or update `image:` in deployment YAML to a public image |
| Readiness probe failing | Backend takes > 10 s to start | Increase `initialDelaySeconds` in `k8s/backend-deployment.yaml` |
| Cannot reach frontend via browser | LoadBalancer IP pending (local cluster) | On Minikube: `minikube service frontend-service -n communitylink --url` |
| Changes not applied after `kubectl apply` | Cached image with `:latest` tag | Force rollout: `kubectl rollout restart deployment/backend-deployment -n communitylink` |

#### Diagnosing a pod that won't start

```bash
# Step 1 – describe the pod for events and error messages
kubectl describe pod <pod-name> -n communitylink

# Step 2 – check current and previous container logs
kubectl logs <pod-name> -n communitylink
kubectl logs <pod-name> --previous -n communitylink

# Step 3 – verify ConfigMap and Secret values are present
kubectl get configmap communitylink-config -n communitylink -o yaml
kubectl get secret communitylink-secret -n communitylink -o yaml

# Step 4 – check overall namespace health
kubectl get all -n communitylink
```

---

## 13. Git Workflow

### 13.1 Repository Structure

```
communitylink/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions pipeline
├── .kiro/                     # Kiro spec files (project planning)
├── backend/                   # Node.js + Express API
│   ├── config/                # Database connection
│   ├── controllers/           # Route handler logic
│   ├── middleware/            # Auth, validation, error, logging
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── tests/                 # Jest test suite
│   ├── utils/                 # JWT utilities
│   ├── .env.example
│   ├── Dockerfile
│   └── server.js
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React context (AuthContext)
│   │   ├── pages/             # Page-level components
│   │   └── services/          # API + auth service modules
│   ├── .env.example
│   └── Dockerfile
├── k8s/                       # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml            # Template — do not commit real secrets
│   ├── pvc.yaml
│   ├── mongodb-deployment.yaml
│   ├── backend-deployment.yaml
│   └── frontend-deployment.yaml
├── postman/
│   └── CommunityLink_API.postman_collection.json
├── docker-compose.yml
└── README.md
```

### 13.2 Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Merges trigger the full CI/CD pipeline including Docker push and K8s deploy. |
| `develop` | Integration branch for ongoing work. Pushes run tests and frontend build only. |
| `feature/<name>` | Individual feature branches. Open PRs against `develop`. |
| `bugfix/<name>` | Bug fix branches. Open PRs against `develop` or `main` depending on severity. |

Suggested workflow:

```bash
# Start a feature
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Work, commit, push
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature

# Open a pull request to develop on GitHub
# After merge to develop, open a PR from develop → main to trigger deployment
```

### 13.3 Commit Message Convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) to make the history readable and compatible with automated tooling:

```
<type>(<scope>): <short description>
```

| Type | When to use |
|------|-------------|
| `feat` | A new feature (e.g. `feat(auth): add JWT refresh token support`) |
| `fix` | A bug fix (e.g. `fix(events): correct time validation regex`) |
| `docs` | Documentation changes only (e.g. `docs: update Kubernetes setup steps`) |
| `chore` | Maintenance tasks — dependency updates, config changes, tooling (e.g. `chore: upgrade mongoose to 8.x`) |
| `test` | Adding or updating tests (e.g. `test(announcements): add 403 role check test`) |
| `ci` | CI/CD pipeline changes (e.g. `ci: add coverage upload step`) |
| `refactor` | Code restructuring with no behavior change (e.g. `refactor(middleware): extract validation helpers`) |

**Examples:**

```bash
git commit -m "feat(announcements): add pagination support"
git commit -m "fix(auth): handle expired token gracefully"
git commit -m "docs: add Docker troubleshooting section"
git commit -m "chore: pin node:18-alpine in Dockerfiles"
```

### 13.4 Pull Request Workflow

1. Branch off `develop` for features and non-critical bugfixes; branch off `main` for hotfixes
2. Keep branches short-lived — merge within a few days to reduce drift
3. Open a PR with a clear title (under 70 characters) and a description covering:
   - **What** changed and **why**
   - **How to test** the change locally
   - Any known limitations or follow-ups
4. The CI pipeline runs automatically on every PR — all jobs must pass before merging
5. Squash-merge feature branches into `develop` to keep history clean
6. When `develop` is stable, open a PR from `develop → main`; merging triggers Docker image build and K8s deployment

---

## 14. DevOps Laboratory Mapping

This section maps each B.Tech DevOps laboratory experiment to the corresponding implementation in this project, listing the relevant files, key commands, and step-by-step verification instructions.

### 14.1 Experiment Summary Table

| Exp | Topic | Status | Key Files | Quick Verification |
|-----|-------|--------|-----------|-------------------|
| 1 | Backend CRUD & REST APIs | ✅ Implemented | `backend/routes/`, `backend/controllers/` | `curl http://localhost:5000/health` |
| 2 | Git and GitHub | ✅ Implemented | `.gitignore`, `.github/workflows/` | `git log --oneline` |
| 3 | Docker Container Management | ✅ Implemented | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` | `docker compose ps` |
| 4 | Integrating Docker and Kubernetes | ✅ Implemented | `k8s/` (all manifests) | `kubectl get all -n communitylink` |
| 5 | Automating Deployment with Kubernetes | ✅ Implemented | `k8s/backend-deployment.yaml`, `k8s/frontend-deployment.yaml` | `kubectl rollout status deployment/backend-deployment -n communitylink` |
| 6 | CI/CD Setup | ✅ Implemented | `.github/workflows/ci-cd.yml` | GitHub Actions tab → latest run |
| 7 | Manual API Testing with Postman | ✅ Implemented | `postman/CommunityLink_API.postman_collection.json` | Import and run in Postman |
| 8 | Automated API Test Cases | ✅ Implemented | `backend/tests/` | `cd backend && npm test` |
| 9 | Monitoring and Logging | ✅ Implemented | `backend/controllers/healthController.js`, `backend/middleware/loggerMiddleware.js` | `curl http://localhost:5000/health` |

---

### 14.2 Detailed Experiment Breakdown

---

#### Experiment 1 — Backend CRUD and REST APIs

**What it demonstrates:** Designing and implementing a RESTful API with full CRUD operations, input validation, authentication, and role-based authorization.

**Implemented features:**
- User registration and login with bcrypt password hashing and JWT tokens
- Announcements resource: Create, Read (list + single), Update, Delete
- Events resource: Create, Read (list + single), Update, Delete
- Input validation middleware (missing fields, format checks)
- Centralized error handling (400, 401, 403, 404, 409, 500)
- Role-based access control (Resident vs Administrator)

**Relevant files:**

| File | Purpose |
|------|---------|
| `backend/routes/authRoutes.js` | Register and login endpoints |
| `backend/routes/announcementRoutes.js` | Announcements CRUD routes |
| `backend/routes/eventRoutes.js` | Events CRUD routes |
| `backend/controllers/authController.js` | Register and login logic |
| `backend/controllers/announcementController.js` | Announcements business logic |
| `backend/controllers/eventController.js` | Events business logic |
| `backend/middleware/authMiddleware.js` | JWT token validation |
| `backend/middleware/roleMiddleware.js` | Administrator role check |
| `backend/middleware/validationMiddleware.js` | Request body validation |
| `backend/middleware/errorMiddleware.js` | Centralized error handler |
| `backend/models/User.js` | User schema with password hashing |
| `backend/models/Announcement.js` | Announcement schema |
| `backend/models/Event.js` | Event schema with time validation |

**Verification steps:**

```bash
# 1. Start the backend (MongoDB must be running)
cd backend && npm start

# 2. Check health
curl http://localhost:5000/health

# 3. Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"pass123"}'

# 4. Login and capture token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 5. Fetch announcements (public)
curl http://localhost:5000/api/announcements

# 6. Attempt to create an announcement as Resident (expect 403)
curl -X POST http://localhost:5000/api/announcements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Hello","author":"Me"}'

# 7. Attempt with no token (expect 401)
curl -X POST http://localhost:5000/api/announcements \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Hello","author":"Me"}'
```

---

#### Experiment 2 — Git and GitHub

**What it demonstrates:** Version control best practices, repository organization, branch-based workflows, and the use of `.gitignore` to protect sensitive files.

**Implemented features:**
- Root `.gitignore` excluding `.env` files, `node_modules/`, build artifacts, and logs
- Modular directory structure (frontend/, backend/, k8s/, postman/, .github/)
- CI/CD pipeline configuration stored in the repository under `.github/workflows/`
- `.env.example` files documenting required environment variables without exposing secrets

**Relevant files:**

| File | Purpose |
|------|---------|
| `.gitignore` | Excludes secrets, build artifacts, dependency dirs from version control |
| `backend/.env.example` | Documents required backend environment variables |
| `frontend/.env.example` | Documents required frontend environment variable |
| `.github/workflows/ci-cd.yml` | Pipeline triggered on push/PR events |
| `README.md` | Documents repository structure and branching strategy |

**Verification steps:**

```bash
# 1. Confirm .gitignore is working — these should NOT appear in tracked files
git status                     # node_modules and .env should not appear
git ls-files | grep ".env"     # should return empty

# 2. View commit history
git log --oneline

# 3. Verify .env.example is tracked (template is committed; actual .env is not)
git ls-files backend/.env.example
git ls-files frontend/.env.example

# 4. Check branch structure
git branch -a

# 5. Review pipeline triggers in the workflow file
cat .github/workflows/ci-cd.yml | grep -A 10 "^on:"
```

---

#### Experiment 3 — Docker Container Management

**What it demonstrates:** Building Docker images for each application tier, running multi-container applications with Docker Compose, and managing container lifecycle and logs.

**Implemented features:**
- Multi-stage Dockerfile for the frontend (Node.js build → Nginx serve)
- Single-stage Dockerfile for the backend (node:18-alpine)
- `docker-compose.yml` defining three services: `frontend`, `backend`, `mongodb`
- Bridge network (`communitylink-network`) for inter-container DNS
- Named volume (`communitylink-mongodb-data`) for MongoDB data persistence
- Environment variable injection via `.env` file

**Relevant files:**

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Backend image: node:18-alpine, installs production deps, runs server |
| `frontend/Dockerfile` | Frontend image: build stage with Node, serve stage with Nginx |
| `frontend/nginx.conf` | Nginx config for React SPA routing (all paths → index.html) |
| `docker-compose.yml` | Orchestrates frontend, backend, and mongodb containers |
| `backend/.dockerignore` | Excludes node_modules and .env from Docker build context |
| `frontend/.dockerignore` | Excludes node_modules from Docker build context |

**Key commands:**

```bash
# Build all images
docker compose build

# Build without cache (force fresh build)
docker compose build --no-cache

# Start all containers in detached mode
docker compose up -d

# View running containers
docker compose ps

# Follow logs from all services
docker compose logs -f

# Follow logs from backend only
docker compose logs -f backend

# Execute a command inside a running container
docker exec -it communitylink-backend sh

# Stop containers (preserves MongoDB volume)
docker compose down

# Stop and remove all data volumes
docker compose down -v

# Inspect the MongoDB volume
docker volume inspect communitylink-mongodb-data
```

**Verification steps:**

```bash
# 1. Build and start
docker compose up -d

# 2. Confirm all three containers are running
docker compose ps
# Expected: frontend, backend, mongodb all show status "Up"

# 3. Check backend health through container network
curl http://localhost:5000/health

# 4. Access frontend in browser: http://localhost:3000

# 5. Verify inter-container networking
docker exec communitylink-backend ping -c 2 mongodb

# 6. Verify MongoDB persistence — create data, restart, confirm it's still there
docker compose down
docker compose up -d
curl http://localhost:5000/api/announcements   # data should persist
```

---

#### Experiment 4 — Integrating Docker and Kubernetes

**What it demonstrates:** Translating a Docker Compose multi-container setup into Kubernetes manifests, including Namespace, Deployments, Services, ConfigMaps, Secrets, and PersistentVolumeClaims.

**Implemented features:**
- Dedicated `communitylink` namespace for resource isolation
- ConfigMap for non-sensitive configuration (API URL, port, DB host)
- Secret template for sensitive values (JWT_SECRET)
- PersistentVolumeClaim (5Gi) for MongoDB data
- Deployments for all three tiers with container port definitions
- ClusterIP services for internal backend and MongoDB communication
- LoadBalancer service for external frontend access

**Relevant files:**

| File | Purpose |
|------|---------|
| `k8s/namespace.yaml` | Defines the `communitylink` namespace |
| `k8s/configmap.yaml` | Non-sensitive config: DB host, ports, API URL |
| `k8s/secret.yaml` | Secret template for JWT_SECRET (base64-encoded) |
| `k8s/pvc.yaml` | 5Gi PersistentVolumeClaim for MongoDB |
| `k8s/mongodb-deployment.yaml` | MongoDB Deployment + ClusterIP Service |
| `k8s/backend-deployment.yaml` | Backend Deployment (2 replicas) + ClusterIP Service |
| `k8s/frontend-deployment.yaml` | Frontend Deployment (2 replicas) + LoadBalancer Service |

**Key commands:**

```bash
# Apply all manifests (in dependency order)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Or apply the whole directory
kubectl apply -f k8s/
```

**Verification steps:**

```bash
# 1. Confirm namespace exists
kubectl get namespaces | grep communitylink

# 2. Verify ConfigMap and Secret were created
kubectl get configmap -n communitylink
kubectl get secret -n communitylink

# 3. Verify PVC is bound
kubectl get pvc -n communitylink
# Expected: STATUS = Bound

# 4. List all resources in the namespace
kubectl get all -n communitylink

# 5. Confirm Services are created with correct types
kubectl get services -n communitylink
# Expected: mongodb-service (ClusterIP), backend-service (ClusterIP), frontend-service (LoadBalancer)

# 6. Inspect a ConfigMap value
kubectl describe configmap communitylink-config -n communitylink

# 7. Delete all resources (cleanup)
kubectl delete namespace communitylink
```

---

#### Experiment 5 — Automating Deployment with Kubernetes

**What it demonstrates:** Running highly available workloads with multiple replicas, automatic pod recovery via liveness probes, traffic gating via readiness probes, and zero-downtime rolling updates.

**Implemented features:**
- Backend and frontend each run 2 replicas for load distribution
- Readiness probes gate traffic until pods are confirmed healthy
- Liveness probes trigger automatic pod restart on failure
- Rolling update strategy (default) ensures zero-downtime deployments
- `kubectl scale` to change replica counts at runtime

**Relevant files:**

| File | Probes configured |
|------|-------------------|
| `k8s/backend-deployment.yaml` | Readiness: `GET /health` (delay 10s, period 10s); Liveness: `GET /health` (delay 30s, period 20s) |
| `k8s/frontend-deployment.yaml` | Readiness: `GET /` (delay 5s, period 10s); Liveness: `GET /` (delay 15s, period 20s) |
| `k8s/mongodb-deployment.yaml` | Liveness: `mongosh --eval "db.adminCommand('ping')"` |

**Key commands:**

```bash
# Scale deployments
kubectl scale deployment backend-deployment --replicas=3 -n communitylink
kubectl scale deployment frontend-deployment --replicas=3 -n communitylink

# Trigger a rolling update (e.g., after pushing a new image)
kubectl rollout restart deployment/backend-deployment -n communitylink

# Monitor rolling update progress
kubectl rollout status deployment/backend-deployment -n communitylink

# View rollout history
kubectl rollout history deployment/backend-deployment -n communitylink

# Roll back to the previous version
kubectl rollout undo deployment/backend-deployment -n communitylink
```

**Verification steps:**

```bash
# 1. Confirm 2 backend replicas are running
kubectl get pods -n communitylink -l app=backend
# Expected: 2 pods, both STATUS=Running

# 2. Check probe configuration on the backend deployment
kubectl describe deployment backend-deployment -n communitylink | grep -A 10 "Liveness\|Readiness"

# 3. Simulate pod failure and observe self-healing
BACKEND_POD=$(kubectl get pods -n communitylink -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl delete pod $BACKEND_POD -n communitylink
# Kubernetes should schedule a replacement pod automatically
kubectl get pods -n communitylink -w

# 4. Trigger and observe a rolling update
kubectl set image deployment/backend-deployment \
  backend=<your-dockerhub-username>/communitylink-backend:latest \
  -n communitylink
kubectl rollout status deployment/backend-deployment -n communitylink

# 5. Verify endpoints are still reachable during rollout
curl http://localhost:5000/health   # (via port-forward or service)
```

---

#### Experiment 6 — CI/CD Setup

**What it demonstrates:** Automating the software delivery pipeline — from code commit to test execution, Docker image build, and Kubernetes deployment — using GitHub Actions.

**Implemented features:**
- Pipeline triggers on push to `main`/`develop` and on PRs to `main`
- `test-backend` job: spins up a MongoDB service container, runs Jest tests
- `build-frontend` job: installs deps, runs `npm run build`, uploads artifact
- `docker-build` job (main only): logs in to Docker Hub, builds and pushes both images
- `deploy-k8s` job (main only): applies all K8s manifests and verifies rollout

**Relevant files:**

| File | Purpose |
|------|---------|
| `.github/workflows/ci-cd.yml` | Complete pipeline definition |

**Pipeline flow:**

```
Push/PR
  ├── test-backend    ──┐
  └── build-frontend ──┴──► docker-build (main only) ──► deploy-k8s (main only)
```

**Required secrets** (set under repository Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password or access token |
| `KUBE_CONFIG` | Base64-encoded kubeconfig: `cat ~/.kube/config \| base64` |

**Verification steps:**

```bash
# 1. Push a change to the develop branch and observe tests running
git checkout -b feature/test-ci
echo "# test" >> README.md
git add README.md && git commit -m "ci: trigger pipeline test"
git push origin feature/test-ci
# Open a PR to develop → GitHub Actions tab shows test-backend and build-frontend jobs

# 2. Merge to main and observe full pipeline
# GitHub Actions tab → ci-cd.yml workflow
# Jobs run in order: test-backend + build-frontend → docker-build → deploy-k8s

# 3. Verify the pipeline file locally
cat .github/workflows/ci-cd.yml

# 4. Check that tests pass locally before pushing
cd backend && npm test
```

---

#### Experiment 7 — Manual API Testing with Postman

**What it demonstrates:** Documenting and manually executing API test scenarios using Postman, including authentication flows, CRUD operations, and collection variables.

**Implemented features:**
- Complete Postman collection with requests for all endpoints (auth, announcements, events, health)
- Collection variables: `baseUrl`, `token`, `announcementId`, `eventId`
- Login request includes a test script that automatically saves the JWT token to the `token` variable
- Requests grouped by resource (Auth, Announcements, Events, Health)

**Relevant files:**

| File | Purpose |
|------|---------|
| `postman/CommunityLink_API.postman_collection.json` | Importable Postman collection |

**Verification steps:**

1. Open Postman and click **Import** → select `postman/CommunityLink_API.postman_collection.json`
2. Edit the collection's **Variables** tab — set `baseUrl` to `http://localhost:5000` (or your deployed URL)
3. Ensure the backend is running (`docker compose up -d` or `npm start` in `backend/`)
4. Run requests in this order:

```
Auth / Register User          → expect 201 Created
Auth / Login User             → expect 200 OK; token is saved automatically to {{token}}
Announcements / Get All       → expect 200 with empty array (no announcements yet)
Health / Get Health Status    → expect 200 with status "healthy"
```

5. To test admin operations, promote the registered user to Administrator (see [Section 11.3](#113-testing-as-administrator)), then log in again to refresh the token:

```
Auth / Login User             → refreshes {{token}} with Administrator role
Announcements / Create        → expect 201 Created
Announcements / Get All       → expect 200 with new announcement
Announcements / Update        → expect 200 Updated
Announcements / Delete        → expect 200 Deleted
Events / Create               → expect 201 Created
Events / Get All              → expect 200 with new event
```

---

#### Experiment 8 — Automated API Test Cases

**What it demonstrates:** Writing automated test suites that programmatically verify API correctness, test error conditions, and use an isolated test database.

**Implemented features:**
- Jest test runner with Supertest for HTTP assertions
- Test files cover all middleware layers (auth, role, validation, error, logger)
- Unit tests for Mongoose models (User, Announcement, Event)
- Separate test database to avoid corrupting development data
- Coverage report generated in `backend/coverage/`

**Relevant files:**

| File | What it tests |
|------|--------------|
| `backend/tests/authMiddleware.test.js` | JWT validation, missing/invalid/expired tokens |
| `backend/tests/roleMiddleware.test.js` | Administrator vs Resident role checks |
| `backend/tests/validationMiddleware.test.js` | Input validation for all resources |
| `backend/tests/errorMiddleware.test.js` | Centralized error handler responses |
| `backend/tests/loggerMiddleware.test.js` | Request logging output |
| `backend/tests/user-model.test.js` | Password hashing, comparePassword method |
| `backend/tests/announcement-model.test.js` | Announcement schema validation |
| `backend/tests/event-model.test.js` | Event schema and time format validation |

**Key commands:**

```bash
# Run all tests (single pass, exits with code 0 on pass / 1 on fail)
cd backend
npm test

# Run with coverage report
npm test -- --coverage

# Run a specific test file
npm test -- tests/authMiddleware.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="should return 401"

# Point at a separate test database
MONGODB_URI=mongodb://localhost:27017/communitylink_test npm test
```

**Verification steps:**

```bash
# 1. Start a local MongoDB instance
docker run -d -p 27017:27017 --name mongo-test mongo:6.0

# 2. Run the test suite
cd backend
npm test

# 3. Review test output — all tests should pass
# 4. Open coverage report in browser
open coverage/lcov-report/index.html   # macOS
# or
xdg-open coverage/lcov-report/index.html  # Linux

# 5. Confirm exit code 0 on success
echo "Exit code: $?"
```

---

#### Experiment 9 — Monitoring and Logging

**What it demonstrates:** Implementing application-level health monitoring and structured logging for observability in containerized and orchestrated environments.

**Implemented features:**
- `/health` endpoint returning status, timestamp, uptime, database state, and environment
- Kubernetes liveness and readiness probes consuming `/health`
- Structured stdout request logs: `[timestamp] METHOD /path - STATUS (duration ms)`
- Error logs with `[ERROR]` prefix and descriptive messages
- Intentional omission of sensitive data (passwords, tokens) from all logs

**Relevant files:**

| File | Purpose |
|------|---------|
| `backend/controllers/healthController.js` | `/health` endpoint logic |
| `backend/middleware/loggerMiddleware.js` | Per-request structured logging |
| `backend/middleware/errorMiddleware.js` | Error logging (with `[ERROR]` prefix) |
| `k8s/backend-deployment.yaml` | Liveness + readiness probe config (`/health`) |
| `k8s/frontend-deployment.yaml` | Liveness + readiness probe config (`/`) |
| `k8s/mongodb-deployment.yaml` | MongoDB liveness probe (ping command) |

**Verification steps:**

```bash
# 1. Check health endpoint directly
curl -s http://localhost:5000/health | python3 -m json.tool
# Expected fields: status, timestamp, uptime, database, environment

# 2. Simulate database disconnection and observe status change
#    (stop MongoDB while backend is running, then re-check /health)
docker compose stop mongodb
curl http://localhost:5000/health   # expect {"status":"unhealthy","database":"disconnected"}
docker compose start mongodb
curl http://localhost:5000/health   # expect {"status":"healthy","database":"connected"}

# 3. Observe request logs in real time
docker compose logs -f backend
# In another terminal, make a few API calls and watch log output

# 4. Check Kubernetes probe configuration
kubectl describe deployment backend-deployment -n communitylink | grep -A 8 "Liveness\|Readiness"

# 5. Observe pod logs in Kubernetes
kubectl logs -f deployment/backend-deployment -n communitylink

# 6. Verify sensitive data is absent from logs
#    (logs should show paths and status codes, never passwords or tokens)
docker compose logs backend | grep -i "password"   # should return nothing
docker compose logs backend | grep -i "Bearer"     # should return nothing
```

---

### 14.3 Features Not Implemented (Optional)

The following modules were identified in the project scope but are **not implemented**. They are not required to satisfy any laboratory experiment objective.

| Feature | Description | Why Optional |
|---------|-------------|--------------|
| Community forums | Discussion threads for residents | Beyond MVP scope; no lab experiment requires it |
| Polls and surveys | Resident voting functionality | Beyond MVP scope |
| Facility booking | Reservation system for common areas | Beyond MVP scope |
| Visitor management | Guest pre-registration and tracking | Beyond MVP scope |
| Email notifications | Email alerts for announcements/events | Requires external SMTP service |
| Admin promotion UI | Web interface for changing user roles | Workaround: direct MongoDB update documented in [Section 11.3](#113-testing-as-administrator) |
| JWT refresh tokens | Automatic token renewal before expiry | Workaround: log in again after 24-hour expiry |
| HTTPS/TLS | Encrypted transport layer | Requires cert-manager or reverse proxy; not needed for local lab evaluation |
| Ingress controller | Path/hostname-based routing in K8s | LoadBalancer service is sufficient for lab purposes |
| Rate limiting | Request throttling via `express-rate-limit` | Not required for lab evaluation; recommended for production |

---

## 15. Known Limitations

- **Single MongoDB replica**: The K8s `mongodb-deployment.yaml` uses 1 replica. For production, use a `StatefulSet` with a MongoDB replica set for high availability.
- **No HTTPS/TLS**: The application communicates over plain HTTP. In production, add a TLS-terminating reverse proxy or Ingress controller with cert-manager.
- **No Ingress**: The frontend is exposed via a `LoadBalancer` service. For path-based or hostname-based routing, add a Kubernetes Ingress resource.
- **Build-time API URL**: `REACT_APP_API_URL` is embedded at Docker build time by `react-scripts`. Changing the backend URL requires rebuilding the frontend image.
- **Manual role promotion**: There is no admin UI or API endpoint for promoting users to `Administrator`. Role changes must be done directly in MongoDB.
- **No refresh tokens**: JWTs expire after 24 hours with no refresh mechanism. Users must log in again after expiry.
- **No rate limiting**: The API does not implement request rate limiting. Add `express-rate-limit` for production deployments.
- **Test coverage**: Optional automated tests (Task 10) are not included in the default setup. Run `npm test` in the backend to execute the existing middleware/model unit tests.
