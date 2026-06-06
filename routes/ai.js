import express from "express";

import rateLimit from "express-rate-limit";

import { authenticate }
from "../middleware/auth.js";

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

  getStudyPlans,

  getAllPlans,

  getLatestPlans,

  completeStudyDay,

  getTodayPlan,

  completeActivity,

  getSavedTodayPlan,

  runCodeDirectly,

  generateShortTermPlanController,

  generateLongTermPlanController,
  
  getTodayTasks,
  
  createLongTermPlan,

  generateStudyPlan

} from "../controllers/aiController.js";

const router = express.Router();

const aiLimiter = rateLimit({

  windowMs: 15 * 60 * 1000,

  max: 30,

  message:
    "Too many AI requests, please try again later",

  standardHeaders: true,

  legacyHeaders: false,
});


// =============================
// STUDY PLANS
// =============================

router.post(
  "/generate-short-term-plan",
  authenticate,
  aiLimiter,
  generateShortTermPlanController
);

router.post(
  "/generate-long-term-plan",
  authenticate,
  aiLimiter,
  generateLongTermPlanController
);

router.get(
  "/study-plans",
  authenticate,
  aiLimiter,
  getStudyPlans
);

router.get(
  "/all-plans",
  authenticate,
  
  getAllPlans
);

router.get(
  "/latest-plans",
  authenticate,
 
  getLatestPlans
);

router.get(
  "/today-plan",
  authenticate,
  
  getTodayPlan
);

router.get(
  "/saved-today-plan",
  authenticate,
  aiLimiter,
  getSavedTodayPlan
);

router.post(
  "/complete-activity",
  authenticate,
  aiLimiter,
  completeActivity
);

router.patch(
  "/missions/:id",
  authenticate,
  aiLimiter,
  completeActivity
);


// =============================
// QUIZ
// =============================

router.get(
  "/recommend-quiz",
  authenticate,
  aiLimiter,
  recommendQuiz
);

router.post(
  "/quiz",
  authenticate,
  aiLimiter,
  generateQuizEndpoint
);

router.post(
  "/quiz/submit",
  authenticate,
  aiLimiter,
  submitQuizResult
);


// =============================
// CHAT
// =============================

router.post(
  "/chat",
  authenticate,
  aiLimiter,
  chat
);


// =============================
// SUMMARIZE
// =============================

router.post(
  "/summarize",
  authenticate,
  aiLimiter,
  summarize
);


// =============================
// FLASHCARDS
// =============================

router.post(
  "/flashcards",
  authenticate,
  aiLimiter,
  generateFlashcardsEndpoint
);


// =============================
// CODING
// =============================

router.post(
  "/coding",
  authenticate,
  aiLimiter,
  generateCodingProblemEndpoint
);

router.post(
  "/coding/evaluate",
  authenticate,
  aiLimiter,
  evaluateCodingSolutionEndpoint
);

router.post(
  "/coding/run",
  authenticate,
  aiLimiter,
  runCodeDirectly
);


// =============================
// NOTES & EXPLAIN
// =============================

router.post(
  "/explain",
  authenticate,
  aiLimiter,
  explain
);

router.post(
  "/notes",
  authenticate,
  aiLimiter,
  notes
);



router.get(
  "/today-tasks",
  authenticate,
  aiLimiter,
  getTodayTasks
);
router.post(
  "/long-term-plan",
  authenticate,
  aiLimiter,
  createLongTermPlan
);

export default router;