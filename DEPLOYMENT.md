# 🚀 Deployment Guide - AI Study Navigator Backend

## Pre-Deployment Checklist

### ✅ Security & Environment Variables

- [ ] **Update `.env` for Production**
  - [ ] Change `NODE_ENV=production`
  - [ ] Use strong `JWT_SECRET` (minimum 32 characters)
  - [ ] Update `CLIENT_URL` to your production domain
  - [ ] Remove/regenerate all API keys
  - [ ] Never commit `.env` file to repository

### ✅ Database Setup

- [ ] MongoDB Atlas configured
- [ ] Database credentials in `.env`
- [ ] IP whitelist configured on MongoDB Atlas
- [ ] Database backups enabled

### ✅ Email Service

- [ ] SMTP credentials verified (Brevo/Gmail/Mailtrap)
- [ ] Sender email whitelisted
- [ ] Test email sending works
- [ ] Update `CLIENT_URL` for email links

### ✅ API Keys & Third-Party Services

- [ ] Gemini API key active and funded
- [ ] NVIDIA API key valid (if using)
- [ ] XAI API key valid (if using)
- [ ] GROQ API key valid (if using)
- [ ] Cloudinary credentials (if image upload needed)
- [ ] Twilio credentials (if SMS features used)

### ✅ Code Quality

- [ ] No console.log() statements in production code
- [ ] Error handling implemented properly
- [ ] Rate limiting configured
- [ ] CORS properly configured for production domain
- [ ] No hardcoded secrets in code

### ✅ Performance

- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Caching strategy implemented (if needed)
- [ ] Response compression enabled
- [ ] Timeout values appropriate

### ✅ Monitoring & Logging

- [ ] Error logging configured
- [ ] Request logging enabled
- [ ] Health check endpoint tested
- [ ] Uptime monitoring set up

## Deployment Steps

### Option 1: Heroku Deployment

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGODB_URI=your-mongodb-uri
# ... add all other env variables

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 2: Railway.app Deployment

1. Connect GitHub repository to Railway
2. Configure environment variables in Railway dashboard
3. Deploy with one click
4. Monitor through Railway dashboard

### Option 3: Render Deployment

1. Connect GitHub to Render
2. Create new Web Service
3. Configure environment variables
4. Deploy from main branch

### Option 4: DigitalOcean / AWS / Azure / Google Cloud

1. Deploy Node.js application
2. Configure environment variables
3. Set up SSL/TLS certificate
4. Configure domain and DNS

## Post-Deployment

### Verification

```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test root endpoint
curl https://your-domain.com/

# Test auth endpoints
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test","name":"Test User"}'
```

### Monitoring

- [ ] Set up error tracking (Sentry, Rollbar)
- [ ] Configure log aggregation (LogRocket, ELK)
- [ ] Set up uptime monitoring (Pingdom, Uptime Robot)
- [ ] Configure alerts for errors/downtime

### Security

- [ ] Enable HTTPS/SSL
- [ ] Set up WAF (Web Application Firewall)
- [ ] Configure DDoS protection
- [ ] Regular security audits

## Environment Variables Template

```properties
# Core
NODE_ENV=production
PORT=4000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your-very-secret-key-min-32-characters

# Email Service
SMTP_USER=your-email@service.com
SMTP_PASS=your-smtp-password
SENDER_EMAIL=noreply@yourdomain.com
EMAIL_SERVICE=brevo

# AI Services
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-1.5-flash
GROQ_API_KEY=your-groq-key
NVIDIA_API_KEY=your-nvidia-key
XAI_API_KEY=your-xai-key

# Frontend
CLIENT_URL=https://yourdomain.com

# Cloudinary (if used)
CLOUD_NAME=your-cloud-name
API_KEY=your-api-key
API_SECRET=your-api-secret

# Twilio (if used)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_NUMBER=+1234567890
VERIFIED_NUMBER=+1234567890

# Verification
VERIFICATION_TOKEN_EXPIRES=900000
BASE_URL=https://yourdomain.com
```

## Troubleshooting

### Common Issues

**MongoDB Connection Issues**
- Check IP whitelist on Atlas
- Verify connection string is correct
- Ensure database user has correct permissions

**Email Not Sending**
- Verify SMTP credentials
- Check sender email is authorized
- Review email service limits

**API Rate Limiting**
- Adjust `express-rate-limit` settings if needed
- Monitor AI endpoint usage

**CORS Errors**
- Update `CLIENT_URL` in environment variables
- Verify CORS configuration matches frontend domain

## Performance Optimization

- Enable gzip compression
- Implement database query optimization
- Use connection pooling
- Cache frequently accessed data
- Monitor response times

## Support

For issues, check logs with:
```bash
# Heroku
heroku logs --tail

# Railway/Render - check dashboard
```

---

**Last Updated:** May 23, 2026
**Version:** 1.0.0
