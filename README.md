# 🎓 AI Study Navigator - Backend API

A production-grade Node.js/Express backend with email verification, Gemini AI integration, and comprehensive study tools.

## ✨ Features

### 🔐 Authentication
- User registration with email verification
- JWT-based authentication
- Password reset functionality
- Role-based access control (student, teacher, admin)

### 📧 Email Verification
- Email verification with token expiry (15 minutes)
- Nodemailer integration (Gmail/Mailtrap)
- Welcome emails
- Password reset emails
- Hashed token storage for security

### 🤖 Gemini AI Integration
- **Chat**: AI-powered conversational learning
- **Quiz Generation**: Auto-generate quizzes from topics
- **Text Summarization**: Summarize content (short/medium/detailed)
- **Flashcards**: Generate study flashcards
- **Concept Explanation**: Explain topics at different levels
- **Study Notes**: Generate comprehensive study notes
- Rate limiting (30 requests per 15 minutes)

### 🛡️ Security
- Password hashing with bcryptjs
- JWT token-based authentication
- Rate limiting on AI endpoints
- CORS protection
- MongoDB with Mongoose ODM
- Input validation

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB instance (Atlas or local)
- Gmail account (with app password) or Mailtrap account
- Google Gemini API key

### Installation

1. **Clone and navigate to backend**
```bash
cd backend
npm install
```

2. **Create `.env` file**
```bash
cp .env.example .env
```

3. **Configure environment variables**
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-study-navigator

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SERVICE=gmail

# Or Mailtrap (for development)
# MAILTRAP_USER=your-user
# MAILTRAP_PASS=your-password
# EMAIL_SERVICE=mailtrap

# Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Server
PORT=5000
NODE_ENV=development

# Client URL (for email verification links)
CLIENT_URL=http://localhost:3000
```

4. **Start the server**
```bash
npm run dev      # Development with auto-reload
npm start        # Production
```

Server will be available at `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}

Response (201):
{
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": "...",
    "email": "john@example.com",
    "isVerified": false
  }
}
```

#### Verify Email
```
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}

Response (200):
{
  "message": "Email verified successfully. You can now login.",
  "user": {
    "id": "...",
    "email": "john@example.com",
    "isVerified": true
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "isVerified": true
  }
}
```

#### Get Profile (Protected)
```
GET /api/auth/profile
Authorization: Bearer <jwt-token>

Response (200):
{
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "isVerified": true,
    "subjects": [],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Request Password Reset
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}

Response (200):
{
  "message": "If an account exists with this email, you will receive a password reset link"
}
```

#### Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "newpassword123",
  "passwordConfirm": "newpassword123"
}

Response (200):
{
  "message": "Password reset successfully. You can now login with your new password."
}
```

### AI Endpoints (All Protected)

All AI endpoints require `Authorization: Bearer <jwt-token>` header and are rate-limited to 30 requests per 15 minutes.

#### Chat
```
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "message": "Explain quantum computing"
}

Response (200):
{
  "message": "Response generated successfully",
  "data": {
    "userMessage": "Explain quantum computing",
    "aiResponse": "Quantum computing is... [detailed response]"
  }
}
```

#### Generate Quiz
```
POST /api/ai/quiz
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "topic": "Photosynthesis",
  "numQuestions": 5
}

Response (200):
{
  "message": "Quiz generated successfully",
  "data": {
    "topic": "Photosynthesis",
    "questions": [
      {
        "id": 1,
        "question": "What is the main product of photosynthesis?",
        "options": ["Glucose", "Oxygen", "Water", "CO2"],
        "correctAnswer": 0,
        "explanation": "Glucose is the primary product..."
      }
    ]
  }
}
```

#### Summarize Text
```
POST /api/ai/summarize
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "text": "Long text to summarize...",
  "style": "medium"  // short, medium, or detailed
}

Response (200):
{
  "message": "Text summarized successfully",
  "data": {
    "originalText": "Long text to summarize...",
    "style": "medium",
    "summary": "Summarized version of the text..."
  }
}
```

#### Generate Flashcards
```
POST /api/ai/flashcards
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "topic": "French Vocabulary",
  "numCards": 10
}

Response (200):
{
  "message": "Flashcards generated successfully",
  "data": {
    "topic": "French Vocabulary",
    "flashcards": [
      {
        "id": 1,
        "front": "Chat",
        "back": "Cat"
      }
    ]
  }
}
```

#### Explain Concept
```
POST /api/ai/explain
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "concept": "Machine Learning",
  "level": "beginner"  // beginner, intermediate, or advanced
}

Response (200):
{
  "message": "Explanation generated successfully",
  "data": {
    "concept": "Machine Learning",
    "level": "beginner",
    "explanation": "Machine learning is... [explanation]"
  }
}
```

#### Generate Study Notes
```
POST /api/ai/notes
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "topic": "World War II"
}

Response (200):
{
  "message": "Study notes generated successfully",
  "data": {
    "topic": "World War II",
    "notes": "## Key Concepts\n\n### Overview\n... [comprehensive notes]"
  }
}
```

## 🏗️ Project Structure

```
backend/
├── server.js                 # Express app setup
├── package.json              # Dependencies
├── .env.example              # Environment template
├── models/
│   └── User.js              # User schema with email verification
├── controllers/
│   ├── authController.js    # Auth logic (register, login, verify)
│   └── aiController.js      # AI endpoints handlers
├── services/
│   └── geminiService.js     # Gemini API integration
├── utils/
│   ├── sendEmail.js         # Email sending (Nodemailer)
│   └── tokenUtils.js        # Token generation & hashing
├── middleware/
│   └── auth.js              # JWT verification & authorization
└── routes/
    ├── auth.js              # Auth routes
    └── ai.js                # AI routes
```

## 🔒 Security Features

1. **Password Security**
   - Bcryptjs hashing (10 salt rounds)
   - Minimum 6 characters

2. **Token Security**
   - Hashed verification tokens using SHA256
   - 15-minute expiry
   - One-time use tokens

3. **Rate Limiting**
   - 30 AI requests per 15 minutes per user
   - Prevents abuse and DoS attacks

4. **JWT Authentication**
   - 7-day token expiry
   - Verified on protected routes

5. **Input Validation**
   - Email format validation
   - Password confirmation
   - Message length limits (10KB)

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate App Password (https://myaccount.google.com/apppasswords)
3. Use app password in `EMAIL_PASS`

### Mailtrap Setup (Recommended for Development)
1. Sign up at mailtrap.io
2. Get credentials from Mailtrap dashboard
3. Set `EMAIL_SERVICE=mailtrap` and credentials

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

## 🧪 Testing with Postman/cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "passwordConfirm": "password123"
  }'
```

### Generate Chat Response
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{
    "message": "Explain photosynthesis"
  }'
```

## 🌍 Environment-Specific Configuration

### Development
```env
NODE_ENV=development
PORT=5000
```

### Production
```env
NODE_ENV=production
PORT=80 or 443
JWT_SECRET=<strong-random-key>
GEMINI_API_KEY=<production-key>
```

## 📦 Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **nodemailer**: Email sending
- **@google/generative-ai**: Gemini API
- **express-rate-limit**: Rate limiting
- **cors**: CORS middleware
- **dotenv**: Environment variables

## 🐛 Troubleshooting

### Email Not Sending
- Check `EMAIL_SERVICE` is set correctly
- Verify credentials in `.env`
- For Gmail: Use app password, not account password

### Gemini API Errors
- Verify `GEMINI_API_KEY` is valid
- Check API quota at Google AI Studio
- Ensure proper request formatting

### MongoDB Connection Failed
- Verify `MONGODB_URI` is correct
- Check MongoDB instance is running
- Ensure IP whitelist allows your connection

### Rate Limit Exceeded
- Wait 15 minutes for rate limit reset
- Consider upgrading plan for production use

## 📄 License

ISC

## 👨‍💻 Support

For issues and questions, please check the main repository documentation.

---

**Happy Learning! 🎓**
# backend-ai-study
