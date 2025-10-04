# 🚀 Deploy to Render.com - Quick Start

## ✅ Your Code is Ready!

All necessary changes have been made for deployment.

---

## 📋 5-Minute Deployment

### Step 1: Push to GitHub (2 minutes)

```bash
# If you haven't already
git init
git add .
git commit -m "Ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend (2 minutes)

1. Go to **[render.com](https://render.com)** and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Settings:
   - **Name:** `notebooklm-backend`
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Add **Environment Variables:**
   ```
   LLAMA_PARSE_API_KEY=your_key
   CHROMA_API_KEY=your_key
   CHROMA_TENANT=your_tenant
   CHROMA_DATABASE=your_db
   GEMINI_API_KEY=your_key
   ```
6. Click **"Create Web Service"**
7. Wait 3-5 minutes, copy the URL (e.g., `https://notebooklm-backend.onrender.com`)

### Step 3: Deploy Frontend (1 minute)

1. Click **"New +"** → **"Static Site"**
2. Select your repo
3. Settings:
   - **Name:** `notebooklm-frontend`
   - **Root Directory:** `Frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add **Environment Variable:**
   ```
   VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
   ```
5. Click **"Create Static Site"**
6. Wait 2-3 minutes

### Step 4: Update Backend CORS

1. Go to your backend service on Render
2. Environment → Add:
   ```
   FRONTEND_URL=https://YOUR-FRONTEND-URL.onrender.com
   ```
3. Save (auto-redeploys)

---

## ✅ Done!

Your app is live at:
- **Frontend:** `https://notebooklm-frontend.onrender.com`
- **Backend:** `https://notebooklm-backend.onrender.com`

Test it by uploading a PDF and asking questions!

---

## ⚠️ Important Notes

### Free Tier Limitations:
- ⏰ Services sleep after 15 min inactivity
- 🗑️ Uploaded PDFs deleted on restart (ephemeral storage)
- 🐌 First request after sleep takes ~30 seconds

### Keep It Awake (Optional):
Use [UptimeRobot](https://uptimerobot.com) (free) to ping your backend every 5 minutes.

---

## 🐛 Troubleshooting

### "CORS Error"
→ Check `FRONTEND_URL` is set in backend environment variables

### "Network Error"
→ Check `VITE_API_URL` is correct in frontend environment variables

### "Build Failed"
→ Check logs in Render dashboard for specific error

---

## 📚 Need More Help?

See **`DEPLOYMENT_GUIDE.md`** for detailed instructions and troubleshooting.

---

## 🎉 You're Live!

Share your app: `https://your-frontend.onrender.com`

Enjoy! 🚀
