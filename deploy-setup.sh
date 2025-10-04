#!/bin/bash

# 🚀 Quick Deployment Setup Script

echo "🎯 Preparing NotebookLM Clone for Deployment..."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Prepare for deployment"
else
    echo "✅ Git repository already initialized"
fi

echo ""
echo "📝 Deployment Checklist:"
echo ""
echo "1. ✅ API configuration created (Frontend/src/config/api.js)"
echo "2. ✅ Production env file created (Frontend/.env.production)"
echo "3. ✅ Frontend components updated to use API_BASE_URL"
echo "4. ✅ Backend CORS updated for production"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Create a GitHub repository:"
echo "   - Go to https://github.com/new"
echo "   - Create a new repository (e.g., 'notebooklm-clone')"
echo "   - Copy the repository URL"
echo ""
echo "2. Push your code to GitHub:"
echo "   git remote add origin YOUR_GITHUB_URL"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy Backend on Render:"
echo "   - Go to https://render.com"
echo "   - New Web Service"
echo "   - Connect your GitHub repo"
echo "   - Root Directory: server"
echo "   - Build: npm install"
echo "   - Start: npm start"
echo "   - Add environment variables (see DEPLOYMENT_GUIDE.md)"
echo ""
echo "4. Deploy Frontend on Render:"
echo "   - New Static Site"
echo "   - Root Directory: Frontend"
echo "   - Build: npm install && npm run build"
echo "   - Publish: dist"
echo "   - Add VITE_API_URL with your backend URL"
echo ""
echo "5. Update Frontend/.env.production with your backend URL"
echo ""
echo "📚 Full guide: See DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Good luck with your deployment!"
