# 🚀 Deployment Guide - Research Plagiarism Analyzer

## ✅ What Changed (Makes Deployment Possible)

Before: Analysis took 3-5 minutes → **Exceeded 300s deployment timeout**
Now: 
- HTTP returns in <100ms (job ID returned immediately)
- Analysis runs in background (1-2 minutes)
- **No timeout issues!** ✅

---

## 📊 Deployment Options

### **Option 1: Render + GitHub (RECOMMENDED)** ⭐⭐⭐

**Best for:** Easy deployment with auto-updates from GitHub

#### Step 1: Push to GitHub
```bash
cd c:\Users\Akhil\Desktop\research_plagiarism_two
git add .
git commit -m "Add async job queue and parallel processing"
git push origin main
```

#### Step 2: Deploy Backend on Render
1. Go to **https://render.com**
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Name:** `plagiarism-analyzer-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:**
     ```
     PYTHON_PATH=python3
     PORT=5000
     ```
5. Click **"Create Web Service"**

#### Step 3: Deploy Frontend on Render
1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repo
3. Configure:
   - **Name:** `plagiarism-analyzer`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **Environment Variables:**
     ```
     VITE_API_URL=https://plagiarism-analyzer-api.onrender.com
     ```
4. Click **"Create Static Site"**

**Time:** ~5 minutes
**Cost:** Free tier available (with limitations)
**Pros:** Easy to use, auto-deploys from git push

---

### **Option 2: Railway** ⭐⭐

**Best for:** All-in-one platform for backend + storage

#### Step 1: Create Railway Account
Go to **https://railway.app** and sign up

#### Step 2: Deploy Backend
1. Click **"New Project"** → **"GitHub Repo"**
2. Select your repo
3. Railway auto-detects `backend/package.json`
4. Add environment variables (Settings → Variables):
   ```
   PYTHON_PATH=python3
   PORT=5000
   ```

#### Step 3: Deploy Frontend
1. Create another Railway service
2. Set Build Command: `npm run build`
3. Set Start Command: `npm run preview` or use static hosting

**Time:** ~8 minutes
**Cost:** ~$5-10/month (very affordable)
**Pros:** Good performance, integrated database support

---

### **Option 3: Netlify (Frontend) + Render (Backend)** ⭐⭐

**Best for:** Netlify's excellent static hosting + separate backend

#### Frontend on Netlify:
1. Go to **https://netlify.com**
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect GitHub
4. Build Command: `cd frontend && npm run build`
5. Publish Directory: `frontend/dist`
6. Environment Variables:
   ```
   VITE_API_URL=https://your-render-backend.onrender.com
   ```

#### Backend on Render:
(See Option 1: Deploy Backend on Render)

**Time:** ~10 minutes
**Cost:** Free for frontend, ~$7/month for backend
**Pros:** Netlify is excellent for static sites

---

## ⚙️ Pre-Deployment Checklist

- [ ] **Environment variables** set in `.env` files
- [ ] **Git repo** initialized and pushed (`git push`)
- [ ] **Python dependencies** listed in `requirements.txt`:
  ```bash
  pip freeze > backend/python/requirements.txt
  ```
- [ ] **Node dependencies** in `package.json` (already there)
- [ ] **API URL** correctly configured in frontend:
  ```
  VITE_API_URL=https://your-backend-url.onrender.com
  ```

---

## 🔧 Required Environment Variables

### Backend (.env)
```
PORT=5000
PYTHON_PATH=python3
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-api-url.onrender.com
```

---

## 📋 Step-by-Step: Deploy to Render (Quickest)

### Backend:
```bash
# 1. Go to render.com
# 2. Click "New Web Service"
# 3. Connect GitHub → Select repo
# 4. Set Root Directory: backend
# 5. Build: npm install
# 6. Start: node server.js
# 7. Add ENV vars → Deploy (5 min)
```

### Frontend:
```bash
# 1. Click "New Static Site"
# 2. Connect same repo
# 3. Set Root Directory: frontend
# 4. Build: npm install && npm run build
# 5. Public Directory: dist
# 6. Add VITE_API_URL → Deploy (3 min)
```

**Total Time:** ~10 minutes to live deployment! 🎉

---

## 🚀 After Deployment

### Test Your Deployment:
```bash
# Test backend health
curl https://your-backend-url.onrender.com/

# Expected: "Research Plagiarism Backend is Running 🚀"

# Test upload endpoint
curl -X POST https://your-backend-url.onrender.com/api/scan \
  -F "file=@your-test-file.pdf"

# Expected: JSON with jobId and status: "processing"
```

### Monitor:
- **Render:** Dashboard → Logs tab
- **Railway:** Railway Dashboard → Deployments
- **Netlify:** Deploys tab

---

## ⚡ Performance Notes

| Metric | Local | Deployed |
|--------|-------|----------|
| HTTP Response | <100ms | <100ms ✅ |
| Analysis Time | 1-2 min | 1-2 min (cloud CPU) |
| File Upload | Instant | Instant |
| Progress Updates | Real-time | Every 2s poll |

---

## 🔒 Security Considerations

1. **Keep API keys secret** - Use platform's ENV var system (never commit to git)
2. **CORS** already enabled in backend
3. **File uploads** automatically cleaned up after analysis
4. **Jobs** auto-delete after 1 hour from memory

---

## 🐛 Troubleshooting

### "Connection refused" error
→ Backend URL incorrect in frontend `.env`
→ Fix: Update `VITE_API_URL` to deployed backend URL

### "Invalid response" after upload
→ Backend Python environment missing packages
→ Fix: Add `python-dotenv` and other deps to `requirements.txt`

### Analysis stuck at 0%
→ Python process not starting
→ Fix: Check backend logs for import errors

### Timeout error during analysis
→ This should NOT happen with async job queue!
→ Check: Backend is running with `node server.js`

---

## 📱 Access Your Deployed App

Once deployed to Render:
- **Frontend:** `https://plagiarism-analyzer.onrender.com`
- **Backend API:** `https://plagiarism-analyzer-api.onrender.com`
- **API Health:** `https://plagiarism-analyzer-api.onrender.com/`

---

## 💡 Next Steps

1. **Choose a platform** (Render recommended - easiest)
2. **Create accounts** on chosen platforms
3. **Push code to GitHub** (if not already done)
4. **Set environment variables** on platform
5. **Deploy** (5-10 minutes)
6. **Test** with a PDF upload
7. **Share link** with others!

---

**Your project is production-ready!** 🎯
