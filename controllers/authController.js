import { getLevelFromXP } from "../utils/levelEngine.js";
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { generateToken, hashToken, generateTokenExpiry, isTokenExpired } from '../utils/tokenUtils.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../utils/sendEmail.js';
import { checkAchievements }
from "../utils/achievementEngine.js";
import { OAuth2Client } from "google-auth-library";
const client =
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
  );

export const googleLogin =
  async (req, res) => {
    try {

      const { token } =
        req.body;

      if (!token) {
        return res.status(400).json({
          message:
            "Google token missing",
        });
      }

      const ticket =
        await client.verifyIdToken({
          idToken: token,
          audience:
            process.env
              .GOOGLE_CLIENT_ID,
        });

      const payload =
        ticket.getPayload();

      const {
        email,
        name,
        picture,
        sub,
      } = payload;

      let user =
        await User.findOne({
          email,
        });

      if (!user) {

        user =
          await User.create({
            name,
            email,
            profilePic:
              picture,
            googleId: sub,
            authProvider:
              "google",
            isVerified: true,

            level: 1,
            xpPoints: 0,
            streakDays: 1,
            subjects: [],
          });

      } else {

        if (!user.googleId) {
          user.googleId = sub;
        }

        await user.save();
      }

      // IMPORTANT FIX
      const jwtToken =
        generateJWT(
          user._id
        );

      return res.status(200).json({
        message:
          "Google login successful",

        token:
          jwtToken,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          level:
            user.level || 1,
          xpPoints:
            user.xpPoints || 0,
          streakDays:
            user.streakDays || 0,
          subjects:
            user.subjects || [],
          isVerified: true,
          profilePic:
            user.profilePic,
        },
      });

    } catch (error) {

      console.error(
        "Google auth error:",
        error
      );

      return res.status(500).json({
        message:
          "Google authentication failed",
        error:
          error.message,
      });
    }
  };

/**
 * Generate JWT token
 */
const generateJWT = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const updateStreak = (user) => {
  const today = new Date();

  if (!user.lastLogin || user.streakDays === 0) {
    user.streakDays = 1;
    user.lastLogin = today;
    return;
  }

  const todayOnly = new Date(today);
  todayOnly.setHours(0, 0, 0, 0);

  const lastOnly = new Date(user.lastLogin);
  lastOnly.setHours(0, 0, 0, 0);

  const diffDays =
    (todayOnly - lastOnly) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) {
    // same day
  } else if (diffDays === 1) {
    user.streakDays += 1;
  } else {
    user.streakDays = 1;
  }

  user.lastLogin = today;
};


export const getAchievements =
async (req, res) => {
  try {
    const user =
      await User.findById(
        req.user.id ||
        req.user.userId
      );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    res.json({
      achievements:
        user.achievements ||
        [],
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to load achievements",
    });
  }
};

// ===================================
// 4. GET MISSIONS API
// ===================================

export const getMissions =
async (req, res) => {
  try {
    const user =
      await User.findById(
        req.user.id ||
        req.user.userId
      );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found"
      });
    }

    res.status(200).json({
      missions:
        user.dailyMissions ||
        []
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to load missions"
    });
  }
};


// ===================================
// 5. COMPLETE MISSION API
// ===================================


export const completeMission =
async (req, res) => {
  try {
    const user =
      await User.findById(
        req.user.id ||
        req.user.userId
      );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found"
      });
    }

    const mission =
      user.dailyMissions.id(
        req.params.id
      ) ||
      user.dailyMissions.find(
        (m) =>
          m._id.toString() ===
          req.params.id
      );

    if (!mission) {
      return res.status(404).json({
        message:
          "Mission not found"
      });
    }

    if (mission.completed) {
      return res.status(400).json({
        message:
          "Already completed"
      });
    }

    /* ==========================
       COMPLETE MISSION
    ========================== */
    mission.completed = true;

    const oldLevel =
      user.level || 1;

    user.xpPoints =
      (user.xpPoints || 0) +
      (mission.xp || 0);

    /* ==========================
       AUTO LEVEL UPDATE
    ========================== */
    user.level =
      getLevelFromXP(
        user.xpPoints
      );

    const leveledUp =
      user.level >
      oldLevel;

    await user.save();

    res.status(200).json({
      message:
        "Mission completed",

      xpAwarded:
        mission.xp,

      newXP:
        user.xpPoints,

      level:
        user.level,

      leveledUp,

      oldLevel,

      newLevel:
        user.level
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to complete mission"
    });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({})
      .select("name xpPoints level streakDays")
      .sort({ xpPoints: -1, level: -1 })
      .limit(10);

    const rankedUsers = users.map(
      (user, index) => ({
        rank: index + 1,
        id: user._id,
        name: user.name,
        xpPoints: user.xpPoints || 0,
        level: user.level || 1,
        streakDays:
          user.streakDays || 0,
      })
    );

    res.status(200).json({
      leaderboard: rankedUsers,
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to load leaderboard",
    });
  }
};

// ===================================
// 2. CONTROLLER (controllers/authController.js)
// ===================================

export const generateDailyMissions = (user) => {
  const weakTopic =
    user.weakTopics?.length > 0
      ? user.weakTopics[0].topic
      : null;

  const missions = [
    {
      title: "Complete 1 Quiz",
      xp: 30,
      completed: false
    },
    {
      title: "Finish 2 Study Tasks",
      xp: 20,
      completed: false
    },
    {
      title: "30 Min Focus Session",
      xp: 15,
      completed: false
    }
  ];

  if (weakTopic) {
    missions.push({
      title: `Revise ${weakTopic}`,
      xp: 25,
      completed: false
    });
  }

  user.dailyMissions = missions;
  user.lastMissionDate = new Date();
};

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm, educationType, educationLevel, subjects } = req.body;

    // Validation
    if (!name || !email || !password || !educationType || !educationLevel) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['school', 'college'].includes(educationType.toLowerCase())) {
      return res.status(400).json({ message: 'Education type must be school or college' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate verification token
    const verificationToken = generateToken();
    const hashedToken = hashToken(verificationToken);
    const tokenExpiry = generateTokenExpiry(parseInt(process.env.VERIFICATION_TOKEN_EXPIRES || 900000));

    const parsedSubjects = Array.isArray(subjects)
      ? subjects.map((subject) => subject.trim()).filter(Boolean)
      : typeof subjects === 'string'
      ? subjects.split(',').map((subject) => subject.trim()).filter(Boolean)
      : [];

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      educationType: educationType.toLowerCase(),
      educationLevel: educationLevel.trim(),
      subjects: parsedSubjects,
      verificationToken: hashedToken,
      verificationTokenExpires: tokenExpiry,
      isVerified: false,
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, process.env.CLIENT_URL || 'http://localhost:8080');
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);
      // Still proceed but let user know
      return res.status(201).json({
        message: 'User registered, but failed to send verification email. Please contact support.',
        user: {
          id: user._id,
          email: user.email,
        },
      });
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified,
        educationType: user.educationType,
        educationLevel: user.educationLevel,
        subjects: user.subjects,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (req, res) => {

  try {

const token =
  req.query.token ||
  req.body.token ||
  req.params.token;

    console.log(
      "VERIFY TOKEN:"
    );

    console.log(token);

    if (!token) {

      return res.status(400)
      .json({

        message:
          "Verification token is required"
      });
    }

    // Hash token

    const hashedToken =
      hashToken(token);

    console.log(
      "HASHED TOKEN:"
    );

    console.log(hashedToken);

    // Find user

    const user =
      await User.findOne({

        verificationToken:
          hashedToken,

        verificationTokenExpires: {
          $gt: new Date()
        },
      });

    console.log(
      "FOUND USER:"
    );

    

    if (!user) {

      return res.status(400)
      .json({

        message:
          "Invalid or expired verification token"
      });
    }

    // Already verified

    if (user.isVerified) {

      return res.status(400)
      .json({

        message:
          "User already verified"
      });
    }

    // Verify user

    user.isVerified = true;

    user.clearVerificationToken();

    await user.save();

    // Welcome email

    try {

      await sendWelcomeEmail(
        user.email,
        user.name
      );

    } catch (emailError) {

      console.log(
        emailError.message
      );
    }

    return res.status(200)
    .json({

      message:
        "Email verified successfully",

      user: {

        id: user._id,

        email:
          user.email,

        isVerified:
          user.isVerified
      }
    });

  } catch (error) {

    console.error(
      "VERIFY ERROR:"
    );

    console.error(error);

    return res.status(500)
    .json({

      message:
        "Email verification failed",

      error:
        error.message
    });
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } =
      req.body;

    /* =========================
       VALIDATION
    ========================= */
    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    /* =========================
       FIND USER
    ========================= */
    const user =
      await User.findOne({
        email,
      }).select("+password");

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid credentials",
      });
    }

    /* =========================
       PASSWORD CHECK
    ========================= */
    const isPasswordCorrect =
      await user.matchPassword(
        password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message:
          "Invalid credentials",
      });
    }

    /* =========================
       EMAIL VERIFY CHECK
    ========================= */
    if (!user.isVerified) {

      // Generate verification token
      const verificationToken =
        generateToken();

      const hashedToken =
        hashToken(
          verificationToken
        );

      const tokenExpiry =
        generateTokenExpiry(
          parseInt(
            process.env
              .VERIFICATION_TOKEN_EXPIRES ||
              900000
          )
        );

      // Save token to existing user
      user.verificationToken =
        hashedToken;

      user.verificationTokenExpires =
        tokenExpiry;

      await user.save();

      // Send verification email
      try {

        await sendVerificationEmail(
          user.email,
          verificationToken,
          process.env.CLIENT_URL ||
            "http://localhost:5173"
        );

      } catch (emailError) {

        console.error(
          "Failed to send verification email:",
          emailError.message
        );

        return res.status(500).json({
          message:
            "Failed to send verification email",
        });
      }

      return res.status(401).json({
        message:
          "Please verify your email first. Verification email sent again.",
      });
    }

    /* =========================
       UPDATE STREAK
    ========================= */
    updateStreak(user);

    /* =========================
       AUTO LEVEL NORMALIZE
    ========================= */
    user.level =
      getLevelFromXP(
        user.xpPoints || 0
      );

    /* =========================
       DAILY MISSIONS
    ========================= */
    const today =
      new Date().toDateString();

    if (
      !user.lastMissionDate ||
      new Date(
        user.lastMissionDate
      ).toDateString() !==
        today
    ) {

      generateDailyMissions(
        user
      );
    }

    await user.save();

    /* =========================
       JWT TOKEN
    ========================= */
    const token =
      generateJWT(user._id);

    /* =========================
       RESPONSE
    ========================= */
    return res.status(200).json({
      message:
        "Login successful",

      token,

      user: {
        id: user._id,

        name:
          user.name,

        email:
          user.email,

        role:
          user.role,

        level:
          user.level || 1,

        xpPoints:
          user.xpPoints || 0,

        streakDays:
          user.streakDays || 0,

        subjects:
          user.subjects,

        isVerified:
          user.isVerified,
      },
    });

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message:
        "Login failed",

      error:
        error.message,
    });
  }
};

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,

        educationType: user.educationType,
        educationLevel: user.educationLevel,
        subjects: user.subjects,

        level: user.level || 1,
        xpPoints: user.xpPoints || 0,
        streakDays: user.streakDays || 0,

        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve profile",
      error: error.message
    });
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        message: 'If an account exists with this email, you will receive a password reset link',
      });
    }

    // Generate reset token
    const resetToken = generateToken();
    const hashedToken = hashToken(resetToken);
    const tokenExpiry = generateTokenExpiry(parseInt(process.env.VERIFICATION_TOKEN_EXPIRES || 900000));

    user.verificationToken = hashedToken;
    user.verificationTokenExpires = tokenExpiry;
    await user.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken, process.env.CLIENT_URL || 'http://localhost:3000');
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError.message);
      return res.status(500).json({ message: 'Failed to send reset email' });
    }

    res.status(200).json({
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Password reset request failed', error: error.message });
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password, passwordConfirm } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash the token
    const hashedToken = hashToken(token);

    // Find user
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.clearVerificationToken();
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
};

/**
 * Logout current user
 */
export const logout = async (req, res) => {
  try {
    // For JWT auth, token invalidation is handled client-side by clearing local storage.
    // This endpoint exists for consistent logout behavior and can later be extended for session revocation.
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};

const computeWeakTopics = (practiceHistory) => {
  const topicStats = practiceHistory.reduce((acc, session) => {
    const key = session.topic.toLowerCase().trim();
    if (!acc[key]) {
      acc[key] = {
        topic: session.topic,
        correct: 0,
        total: 0,
      };
    }

    acc[key].correct += session.score;
    acc[key].total += session.total;
    return acc;
  }, {});

  return Object.values(topicStats)
    .map((topic) => ({
      topic: topic.topic,
      accuracy: topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0,
      correct: topic.correct,
      total: topic.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 6);
};
export const getDashboard = async (req, res) => {
 try {
   const user = await User.findById(req.user.userId);

   if (!user) {
     return res.status(404).json({
       message: "User not found"
     });
   }

   res.json({
     name: user.name,
     level: user.level,
     xpPoints: user.xpPoints,
     streakDays: user.streakDays,
     weakTopics: user.weakTopics,
     recentChats: user.chatHistory.slice(0,5),
     subjects: user.subjects
   });

 } catch (error) {
   res.status(500).json({
     message: "Failed to load dashboard"
   });
 }
};

export const getAccuracyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const history = user.practiceHistory || [];

    const quizHistory = history.filter(
      item => item.sessionType === "quiz"
    );

    const totalScore = quizHistory.reduce(
      (sum, item) => sum + item.score, 0
    );

    const totalQuestions = quizHistory.reduce(
      (sum, item) => sum + item.total, 0
    );

    const overallAccuracy =
      totalQuestions > 0
        ? Math.round((totalScore / totalQuestions) * 100)
        : 0;

    const weeklyTrend = quizHistory.slice(0, 7).reverse().map(item => ({
      day: new Date(item.createdAt).toLocaleDateString("en-US", {
        weekday: "short"
      }),
      accuracy: item.accuracy
    }));

    const topicMap = {};

    quizHistory.forEach(item => {
      if (!topicMap[item.topic]) {
        topicMap[item.topic] = {
          score: 0,
          total: 0
        };
      }

      topicMap[item.topic].score += item.score;
      topicMap[item.topic].total += item.total;
    });

    const subjectStats = Object.keys(topicMap).map(topic => ({
      topic,
      accuracy: Math.round(
        (topicMap[topic].score / topicMap[topic].total) * 100
      )
    }));

    const lastQuiz = quizHistory[0] || null;

    res.status(200).json({
      overallAccuracy,
      weeklyTrend,
      subjectStats,
      lastQuiz
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to load stats"
    });
  }
};


export const savePracticeHistory = async (req, res) => {
  try {
    const { sessionType, topic, score = 0, total = 0 } = req.body;

    if (!sessionType || !['quiz', 'flashcards', 'coding'].includes(sessionType)) {
      return res.status(400).json({ message: 'Invalid session type' });
    }

    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

    user.practiceHistory.unshift({
      sessionType,
      topic: topic.trim(),
      score,
      total,
      accuracy,
    });

    if (user.practiceHistory.length > 50) {
      user.practiceHistory = user.practiceHistory.slice(0, 50);
    }

    await user.save();

    const weakTopics = computeWeakTopics(user.practiceHistory);

    res.status(200).json({
      message: 'Practice session saved successfully',
      data: {
        history: user.practiceHistory,
        weakTopics,
      },
    });
  } catch (error) {
    console.error('Save practice history error:', error);
    res.status(500).json({ message: 'Failed to save practice history', error: error.message });
  }
};

export const getPracticeHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const weakTopics = computeWeakTopics(user.practiceHistory);

    res.status(200).json({
      message: 'Practice history retrieved successfully',
      data: {
        history: user.practiceHistory,
        weakTopics,
      },
    });
  } catch (error) {
    console.error('Get practice history error:', error);
    res.status(500).json({ message: 'Failed to retrieve practice history', error: error.message });
  }
};

/**
 * Update user subjects
 */
export const updateSubjects = async (req, res) => {
  try {
    const { subjects } = req.body;

    if (!Array.isArray(subjects)) {
      return res.status(400).json({ message: 'Subjects must be an array' });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out empty subjects and trim whitespace
    user.subjects = subjects
      .map(subject => subject.trim())
      .filter(subject => subject.length > 0);

    await user.save();

    res.status(200).json({
      message: 'Subjects updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        educationType: user.educationType,
        educationLevel: user.educationLevel,
        subjects: user.subjects,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Update subjects error:', error);
    res.status(500).json({ message: 'Failed to update subjects', error: error.message });
  }
};
