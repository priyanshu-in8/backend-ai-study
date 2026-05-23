# 🚀 Quick Deploy Guide

## 5-Minute Deployment Steps

### Step 1️⃣: Prepare Environment (2 min)
```bash
# Update your .env file with production values:
# - NODE_ENV=production
# - JWT_SECRET=your-strong-secret-32-chars
# - MONGODB_URI=your-production-db
# - All API keys updated
# - CLIENT_URL=https://yourdomain.com
```

### Step 2️⃣: Validate Configuration (1 min)
```bash
npm run validate
```
✅ All green? Continue to Step 3
❌ Red errors? Fix them first

### Step 3️⃣: Choose Platform & Deploy (2 min)

#### Option A: Railway.app ⭐ Recommended
1. Go to https://railway.app/dashboard
2. New Project → GitHub
3. Select your repository
4. Add environment variables
5. Deploy → Done! ✅

#### Option B: Heroku
```bash
heroku create your-app-name
git push heroku main
```

#### Option C: Render
1. https://dashboard.render.com
2. New → Web Service
3. Connect GitHub
4. Deploy

### Step 4️⃣: Test (Immediate)
```bash
# Replace with your domain
curl https://your-api.com/api/health

# Should return: {"status":"OK",...}
```

## Environment Variables Needed

Copy to your deployment platform's env config:

```properties
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secure-key-here
SMTP_USER=your-email@service.com
SMTP_PASS=your-password
SENDER_EMAIL=noreply@domain.com
EMAIL_SERVICE=brevo
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-1.5-flash
CLIENT_URL=https://yourdomain.com
BASE_URL=https://api.yourdomain.com
```

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Server won't start | Run `npm run validate` |
| MongoDB connection fails | Check MONGODB_URI and IP whitelist |
| Email not sending | Verify SMTP credentials |
| CORS errors | Update CLIENT_URL |
| Port already in use | Change PORT in .env |

## After Deployment

- [ ] Test `/api/health` endpoint
- [ ] Test `/api/auth/register` 
- [ ] Monitor logs for errors
- [ ] Set up uptime monitoring
- [ ] Enable automatic backups

---

**Need help?** See `DEPLOYMENT.md` for detailed guide
