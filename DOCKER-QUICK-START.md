# 🚀 Docker Deployment - Quick Reference

## Files Created

```
backend/
├── Dockerfile                    # Multi-stage production image
├── .dockerignore                 # Files to exclude from image
├── docker-compose.yml            # Production setup (with MongoDB)
├── docker-compose.dev.yml        # Development setup (with hot reload)
├── .env.docker.example           # Environment template
├── deploy-docker.sh              # Interactive deployment script
└── DOCKER-DEPLOYMENT.md          # Detailed Docker guide
```

## 🎯 Quick Start - 3 Ways to Deploy

### Way 1️⃣ : Using Interactive Script (Easiest)

```bash
cd backend
./deploy-docker.sh
# Follow interactive menu
```

### Way 2️⃣ : Docker Compose Commands

**Development:**
```bash
# Start with hot reload
docker-compose -f docker-compose.dev.yml up

# In another terminal - create dev user
docker-compose -f docker-compose.dev.yml exec backend node create-dev-user.js
```

**Production:**
```bash
# Start production containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Way 3️⃣ : Manual Docker Commands

```bash
# Build image
docker build -t ai-study-backend:latest .

# Run with environment
docker run -d \
  -p 5000:5000 \
  -e MONGODB_URI="mongodb://..." \
  -e JWT_SECRET="your-secret" \
  --name ai-study-backend \
  ai-study-backend:latest
```

## 📋 Pre-Deployment Checklist

- [ ] Docker installed and running
- [ ] `cp .env.docker.example .env`
- [ ] Update `.env` with your values:
  - `MONGODB_URI` (MongoDB Atlas or local)
  - `JWT_SECRET` (strong random string)
  - `GEMINI_API_KEY`
  - `OPENAI_API_KEY`
  - `EMAIL_USER` & `EMAIL_PASS`
  - `CLIENT_URL` (your frontend URL)
- [ ] Test environment: `npm run validate`

## 🎮 Interactive Script Menu

```
1) Start Development (with hot reload + MongoDB)
2) Start Production (optimized)
3) Build production image
4) Push to Docker Hub
5) Stop all containers
6) View logs
7) Enter container shell
8) Clean up (remove containers & volumes)
9) Exit
```

## 📊 Service URLs & Credentials

After running `docker-compose up`:

```
Backend:    http://localhost:5000
MongoDB:    mongodb://admin:password@localhost:27017/aiStudy
           (in container: mongodb://admin:password@mongodb:27017/aiStudy)
```

## 📝 Common Docker Commands

```bash
# View running containers
docker ps

# View logs
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend bash

# Restart service
docker-compose restart backend

# View container stats
docker stats

# Connect to MongoDB
docker-compose exec mongodb mongosh -u admin -p

# Create dev user
docker-compose exec backend node create-dev-user.js

# Validate environment
docker-compose exec backend npm run validate
```

## 🔐 Environment Variables

Must set in `.env`:

| Variable | Required | Example |
|----------|----------|---------|
| NODE_ENV | Yes | production |
| PORT | Yes | 5000 |
| MONGODB_URI | Yes | mongodb+srv://user:pass@cluster.mongodb.net/aiStudy |
| JWT_SECRET | Yes | min-32-character-random-string |
| CLIENT_URL | Yes | https://yourdomain.com |
| GEMINI_API_KEY | Yes | your-gemini-key |
| OPENAI_API_KEY | Yes | your-openai-key |
| EMAIL_USER | Yes | your-email@gmail.com |
| EMAIL_PASS | Yes | app-password |

## 🐛 Troubleshooting

**Port 5000 already in use:**
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>
```

**MongoDB won't connect:**
```bash
# Check MongoDB logs
docker-compose logs mongodb

# Test from backend
docker-compose exec backend npm run validate
```

**Container crashes:**
```bash
# View logs
docker logs container_name

# Check .env file
cat .env
```

**Volume permission issues:**
```bash
# Fix ownership
docker-compose exec backend chown -R nodejs:nodejs /app
```

## 🚀 Deployment to Cloud

### Push to Docker Hub
```bash
./deploy-docker.sh
# Select option 4
```

### Deploy to AWS
```bash
# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag ai-study-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/ai-study-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/ai-study-backend:latest
```

### Deploy to Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT/ai-study-backend
gcloud run deploy ai-study-backend --image gcr.io/PROJECT/ai-study-backend
```

## 📚 Documentation

For detailed information, read: `DOCKER-DEPLOYMENT.md`

---

**Last Updated:** 23 May 2026
