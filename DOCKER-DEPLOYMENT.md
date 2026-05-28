# 🐳 Docker Deployment Guide

## Prerequisites

1. **Docker installed**: [Download Docker](https://www.docker.com/products/docker-desktop)
2. **Docker Compose installed**: Usually comes with Docker Desktop
3. **.env file configured** with all required variables

## Project Structure

```
backend/
├── Dockerfile              # Production image definition
├── .dockerignore          # Files to exclude from Docker build
├── docker-compose.yml     # Production setup
├── docker-compose.dev.yml # Development setup
└── ... (other files)
```

## Quick Start - Development

### Option 1: Using Docker Compose (Recommended)

```bash
# Navigate to backend directory
cd backend

# Start services (backend + MongoDB)
docker-compose -f docker-compose.dev.yml up

# In another terminal, create dev user (optional)
docker-compose -f docker-compose.dev.yml exec backend node create-dev-user.js

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Option 2: Manual Docker Commands

```bash
# Build image
docker build -t ai-study-backend:latest .

# Run container
docker run -p 5000:5000 \
  -e MONGODB_URI="mongodb://localhost:27017/aiStudy" \
  -e JWT_SECRET="your-secret-key" \
  --name ai-study-backend \
  ai-study-backend:latest

# View logs
docker logs -f ai-study-backend

# Stop container
docker stop ai-study-backend
docker rm ai-study-backend
```

## Production Deployment

### Option 1: Docker Compose Production

```bash
# Setup environment
cp .env.example .env
# Edit .env with production values

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Option 2: Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Build image with tag
docker build -t yourusername/ai-study-backend:1.0.0 .

# Push to Docker Hub
docker push yourusername/ai-study-backend:1.0.0

# Pull and run on any machine
docker run -d \
  -p 5000:5000 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e JWT_SECRET="your-secret" \
  yourusername/ai-study-backend:1.0.0
```

### Option 3: Docker Registry/Private Registry

```bash
# Tag image for private registry
docker tag ai-study-backend:latest registry.example.com/ai-study-backend:latest

# Push to private registry
docker push registry.example.com/ai-study-backend:latest

# Pull and run
docker run -d registry.example.com/ai-study-backend:latest
```

## Environment Variables

Create `.env` file in backend directory:

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aiStudy

# Authentication
JWT_SECRET=your-super-secret-key-change-this

# Client URL
CLIENT_URL=https://yourdomain.com

# AI Services
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Database Auth (for docker-compose)
MONGO_USERNAME=admin
MONGO_PASSWORD=your-secure-password
MONGO_DB_NAME=aiStudy
```

## Docker Commands Cheat Sheet

### Container Management

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# View container logs
docker logs container_id
docker logs -f container_id          # Follow logs
docker logs --tail 100 container_id  # Last 100 lines

# Execute command in container
docker exec -it container_id bash
docker exec container_id node create-dev-user.js

# Stop/Start container
docker stop container_id
docker start container_id
docker restart container_id

# Remove container
docker rm container_id

# View container stats
docker stats container_id
```

### Image Management

```bash
# List images
docker images

# Build image
docker build -t image_name:tag .
docker build --no-cache -t image_name:tag .

# Remove image
docker rmi image_id

# Push to registry
docker tag local_image registry/image:tag
docker push registry/image:tag

# Pull from registry
docker pull registry/image:tag
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart backend

# Execute command
docker-compose exec backend bash

# View services status
docker-compose ps

# Remove volumes (caution!)
docker-compose down -v
```

## Health Checks

The container includes a health check that runs every 30 seconds:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' container_id

# View health logs
docker inspect container_id | grep -A 20 "Health"
```

## Volumes & Persistence

### Development
- Code synced live with volume mount
- MongoDB data stored in volume

### Production
- Application code baked into image
- MongoDB data persisted in named volume
- Logs stored in volume

```bash
# View volumes
docker volume ls

# Inspect volume
docker volume inspect volume_name

# Clean up unused volumes
docker volume prune
```

## Networking

Services communicate via service name in docker-compose:

```bash
# Backend connects to MongoDB at: mongodb:27017
# Inside container: mongodb://admin:password@mongodb:27017/aiStudy?authSource=admin
```

## Security Best Practices

✅ **Implemented:**
- Non-root user (nodejs)
- Multi-stage builds (reduce image size)
- .dockerignore file
- Environment variables for secrets
- Health checks

✅ **Additional Recommendations:**
- Use secrets management (Docker Secrets, HashiCorp Vault)
- Scan images: `docker scan image_name`
- Use private registries
- Keep base images updated
- Regular security updates

## Troubleshooting

### Container won't start
```bash
docker logs container_id
```

### Port already in use
```bash
# Find process using port
lsof -i :5000
# Kill process
kill -9 PID

# Or use different port
docker run -p 5001:5000 ...
```

### MongoDB connection issues
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Test connection from backend
docker-compose exec backend npm run validate
```

### Out of disk space
```bash
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune
```

## Deployment to Cloud Platforms

### AWS ECS
```bash
# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag ai-study-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/ai-study-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/ai-study-backend:latest
```

### Google Cloud Run
```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/ai-study-backend
gcloud run deploy ai-study-backend --image gcr.io/PROJECT_ID/ai-study-backend --platform managed
```

### Azure Container Instances
```bash
# Build and push to ACR
az acr build --registry myregistry --image ai-study-backend:latest .
az container create --resource-group mygroup --name ai-study-backend --image myregistry.azurecr.io/ai-study-backend:latest
```

### DigitalOcean
```bash
# Use docker-compose with DigitalOcean App Platform
# Upload docker-compose.yml via dashboard
```

## Performance Monitoring

```bash
# View container resource usage
docker stats

# View container process
docker top container_id

# View network stats
docker network inspect ai-study-network
```

## Next Steps

1. ✅ Review and update `.env` file
2. ✅ Test locally with `docker-compose up`
3. ✅ Build and test production image: `docker build -t ai-study-backend:prod .`
4. ✅ Push to registry
5. ✅ Deploy to cloud platform
6. ✅ Monitor logs and performance
7. ✅ Set up CI/CD pipeline

---

**Last Updated:** 23 May 2026
