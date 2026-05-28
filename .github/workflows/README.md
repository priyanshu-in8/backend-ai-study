# GitHub Actions Workflows

This directory contains CI/CD workflows for Docker deployment.

## Workflows

### docker-build.yml
Automatically builds and pushes Docker image to Docker Hub on:
- Push to main/production branches
- Semantic version tags (v1.0.0)

**Setup Required:**
1. Create Docker Hub account
2. Add these secrets to your GitHub repository:
   - `DOCKER_HUB_USERNAME`: Your Docker Hub username
   - `DOCKER_HUB_PASSWORD`: Your Docker Hub Personal Access Token

**To add secrets:**
1. Go to: Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add the secrets above

Once configured, the workflow will automatically run and push images to:
`docker_username/ai-study-backend:latest`
`docker_username/ai-study-backend:v1.0.0`
