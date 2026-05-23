import express from 'express';
import { authenticate } from "../middleware/auth.js";
import {
  chat,
  generateQuizEndpoint,
  summarize,
  generateFlashcardsEndpoint,
  generateCodingProblemEndpoint,
  evaluateCodingSolutionEndpoint,
  explain,
  notes,
  submitQuizResult,
  recommendQuiz,
  generateStudyPlan,
  getStudyPlans,
  completeStudyDay,
  getTodayPlan,
  runCodeDirectly

} from '../controllers/aiController.js';
// NOTE: during development we allow unauthenticated access to AI endpoints so the frontend
// can call them directly. In production you SHOULD enable authentication (see middleware/auth.js)
// and add appropriate rate limiting / quotas per user.
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for AI endpoints (prevent abuse)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: 'Too many AI requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/ai/chat
 * Generate chat response
 */
router.get(
  "/today-plan",
  authenticate,
  aiLimiter,
  getTodayPlan
);


router.patch(
  "/study-plan/:planId/:dayNumber",
  authenticate,
  aiLimiter,
  completeStudyDay
);


router.get(
  "/study-plans",
  authenticate,
  aiLimiter,
  getStudyPlans
);

router.post(
  "/study-plan",
  authenticate,
  aiLimiter,
  generateStudyPlan
);
// Development: no authentication
router.get(
  "/recommend-quiz",
  authenticate,
  aiLimiter,
  recommendQuiz
);

router.post(
  "/study-plan",
  authenticate,
  aiLimiter,
  generateStudyPlan
);

router.post('/chat', authenticate, aiLimiter, chat);

router.post('/quiz', authenticate, aiLimiter, generateQuizEndpoint);

router.post('/summarize', authenticate, aiLimiter, summarize);

router.post('/flashcards', authenticate, aiLimiter, generateFlashcardsEndpoint);

router.post('/coding', authenticate, aiLimiter, generateCodingProblemEndpoint);

router.post('/coding/evaluate', authenticate, aiLimiter, evaluateCodingSolutionEndpoint);

router.post('/coding/run', authenticate, aiLimiter, runCodeDirectly);

router.post('/explain', authenticate, aiLimiter, explain);

router.post('/notes', authenticate, aiLimiter, notes);

router.post('/quiz/submit', authenticate, aiLimiter, submitQuizResult);

export default router;
