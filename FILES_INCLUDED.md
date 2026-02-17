# Important Configuration Files Included

This repository intentionally includes configuration files that are normally gitignored for easy setup:

## ✅ Committed Configuration Files

### Dashboard (earthquake-dashboard/)
- ✅ **`.env`** - Environment variables (API URL, IoT IP)
- ✅ **`package.json`** - Node.js dependencies
- ✅ **All source files** - Complete React components

### Model (earthquake_model/)
- ✅ **`requirements.txt`** - Python dependencies
- ✅ **All source files** - Feature engineering, training, API
- ✅ **Notebooks** - Data analysis and evaluation

## ⚠️ Files NOT Committed (Install Separately)

### Dashboard
- ❌ **`node_modules/`** - Install via `npm install` (~200MB)
- ❌ **`dist/`** - Build output from `npm run build`

### Model
- ❌ **`.venv/`** - Python virtual environment - Create via `python -m venv .venv`
- ❌ **`models/xgb_model.json`** - Train via running notebooks
- ❌ **`data/raw/`** - Fetch via data pipeline

## 🚀 Quick Setup After Clone

```bash
# Clone repository
git clone https://github.com/vsiva763-git/Earthquake-alert-system.git
cd Earthquake-alert-system

# Setup Python backend
cd earthquake_model
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Follow Part 1 notebooks to train models

# Setup React dashboard
cd ../earthquake-dashboard
npm install
npm run dev
```

## 📝 Why .env is Committed

Normally `.env` files contain secrets and are gitignored. However, this repository:
- Contains **non-production** configuration
- Uses **localhost** URLs only
- Has **no API keys or passwords**
- Is meant for **academic/learning purposes**

For production deployment, use `.env.production` with proper secrets management.

## 🔒 Security Note

**Before deploying to production:**
1. Remove `.env` from git history if it ever contained real credentials
2. Use environment variables from hosting platform
3. Never commit production database URLs, API keys, or passwords
4. Enable proper CORS restrictions in FastAPI
5. Use HTTPS and proper authentication

---

**Last Updated**: February 2026
