# 🚀 Setup & Execution Commands

## Quick Start (If Everything is Already Set Up)

### Terminal 1 - Backend Server
```bash
cd c:\Users\Akhil\Desktop\research_plagiarism_two\backend
node server.js
```

### Terminal 2 - Frontend Dev Server
```bash
cd c:\Users\Akhil\Desktop\research_plagiarism_two\frontend
npm run dev
```

Then open: **http://localhost:5173** in your browser

---

## 📋 Complete Setup (First Time or After Updates)

### Step 1: Install Python Dependencies

```bash
cd c:\Users\Akhil\Desktop\research_plagiarism_two\backend\python
pip install -r requirements.txt
```

**What this installs:**
- sentence-transformers (NLP model)
- ddgs (DuckDuckGo search)
- beautifulsoup4 (webpage scraping)
- lxml (HTML parser)
- pdfplumber (PDF text extraction)
- requests, python-dotenv, scikit-learn, numpy, tf-keras

**Expected time:** 2-3 minutes

---

### Step 2: Install Backend (Node.js) Dependencies

```bash
cd c:\Users\Akhil\Desktop\research_plagiarism_two\backend
npm install
```

**What this installs:**
- express (web server)
- multer (file upload handling)
- cors (cross-origin requests)
- dotenv (environment variables)

**Expected time:** 30 seconds

---

### Step 3: Install Frontend Dependencies

```bash
cd c:\Users\Akhil\Desktop\research_plagiarism_two\frontend
npm install
```

**What this installs:**
- React + Vite (frontend framework)
- UI components and dependencies

**Expected time:** 1-2 minutes

---

### Step 4: Start Backend Server

```bash
cd c:\Users\Akhil\Desktop\research_plagiarism_two\backend
node server.js
```

**Expected output:**
```
Server running on http://localhost:3000
```

**Keep this terminal open!** ⚠️

---

### Step 5: Start Frontend Dev Server (New Terminal)

```bash
cd c:\Users\Akhil\Desktop\research_plagiarism_two\frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Keep this terminal open too!** ⚠️

---

### Step 6: Open in Browser

Navigate to: **http://localhost:5173**

---

## 🔧 Troubleshooting Commands

### Check if Python is installed
```bash
python --version
```
Should show: `Python 3.8+`

### Check if Node.js is installed
```bash
node --version
npm --version
```
Should show: `Node v16+` and `npm 8+`

### Test Python analyzer directly
```bash
cd c:\Users\Akhil\OneDrive\Desktop\research_plagiarism_two\backend\python
python test_improvements.py
```
Should show: `ALL TESTS PASSED! ✓`

### Test DuckDuckGo search
```bash
cd c:\Users\Akhil\OneDrive\Desktop\research_plagiarism_two\backend\python
python debug_ddg.py
```
Should show: `Results found: 3`

### Reinstall Python dependencies (if issues)
```bash
cd c:\Users\Akhil\OneDrive\Desktop\research_plagiarism_two\backend\python
pip install --upgrade -r requirements.txt
```

### Clear npm cache and reinstall (if issues)
```bash
cd c:\Users\Akhil\OneDrive\Desktop\research_plagiarism_two\frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🛑 Stop Servers

### Stop Backend (in backend terminal)
Press: **Ctrl + C**

### Stop Frontend (in frontend terminal)
Press: **Ctrl + C**

---

## 🔄 Restart After Code Changes

### If you changed Python code (`analyzer.py`)
1. Stop backend: `Ctrl + C` in backend terminal
2. Restart: `node server.js`

### If you changed frontend code (React components)
- **No restart needed!** Vite auto-reloads

### If you changed backend server code (`server.js`)
1. Stop backend: `Ctrl + C`
2. Restart: `node server.js`

---

## 📦 One-Line Setup (All Dependencies)

```bash
# Python dependencies
cd c:\Users\Akhil\OneDrive\Desktop\research_plagiarism_two\backend\python && pip install -r requirements.txt

# Backend dependencies
cd c:\Users\Akhil\OneDrive\Desktop\research_plagiarism_two\backend && npm install

# Frontend dependencies
cd c:\Users\Akhil\OneDrive\Desktop\research_plagiarism_two\frontend && npm install
```

---

## 🚀 Production Build (Optional)

### Build frontend for production
```bash
cd c:\Users\Akhil\OneDrive\Desktop\research_plagiarism_two\frontend
npm run build
```

This creates optimized files in `frontend/dist/`

### Serve production build
```bash
cd c:\Users\Akhil\OneDrive\Desktop\research_plagiarism_two\frontend
npm run preview
```

---

## 📊 Current Status Check

### Check if backend is running
Open browser: **http://localhost:3000**
Should show: `{"message":"Plagiarism API is running"}`

### Check if frontend is running
Open browser: **http://localhost:5173**
Should show: Your plagiarism detector UI

### Check Python dependencies
```bash
cd c:\Users\Akhil\OneDrive\Desktop\research_plagiarism_two\backend\python
python -c "import ddgs, bs4, pdfplumber, sentence_transformers; print('All dependencies OK!')"
```

---

## 🎯 Quick Reference

| Task | Command | Directory |
|------|---------|-----------|
| **Start Backend** | `node server.js` | `/backend` |
| **Start Frontend** | `npm run dev` | `/frontend` |
| **Install Python Deps** | `pip install -r requirements.txt` | `/backend/python` |
| **Install Backend Deps** | `npm install` | `/backend` |
| **Install Frontend Deps** | `npm install` | `/frontend` |
| **Test Python** | `python test_improvements.py` | `/backend/python` |
| **Stop Server** | `Ctrl + C` | Any terminal |

---

## 🌐 URLs

- **Frontend UI:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Health Check:** http://localhost:3000/

---

## ⚡ Current Status (Based on Your System)

✅ **Backend is running** (41+ minutes)
✅ **Frontend is running** (41+ minutes)

**You're all set!** Just open http://localhost:5173 and upload a PDF to test the enhanced plagiarism detector.

---

## 🆕 After Today's Updates

Since we updated the Python code, you should:

1. **Stop the backend server** (Ctrl + C in backend terminal)
2. **Restart it:** `node server.js`
3. Frontend doesn't need restart (no changes)

The new enhanced analyzer will now be active! 🎉

---

**Need help?** Run the test commands above to verify everything is working.
