# 🚀 Deployment Guide - Render.com

## Why Render.com?

✅ **FREE** tier forever
✅ Supports full-stack apps (frontend + backend)
✅ Handles file uploads perfectly
✅ Free subdomain: `yourapp.onrender.com`
✅ Automatic SSL/HTTPS
✅ Easy GitHub integration
✅ Environment variables support

---

## 📋 Pre-Deployment Checklist

### 1. Prepare Your Code

#### Backend Changes Needed:

**File: `server/index.js`**

Add this at the top to handle production:
```javascript
const PORT = process.env.PORT || 3000;

// Update CORS for production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

**File: `server/.env`** (keep this local, we'll add to Render later)
```
LLAMA_PARSE_API_KEY=your_key_here
CHROMA_API_KEY=your_key_here
CHROMA_TENANT=your_tenant
CHROMA_DATABASE=your_database
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

#### Frontend Changes Needed:

**File: `Frontend/src/config/api.js`** (create this file)
```javascript
// API base URL - switches between local and production
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

**File: `Frontend/.env.production`** (create this file)
```
VITE_API_URL=https://your-backend.onrender.com
```

**Update all API calls** in your components to use this:
```javascript
import { API_BASE_URL } from '../config/api';

// Change from:
axios.post('http://localhost:3000/api/chat', ...)

// To:
axios.post(`${API_BASE_URL}/api/chat`, ...)
```

### 2. Update .gitignore

Make sure you have:
```
node_modules/
.env
.env.local
.env.production
uploads/
dist/
build/
```

---

## 🔧 Step-by-Step Deployment

### Step 1: Push to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Prepare for deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend on Render

1. **Go to [render.com](https://render.com)** and sign up (free)

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**

4. **Configure the backend:**
   ```
   Name: notebooklm-backend
   Region: Choose closest to you
   Branch: main
   Root Directory: server
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

5. **Add Environment Variables:**
   Click "Environment" and add:
   ```
   LLAMA_PARSE_API_KEY=your_actual_key
   CHROMA_API_KEY=your_actual_key
   CHROMA_TENANT=your_tenant
   CHROMA_DATABASE=your_database
   GEMINI_API_KEY=your_actual_key
   GEMINI_MODEL=gemini-2.5-flash
   PORT=3000
   ```

6. **Click "Create Web Service"**
   - Wait 2-5 minutes for deployment
   - You'll get a URL like: `https://notebooklm-backend.onrender.com`

7. **Test your backend:**
   ```
   https://notebooklm-backend.onrender.com/api/test
   ```
   Should return: `{"message": "Server is working!"}`

### Step 3: Deploy Frontend on Render

1. **Click "New +" → "Static Site"**

2. **Select your GitHub repository**

3. **Configure the frontend:**
   ```
   Name: notebooklm-frontend
   Branch: main
   Root Directory: Frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Add Environment Variables:**
   ```
   VITE_API_URL=https://notebooklm-backend.onrender.com
   ```

5. **Click "Create Static Site"**
   - Wait 2-5 minutes
   - You'll get a URL like: `https://notebooklm-frontend.onrender.com`

### Step 4: Update Backend CORS

Go back to your backend service on Render:

1. **Click your backend service → "Environment"**

2. **Add new variable:**
   ```
   FRONTEND_URL=https://notebooklm-frontend.onrender.com
   ```

3. **Save and redeploy**

---

## 🎯 Quick Setup Commands

Run these commands to prepare your project:

```bash
# 1. Create API config file
cd Frontend/src/config
echo "export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';" > api.js

# 2. Create production env file
cd ../..
echo "VITE_API_URL=https://your-backend.onrender.com" > .env.production

# 3. Test build locally
npm run build

# 4. Go back to root and commit
cd ..
git add .
git commit -m "Add deployment configuration"
git push
```

---

## 🔄 Alternative: Single Service Deployment

If you want to deploy both in one service (simpler but less flexible):

### Create `server/public` folder and copy frontend build there:

```bash
# Build frontend
cd Frontend
npm run build

# Copy to server
mkdir ../server/public
cp -r dist/* ../server/public/

# Update server/index.js to serve frontend
app.use(express.static('public'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

Then deploy just the server folder to Render as a Web Service.

---

## ⚠️ Important Notes

### 1. File Upload Storage

**Problem:** Render's free tier has **ephemeral storage** (files deleted on restart)

**Solutions:**
- **Option A:** Use cloud storage (AWS S3, Cloudinary) for PDFs
- **Option B:** Accept temporary storage (files lost on restart)
- **Option C:** Use Render's paid tier with persistent disk

### 2. Cold Starts

Render free tier sleeps after 15 minutes of inactivity.
First request after sleep takes ~30 seconds to wake up.

**Solution:** Keep it active with:
- Use a free service like [UptimeRobot](https://uptimerobot.com) to ping every 5 minutes

### 3. ChromaDB Connection

Make sure your ChromaDB is accessible from Render's servers.
If using Chroma Cloud, this should work fine.

---

## 🧪 Testing Your Deployment

### 1. Test Backend
```bash
curl https://your-backend.onrender.com/api/test
curl https://your-backend.onrender.com/api/database-status
```

### 2. Test Frontend
1. Open `https://your-frontend.onrender.com`
2. Upload a test PDF
3. Ask questions
4. Check citations

### 3. Check Logs
- Go to Render dashboard
- Click your service → "Logs"
- Watch for errors

---

## 🐛 Common Issues & Fixes

### Issue 1: CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```

**Fix:** Update backend CORS origin to your frontend URL

### Issue 2: 404 on Routes
```
Cannot GET /api/chat
```

**Fix:** Check backend is running, check start command

### Issue 3: Build Fails
```
npm ERR! code ELIFECYCLE
```

**Fix:** 
- Check Node version compatibility
- Verify package.json scripts
- Check build logs for specific error

### Issue 4: API Calls Fail
```
Network Error
```

**Fix:** 
- Check VITE_API_URL is correct
- Verify backend is running
- Check environment variables

### Issue 5: File Upload Fails
```
Cannot upload file
```

**Fix:**
- Check multer configuration
- Verify upload directory exists
- Check file size limits

---

## 💰 Cost Breakdown

### Render Free Tier:
- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ Automatic SSL
- ✅ Free subdomain
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ Ephemeral storage

### If You Need More:
- **Starter Plan:** $7/month
  - No sleep
  - Persistent disk
  - More resources

---

## 🎉 You're Done!

After deployment, you'll have:
- ✅ Frontend: `https://notebooklm-frontend.onrender.com`
- ✅ Backend: `https://notebooklm-backend.onrender.com`
- ✅ Free SSL certificate
- ✅ Automatic deploys from GitHub

Share your app with the world! 🌍

---

## 📝 Quick Reference

### Deploy Backend:
1. New Web Service
2. Root: `server`
3. Build: `npm install`
4. Start: `npm start`
5. Add env variables

### Deploy Frontend:
1. New Static Site
2. Root: `Frontend`
3. Build: `npm install && npm run build`
4. Publish: `dist`
5. Add `VITE_API_URL`

### Update Code:
```bash
git add .
git commit -m "Update"
git push
# Render auto-deploys!
```

---

Need help? Check [Render Docs](https://render.com/docs) or ask me! 🚀
