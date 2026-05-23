#!/bin/bash

# AI Study Navigator Backend Setup Script

echo "🚀 AI Study Navigator Backend Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please configure your .env file with the required credentials:"
    echo "   - MONGODB_URI"
    echo "   - EMAIL_USER and EMAIL_PASS (Gmail or Mailtrap)"
    echo "   - GEMINI_API_KEY"
    echo "   - JWT_SECRET"
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env file with your credentials"
echo "   2. Run: npm run dev (for development)"
echo "   3. Server will start on http://localhost:5000"
echo ""
echo "📚 Documentation: See README.md"
