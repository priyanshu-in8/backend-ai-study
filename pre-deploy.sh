#!/bin/bash

# 🚀 Pre-Deployment Verification Script
# Run this before deploying to production

echo "================================"
echo "🚀 Pre-Deployment Checklist"
echo "================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Create .env with all required environment variables"
    exit 1
else
    echo "✅ .env file exists"
fi

# Check if NODE_ENV is set to production
if grep -q "NODE_ENV=production" .env; then
    echo "✅ NODE_ENV is set to production"
else
    echo "⚠️  WARNING: NODE_ENV is NOT set to production"
    echo "   Update .env: NODE_ENV=production"
fi

# Check if JWT_SECRET is set
if grep -q "JWT_SECRET=" .env; then
    JWT_LEN=$(grep "JWT_SECRET=" .env | cut -d'=' -f2 | wc -c)
    if [ $JWT_LEN -lt 32 ]; then
        echo "⚠️  WARNING: JWT_SECRET is less than 32 characters"
    else
        echo "✅ JWT_SECRET configured"
    fi
else
    echo "❌ JWT_SECRET not found in .env"
    exit 1
fi

# Check if MONGODB_URI is set
if grep -q "MONGODB_URI=" .env; then
    echo "✅ MONGODB_URI configured"
else
    echo "❌ MONGODB_URI not found in .env"
    exit 1
fi

# Check if Gemini API key is set
if grep -q "GEMINI_API_KEY=" .env; then
    echo "✅ GEMINI_API_KEY configured"
else
    echo "⚠️  WARNING: GEMINI_API_KEY not set"
fi

# Check if CLIENT_URL is set to production domain
if grep -q "CLIENT_URL=http://localhost" .env; then
    echo "⚠️  WARNING: CLIENT_URL is still pointing to localhost"
    echo "   Update to production domain"
elif grep -q "CLIENT_URL=" .env; then
    echo "✅ CLIENT_URL configured"
else
    echo "❌ CLIENT_URL not found"
    exit 1
fi

# Check if package.json has start script
if grep -q '"start"' package.json; then
    echo "✅ Start script configured"
else
    echo "❌ Start script not found in package.json"
    exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  node_modules not found. Run: npm install"
fi

echo ""
echo "================================"
echo "✅ Deployment Checklist Complete!"
echo "================================"
echo ""
echo "📋 Next Steps:"
echo "   1. Review all ⚠️  warnings above"
echo "   2. Verify all API keys are valid"
echo "   3. Test the application: npm start"
echo "   4. Push to your deployment platform"
echo ""
