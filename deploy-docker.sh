#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🐳 Docker Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker found${NC}"

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker daemon is not running. Please start Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker daemon is running${NC}\n"

# Function to display menu
show_menu() {
    echo -e "${BLUE}Select deployment option:${NC}"
    echo "1) Development (docker-compose.dev.yml)"
    echo "2) Production (docker-compose.yml)"
    echo "3) Build production image"
    echo "4) Push to Docker Hub"
    echo "5) Stop all containers"
    echo "6) View logs"
    echo "7) Enter container shell"
    echo "8) Clean up (remove containers & volumes)"
    echo "9) Exit"
    echo ""
    read -p "Enter choice (1-9): " choice
}

# Development deployment
deploy_dev() {
    echo -e "${BLUE}\n▶️  Starting Development Deployment...${NC}\n"
    
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
        cp .env.docker.example .env
        echo -e "${YELLOW}⚠️  Please update .env file with your values${NC}"
        nano .env || vi .env
    fi
    
    echo -e "${BLUE}Starting containers...${NC}"
    docker-compose -f docker-compose.dev.yml up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Development environment started successfully!${NC}\n"
        echo -e "${BLUE}Service Information:${NC}"
        echo "Backend:  http://localhost:5000"
        echo "MongoDB:  mongodb://admin:password@localhost:27017/aiStudy"
        echo ""
        echo -e "${BLUE}Useful commands:${NC}"
        echo "View logs:    docker-compose -f docker-compose.dev.yml logs -f"
        echo "Stop:         docker-compose -f docker-compose.dev.yml down"
        echo "Shell:        docker-compose -f docker-compose.dev.yml exec backend bash"
    else
        echo -e "${RED}❌ Failed to start development environment${NC}"
        exit 1
    fi
}

# Production deployment
deploy_prod() {
    echo -e "${BLUE}\n▶️  Starting Production Deployment...${NC}\n"
    
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ .env file not found!${NC}"
        echo -e "${YELLOW}Please create .env with production values using .env.docker.example as template${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  Make sure all production values are set in .env${NC}\n"
    read -p "Continue with production deployment? (y/n): " confirm
    
    if [ "$confirm" != "y" ]; then
        echo "Deployment cancelled."
        return
    fi
    
    echo -e "${BLUE}Starting containers...${NC}"
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Production environment started successfully!${NC}\n"
        echo -e "${BLUE}Service Information:${NC}"
        docker-compose ps
        echo ""
        echo -e "${BLUE}Useful commands:${NC}"
        echo "View logs:    docker-compose logs -f"
        echo "Stop:         docker-compose down"
        echo "Restart:      docker-compose restart"
    else
        echo -e "${RED}❌ Failed to start production environment${NC}"
        exit 1
    fi
}

# Build production image
build_image() {
    echo -e "${BLUE}\n▶️  Building Production Image...${NC}\n"
    
    read -p "Enter image name (default: ai-study-backend): " image_name
    image_name=${image_name:-ai-study-backend}
    
    read -p "Enter image tag (default: latest): " image_tag
    image_tag=${image_tag:-latest}
    
    echo -e "${BLUE}Building image: ${image_name}:${image_tag}${NC}"
    
    docker build -t ${image_name}:${image_tag} .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Image built successfully!${NC}\n"
        echo "Image: ${image_name}:${image_tag}"
        echo ""
        echo -e "${BLUE}Useful commands:${NC}"
        echo "List images:        docker images"
        echo "Run image:          docker run -p 5000:5000 ${image_name}:${image_tag}"
        echo "Push to registry:   docker tag ${image_name}:${image_tag} registry/${image_name}:${image_tag}"
    else
        echo -e "${RED}❌ Failed to build image${NC}"
        exit 1
    fi
}

# Push to Docker Hub
push_docker_hub() {
    echo -e "${BLUE}\n▶️  Pushing to Docker Hub...${NC}\n"
    
    # Check if logged in
    if ! docker info | grep -q "Username"; then
        echo -e "${BLUE}Please login to Docker Hub${NC}"
        docker login
    fi
    
    read -p "Enter Docker Hub username: " docker_user
    read -p "Enter image name: " image_name
    read -p "Enter image tag (default: latest): " image_tag
    image_tag=${image_tag:-latest}
    
    full_image_name="${docker_user}/${image_name}:${image_tag}"
    
    echo -e "${BLUE}Tagging image...${NC}"
    docker tag ${image_name}:${image_tag} ${full_image_name}
    
    echo -e "${BLUE}Pushing to Docker Hub...${NC}"
    docker push ${full_image_name}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Image pushed successfully to ${full_image_name}${NC}"
    else
        echo -e "${RED}❌ Failed to push image${NC}"
        exit 1
    fi
}

# Stop containers
stop_containers() {
    echo -e "${BLUE}\n▶️  Stopping containers...${NC}\n"
    
    echo "1) Stop development containers"
    echo "2) Stop production containers"
    echo "3) Stop all containers"
    read -p "Enter choice (1-3): " stop_choice
    
    case $stop_choice in
        1)
            docker-compose -f docker-compose.dev.yml down
            echo -e "${GREEN}✅ Development containers stopped${NC}"
            ;;
        2)
            docker-compose down
            echo -e "${GREEN}✅ Production containers stopped${NC}"
            ;;
        3)
            docker stop $(docker ps -q)
            echo -e "${GREEN}✅ All containers stopped${NC}"
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
}

# View logs
view_logs() {
    echo -e "${BLUE}\n▶️  Viewing Logs...${NC}\n"
    
    echo "1) Development logs"
    echo "2) Production logs"
    echo "3) Backend logs only"
    echo "4) MongoDB logs only"
    read -p "Enter choice (1-4): " log_choice
    
    case $log_choice in
        1)
            docker-compose -f docker-compose.dev.yml logs -f
            ;;
        2)
            docker-compose logs -f
            ;;
        3)
            docker-compose logs -f backend
            ;;
        4)
            docker-compose logs -f mongodb
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
}

# Enter container shell
enter_shell() {
    echo -e "${BLUE}\n▶️  Entering Container Shell...${NC}\n"
    
    # List running containers
    echo "Running containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    echo ""
    
    read -p "Enter container name or ID: " container_id
    
    docker exec -it ${container_id} /bin/sh
}

# Cleanup
cleanup() {
    echo -e "${YELLOW}\n⚠️  Warning: This will remove containers and volumes!${NC}\n"
    read -p "Continue? (y/n): " confirm
    
    if [ "$confirm" != "y" ]; then
        return
    fi
    
    echo -e "${BLUE}Removing Docker resources...${NC}"
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main loop
while true; do
    show_menu
    
    case $choice in
        1) deploy_dev ;;
        2) deploy_prod ;;
        3) build_image ;;
        4) push_docker_hub ;;
        5) stop_containers ;;
        6) view_logs ;;
        7) enter_shell ;;
        8) cleanup ;;
        9)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
