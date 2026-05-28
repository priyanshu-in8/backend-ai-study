# 🐳 Docker Deployment - Complete Setup Guide

## 📦 What's Been Created

Your backend is now fully Docker-ready with the following files:

```
backend/
├── Dockerfile                      # Production-optimized image
├── .dockerignore                   # Files excluded from Docker image
├── docker-compose.yml              # Production environment (Backend + MongoDB)
├── docker-compose.dev.yml          # Development environment (Hot reload)
├── .env.docker.example             # Environment template
├── deploy-docker.sh                # Interactive deployment script
├── DOCKER-DEPLOYMENT.md            # Detailed Docker guide
├── DOCKER-QUICK-START.md           # Quick reference
└── .github/workflows/docker-build.yml  # CI/CD for auto builds
```

## 🚀 Get Started in 5 Minutes

### Step 1: Setup Environment
```bash
cd backend
cp .env.docker.example .env
```

### Step 2: Edit `.env` with Your Values
```bash
nano .env  # or open in VS Code
```

**Minimum required settings:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aiStudy
JWT_SECRET=your-super-secret-key-min-32-chars
GEMINI_API_KEY=your-key
OPENAI_API_KEY=your-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CLIENT_URL=http://localhost:5173
```

### Step 3: Run Docker
```bash
# Development (with hot reload)
docker-compose -f docker-compose.dev.yml up

# OR Production
docker-compose up -d
```

### Step 4: Verify
```bash
# Check services
docker-compose ps

# View logs
docker-compose logs -f

# Test backend
curl http://localhost:5000/health
```

## 🎮 Interactive Deployment Script

Make deployment super easy:

```bash
./deploy-docker.sh
```

Menu options:
1. **Development** - Start with hot reload + MongoDB
2. **Production** - Start optimized containers
3. **Build** - Create production image
4. **Push** - Push to Docker Hub
5. **Stop** - Stop containers
6. **Logs** - View container logs
7. **Shell** - Enter container shell
8. **Cleanup** - Remove containers & volumes

## 📊 Service Endpoints

After starting services:

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend | http://localhost:5000 | - |
| MongoDB | mongodb://localhost:27017 | admin / password |
| MongoDB Web (in container) | mongodb://mongodb:27017 | - |

## 🔧 Docker Compose Usage

### Development (with hot code reload)
```bash
# Start
docker-compose -f docker-compose.dev.yml up

# Stop
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Execute command
docker-compose -f docker-compose.dev.yml exec backend bash
```

### Production
```bash
# Start (background)
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend
```

## 🛠️ Useful Docker Commands

### Container Management
```bash
# List running containers
docker ps

# List all containers
docker ps -a

# View logs (last 100 lines)
docker logs --tail 100 container_id

# Follow logs in real-time
docker logs -f container_id

# Execute command
docker exec -it container_id bash

# Stop/Start
docker stop container_id
docker start container_id

# Remove container
docker rm container_id
```

### Image Management
```bash
# List images
docker images

# Build image
docker build -t ai-study-backend:latest .

# Build without cache
docker build --no-cache -t ai-study-backend:latest .

# Remove image
docker rmi image_id

# Push to Docker Hub
docker push username/ai-study-backend:latest

# Pull from Docker Hub
docker pull username/ai-study-backend:latest
```

### Cleanup
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a
```

## 🚢 Deployment to Cloud Platforms

### Option 1: Docker Hub (Recommended for Beginners)

**Local Build & Push:**
```bash
# Build locally
docker build -t yourusername/ai-study-backend:1.0.0 .

# Push to Docker Hub
docker push yourusername/ai-study-backend:1.0.0

# Pull and run anywhere
docker run -d \
  -p 5000:5000 \
  -e MONGODB_URI="your-uri" \
  yourusername/ai-study-backend:1.0.0
```

### Option 2: GitHub Actions (Automatic Builds)

Already configured! Just add secrets:

1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add:
   - `DOCKER_HUB_USERNAME`
   - `DOCKER_HUB_PASSWORD`
3. Push to main branch → Automatic build & push!

### Option 3: AWS ECS

```bash
# Login to AWS ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag ai-study-backend:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/ai-study-backend:latest

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/ai-study-backend:latest

# Deploy using docker-compose
docker-compose -f docker-compose.yml up
```

### Option 4: Google Cloud Run

```bash
# Authenticate
gcloud auth login

# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/ai-study-backend

# Deploy
gcloud run deploy ai-study-backend \
  --image gcr.io/PROJECT_ID/ai-study-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars MONGODB_URI=your-uri,JWT_SECRET=your-secret
```

### Option 5: Azure Container Instances

```bash
# Create registry
az acr create --resource-group mygroup --name myregistry --sku Basic

# Build and push
az acr build --registry myregistry --image ai-study-backend:latest .

# Deploy
az container create \
  --resource-group mygroup \
  --name ai-study-backend \
  --image myregistry.azurecr.io/ai-study-backend:latest \
  --ports 5000 \
  --environment-variables MONGODB_URI=your-uri
```

### Option 6: DigitalOcean App Platform

```bash
# 1. Commit code to GitHub
git push origin main

# 2. In DigitalOcean Dashboard:
# - Click "Apps" → "Create App"
# - Connect GitHub repo
# - Select "backend" folder
# - Set environment variables
# - Deploy!
```

### Option 7: Railway.app (Easiest)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize
railway init

# 4. Deploy
railway up

# 5. Set environment variables in dashboard
```

## 🔐 Security Best Practices

✅ **Already Implemented:**
- Non-root user in container
- Multi-stage builds (smaller image)
- Health checks
- Environment variables for secrets
- .dockerignore for excluding unnecessary files

✅ **Recommended Additional Steps:**
- Use secrets management (Docker Secrets, Vault)
- Scan images: `docker scan image_name`
- Enable Docker Content Trust
- Keep base images updated
- Use private registries for sensitive apps
- Implement rate limiting
- Enable SSL/TLS

## 📈 Monitoring & Logging

### View Container Resources
```bash
# Real-time stats
docker stats

# Specific container
docker stats container_id --no-stream
```

### Logs
```bash
# View logs
docker logs container_id

# Follow logs
docker logs -f container_id

# Last 50 lines
docker logs --tail 50 container_id

# With timestamps
docker logs -t container_id

# Since timestamp
docker logs --since 2026-05-23T10:00:00 container_id
```

### Health Check
```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' container_id

# View health logs
docker inspect container_id | grep -A 10 "Health"
```

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs container_id

# Check environment
docker exec container_id env | grep -E "MONGODB|JWT"

# Validate .env file
cat .env
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

### MongoDB connection failed
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Test MongoDB connection
docker-compose exec backend npm run validate

# Check network
docker network ls
docker network inspect ai-study-network
```

### Out of disk space
```bash
# Clean up Docker
docker system prune -a --volumes
docker image prune -a
```

### Permission denied
```bash
# Fix file permissions
docker-compose exec backend chown -R nodejs:nodejs /app

# Fix volume permissions
sudo chown -R 1001:1001 ./data
```

## 📋 Pre-Deployment Checklist

- [ ] Docker installed and running
- [ ] All dependencies installed: `npm install`
- [ ] `.env` file created and configured
- [ ] Test environment: `npm run validate`
- [ ] MongoDB connection tested
- [ ] Email service configured
- [ ] API keys configured (Gemini, OpenAI)
- [ ] JWT_SECRET set to strong random value
- [ ] CLIENT_URL configured correctly
- [ ] Server.js has health check endpoint
- [ ] All environment variables in .env match requirements
- [ ] .dockerignore configured
- [ ] docker-compose.yml configured
- [ ] Dockerfile tested locally
- [ ] GitHub Actions secrets configured (optional)

## 📚 Additional Resources

| Document | Purpose |
|----------|---------|
| `DOCKER-DEPLOYMENT.md` | Detailed Docker guide |
| `DOCKER-QUICK-START.md` | Quick reference |
| `README.md` | Project overview |
| `DEPLOYMENT-READY.md` | General deployment |
| `.env.docker.example` | Environment template |

## 🎯 Next Steps

1. **Local Testing**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   # Test API endpoints
   ```

2. **Build Production Image**
   ```bash
   docker build -t ai-study-backend:prod .
   ```

3. **Push to Registry**
   ```bash
   docker tag ai-study-backend:prod yourusername/ai-study-backend:1.0.0
   docker push yourusername/ai-study-backend:1.0.0
   ```

4. **Deploy to Cloud**
   - Choose platform (AWS, GCP, Azure, Railway, etc.)
   - Follow platform-specific steps above

5. **Monitor & Maintain**
   - Check logs regularly
   - Update base images
   - Monitor resource usage
   - Backup data

## 💡 Tips & Tricks

### Use Health Check
```bash
# Backend includes health check
curl http://localhost:5000/health
```

### Quick Commands Alias
```bash
# Add to .zshrc or .bashrc
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'
alias dcexec='docker-compose exec backend bash'
```

### Multi-Container Debugging
```bash
# Run only backend
docker-compose up backend

# Run only MongoDB
docker-compose up mongodb

# Run specific service
docker-compose up -d backend && docker-compose logs -f backend
```

### Development with Auto-reload
```bash
# Use docker-compose.dev.yml with volume mounts
# Code changes auto-reload without container restart
docker-compose -f docker-compose.dev.yml up
```

---

**Last Updated:** 23 May 2026  
**Status:** ✅ Production Ready
