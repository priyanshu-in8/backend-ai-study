# 🚂 Railway.app Deployment Guide

**Railway** is the easiest way to deploy your Node.js backend!

## Why Railway?
✅ Free tier available ($5 credit/month)
✅ Auto-deploys from GitHub
✅ Simple environment variable setup
✅ Built-in monitoring and logs
✅ SSL/HTTPS automatic
✅ Easy custom domain setup

## Step-by-Step Deployment

### 1. Connect GitHub (First time only)
```
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Click "Connect GitHub"
5. Authorize Railway to access your account
6. Select your repository
```

### 2. Create New Service
```
1. In Railway Dashboard, click "New"
2. Select "GitHub Repo"
3. Choose your backend repository
4. Railway auto-detects it's Node.js ✅
5. Click "Deploy"
```

### 3. Configure Environment Variables
```
1. In your service dashboard, go to "Variables"
2. Add each environment variable:

   NODE_ENV=production
   PORT=4000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
   JWT_SECRET=your-very-secure-secret-32-characters-minimum
   SMTP_USER=your-email@brevo.com
   SMTP_PASS=your-smtp-password
   SENDER_EMAIL=noreply@yourdomain.com
   EMAIL_SERVICE=brevo
   GEMINI_API_KEY=your-gemini-key
   GEMINI_MODEL=gemini-1.5-flash
   CLIENT_URL=https://yourdomain.com
   BASE_URL=https://your-api-name.railway.app
   
   (Add other optional variables as needed)
```

### 4. Verify Deployment
```
1. Go to "Deployments" tab
2. Wait for build to complete (usually 2-3 minutes)
3. Check "Build Logs" for any errors
4. Once build succeeds, you'll see a "Live" badge
```

### 5. Get Your API URL
```
1. Go to "Settings" tab
2. Scroll to "Domains"
3. Railway assigns you a default URL like: https://your-app-name.railway.app
4. Or use a custom domain (see next section)
```

### 6. Test Your API
```bash
# Replace with your Railway domain
curl https://your-app-name.railway.app/api/health

# Should return: {"status":"OK","message":"..."}
```

## Setup Custom Domain

### Option 1: Use Railway Subdomain (Free)
```
1. In Railway Settings → Domains
2. Click "Add Domain"
3. Railway gives you: your-app.railway.app ✅
```

### Option 2: Use Your Own Domain (Paid)
```
1. In Railway Settings → Domains
2. Click "Add Domain"
3. Enter your domain: api.yourdomain.com
4. Railway provides CNAME record
5. Add CNAME to your domain DNS:
   Name: api
   Value: (Railway provides this)
6. Wait 15-30 minutes for DNS to propagate
```

## Environment Variables Reference

| Variable | Example | Required |
|----------|---------|----------|
| NODE_ENV | production | ✅ Yes |
| PORT | 4000 | ✅ Yes |
| MONGODB_URI | mongodb+srv://... | ✅ Yes |
| JWT_SECRET | your-secret-key-32+ | ✅ Yes |
| SMTP_USER | email@brevo.com | ✅ Yes |
| SMTP_PASS | password | ✅ Yes |
| SENDER_EMAIL | noreply@domain.com | ✅ Yes |
| EMAIL_SERVICE | brevo | ✅ Yes |
| GEMINI_API_KEY | key | ✅ Yes |
| GEMINI_MODEL | gemini-1.5-flash | ✅ Yes |
| CLIENT_URL | https://yourdomain.com | ✅ Yes |
| BASE_URL | https://api.yourdomain.com | ✅ Yes |

## Automatic Redeploys

✅ Railway automatically redeploys when you push to GitHub!

```bash
# Make changes in your code
# Commit and push
git add .
git commit -m "Update feature"
git push origin main

# Railway automatically redeploys! 🚀
# Check "Deployments" tab to see progress
```

## Monitoring & Logs

### View Logs
```
1. Go to your service dashboard
2. Click "Logs" tab
3. See real-time server output
```

### Monitor Performance
```
1. Go to "Metrics" tab
2. See CPU, Memory, Request count
3. Alert setup available (premium)
```

## Database Connection

### Testing MongoDB Connection
```bash
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"testpass123",
    "name":"Test User"
  }'
```

If you get: `{"message":"User created successfully"}` ✅
If you get: `{"message":"Database connection error"}` ❌ Check MONGODB_URI

## Troubleshooting

### Build Fails
1. Check "Build Logs" for errors
2. Run locally: `npm install && npm start`
3. Fix errors locally first
4. Push to GitHub, Railway auto-redeploys

### App crashes after deploy
1. Check "Logs" tab for error messages
2. Update environment variables if needed
3. Restart deployment: Click "Redeploy"

### Can't reach API
1. Wait 5 minutes (DNS propagation)
2. Check domain configuration
3. Verify environment variables are set
4. Check if PORT variable is correct

### Database connection error
1. Test MONGODB_URI locally first
2. Verify IP whitelist on MongoDB Atlas
3. Check credentials are correct
4. Restart deployment

## Cost & Limits

| Plan | Price | Limits |
|------|-------|--------|
| Free Trial | $5/month | Up to 3 services |
| Pay-as-you-go | $0.000463/hour | No limits |

## Get Help

- Railway Docs: https://docs.railway.app
- GitHub Issues: Report deployment issues
- Logs: Always check logs first for errors

---

**You're all set!** 🎉 Your backend is now live on Railway!
