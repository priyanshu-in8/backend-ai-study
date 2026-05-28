import express from 'express';
import {
  register,
  verifyEmail,
  login,
  requestPasswordReset,
  resetPassword,
  getProfile,
  logout,
  updateSubjects,
  savePracticeHistory,
  getPracticeHistory,
  getDashboard,
  getAccuracyStats,
   getMissions,
 completeMission,
  getAchievements,  
  googleLogin


} from '../controllers/authController.js';
import { getLeaderboard } from "../controllers/authController.js";
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get(
  "/achievements",
  authenticate,
  getAchievements
);



router.get(
  "/leaderboard",
  authenticate,
  getLeaderboard
);
router.post(
  "/google",
  googleLogin
);

router.get(
  "/accuracy-stats",
  authenticate,
  getAccuracyStats
);

router.get(
  "/missions",
  authenticate,
  getMissions
);

router.patch(
  "/missions/:id",
  authenticate,
  completeMission
);


/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', register);

/**
 * POST /api/auth/verify-email
 * Verify user email with token
 */
router.get(
  "/verify-email",
  verifyEmail
);
/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', login);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', requestPasswordReset);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', resetPassword);

/**
 * POST /api/auth/logout
 * Logout user (stateless JWT logout)
 */
router.post('/logout', logout);

/**
 * POST /api/auth/update-subjects
 * Update user subjects (protected)
 */
router.post('/update-subjects', authenticate, updateSubjects);

/**
 * POST /api/auth/practice-history
 * Save a new practice session (protected)
 */
router.post('/practice-history', authenticate, savePracticeHistory);

/**
 * GET /api/auth/practice-history
 * Get practice history and weak topic analysis (protected)
 */
router.get('/practice-history', authenticate, getPracticeHistory);

/**
 * GET /api/auth/profile
 * Get current user profile (protected)
 */
router.get('/profile', authenticate, getProfile);

/**
 * GET /api/auth/dashboard
 * Get user dashboard information (protected)
 */
router.get('/dashboard', authenticate, getDashboard);

export default router;
