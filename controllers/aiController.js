import {
  generateChatResponse,
  generateQuiz,
  summarizeText,
  generateFlashcards,
  generateCodingProblem,
  evaluateCodingSolution,
  explainConcept,
  generateStudyNotes,
  generateAIStudyPlan,
  generateShortTermPlan,
  generateLongTermPlan,
  generateTodayAIPlan

} from '../services/aiService.js';
import User from "../models/User.js";
import codeExecutor from '../utils/codeExecutor.js';
import { studyPlanSchema } from "../validators/studyPlan.validator.js";
import { fi } from 'zod/v4/locales';


export const recommendQuiz = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const weakTopics = user.weakTopics || [];

    if (weakTopics.length > 0) {
      const topWeak = weakTopics.sort(
        (a, b) => b.wrongCount - a.wrongCount
      )[0];

      return res.status(200).json({
        message: "Recommended quiz topic",
        data: {
          topic: topWeak.topic,
          reason: "Most incorrect answers topic"
        }
      });
    }

    const history = user.practiceHistory || [];

    if (history.length > 0) {
      return res.status(200).json({
        message: "Recommended quiz topic",
        data: {
          topic: history[0].topic,
          reason: "Continue recent learning topic"
        }
      });
    }

    return res.status(200).json({
      message: "Recommended quiz topic",
      data: {
        topic: "C Programming",
        reason: "Starter recommendation"
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to recommend quiz"
    });
  }
};

export const completeStudyDay = async (req, res) => {
  try {
    const { planId, dayNumber } = req.params;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const plan = user.studyPlans.id(planId);

    if (!plan) {
      return res.status(404).json({
        message: "Plan not found"
      });
    }

    const day = plan.days.find(
      item => item.day === Number(dayNumber)
    );

    if (!day) {
      return res.status(404).json({
        message: "Day not found"
      });
    }

    day.completed = true;

    await user.save();

    res.status(200).json({
      message: "Day marked completed"
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update progress"
    });
  }
};



export const generateStudyPlan =
  async (req, res) => {

    try {

      // =========================
      // FIND USER
      // =========================

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {

        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // =========================
      // CURRENT SHORT TERM DAY
      // =========================

      const shortCreatedAt =
        user.studyPlans?.[0]
          ?.createdAt;

      let days = 0;

      if (shortCreatedAt) {

        const diffMs =
          Date.now() -
          new Date(
            shortCreatedAt
          ).getTime();

        days = Math.floor(
          diffMs /
          (1000 * 60 * 60 * 24)
        );
      }

      console.log(
        "SHORT DAYS:",
        days
      );

      // =========================
      // SHORT TERM TOPIC
      // =========================

      const shortTermTopic =
        user.studyPlans?.[0]
          ?.topics?.[days]
          ?.topic ||
        "General Study";

      console.log(
        `SHORT TERM TOPIC ${days}:`,
        shortTermTopic
      );

      // =========================
      // SHORT GOAL
      // =========================

      const shortGoal =
        user.studyPlans?.[0]
          ?.goal ||
        "No Goal";

      console.log(
        "SHORT GOAL:",
        shortGoal
      );

      // =========================
      // USER LEVEL
      // =========================

      const level =
        user.educationLevel ||
        "beginner";

      console.log(
        "LEVEL:",
        level
      );

      // =========================
      // LONG TERM DAY ANALYSIS
      // =========================

      const longCreatedAt =
        user.longTermPlans?.[0]
          ?.createdAt;

      let ldays = 0;

      if (longCreatedAt) {

        const diffMs =
          Date.now() -
          new Date(
            longCreatedAt
          ).getTime();

        ldays = Math.floor(
          diffMs /
          (1000 * 60 * 60 * 24)
        );
      }

      console.log(
        "LONG DAYS:",
        ldays
      );

      // =========================
      // MONTH / WEEK / DAY
      // =========================

      const lmonths =
        Math.floor(
          ldays / 30
        );

      const lweeks =
        Math.floor(
          (ldays % 30) / 7
        );

      const finalDays =
        ldays % 7;

      console.log({
        lmonths,
        lweeks,
        finalDays,
      });

      // =========================
      // LONG TERM PLAN
      // =========================

      const longTermPlan =
        user.longTermPlans?.[0]
          ?.goal ||
        "No Long Goal";

      console.log(
        "LONG TERM PLAN:",
        longTermPlan
      );

      // =========================
      // LONG TERM TOPIC
      // =========================

      const longTermTopic =
        user.longTermPlans?.[0]
          ?.roadmap?.months?.[
            lmonths
          ]?.weeks?.[
            lweeks
          ]?.days?.[
            finalDays
          ]?.topic ||
        "Revision";

      console.log(
        "LONG TERM TOPIC:",
        longTermTopic
      );

      // =========================
      // WEAK TOPIC
      // =========================

      const weakTopic =
        user.weakTopics?.[0]?.topic ||
        "General";

      console.log(
        "WEAK TOPIC:",
        weakTopic
      );

      // =========================
      // HOURS PER DAY
      // =========================

      const hoursPerDay = 2;

      // =========================
      // INCOMPLETE TASKS
      // =========================

      const incompleteTasks =
        (user.practiceHistory || [])
          .filter(p => p.accuracy < 60)
          .slice(0, 3)
          .map(p => p.topic)
          .join(", ") || "None";

      console.log(
        "INCOMPLETE TASKS:",
        incompleteTasks
      );

      // =========================
      // GENERATE TODAY AI PLAN
      // =========================

      const plan =
        await generateTodayAIPlan({

          shortTermTopic,

          longTermTopic,

          weakTopic,

          currentDay:
            days + 1,

          level,

          shortGoal,

          hoursPerDay,

          incompleteTasks,
        });

      console.log(
        "GENERATED PLAN:",
        plan
      );

      // =========================
      // VALIDATION
      // =========================

      if (
        !plan ||
        !plan.success ||
        !plan.data
      ) {

        return res.status(500).json({
          success: false,
          message:
            "AI failed to generate plan",
        });
      }

      // =========================
      // SAVE TODAY PLAN
      // =========================

      if (!user.todayPlans) {

        user.todayPlans = [];
      }

      user.todayPlans.unshift(
        plan.data
      );

      await user.save();
      console.log("Today's plan saved successfully");

      // =========================
      // RESPONSE
      // =========================

      return res.status(200).json({

        success: true,

        message:
          "Today's AI plan generated successfully",

        data:
          plan.data,
      });

    } catch (error) {

      console.error(
        "Generate study plan error:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          error.message ||
          "Internal server error",
      });
    }
  };





/**
 * Get today's adaptive study plan
 * Analyzes long-term, short-term, weak topics, and incomplete tasks
 * Returns exactly 5 activities with proper distribution
 */
export const getTodayPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.studyPlans || user.studyPlans.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No study plan found"
      });
    }

    // Get latest plans
    const shortTermPlan = user.studyPlans[0];
    const longTermPlan = user.longTermPlans?.[0];

    // Calculate current day
    const createdAt = new Date(shortTermPlan.createdAt || Date.now());
    const today = new Date();
    const daysDiff = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
    const currentDay = daysDiff + 1;

    // Extract topics from plans
    let shortTermTopic = "General";
    let longTermTopic = "General";

    if (shortTermPlan.roadmap?.months?.[0]?.weeks?.[0]?.days?.[0]) {
      shortTermTopic = shortTermPlan.roadmap.months[0].weeks[0].days[0].topic;
    }

    if (longTermPlan?.roadmap?.months?.[0]?.weeks?.[0]?.days?.[0]) {
      longTermTopic = longTermPlan.roadmap.months[0].weeks[0].days[0].topic;
    }

    // Get weak topics
    const weakTopics = (user.weakTopics || [])
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 3)
      .map(wt => wt.topic);

    // Get incomplete tasks from practice history
    const incompleteTasks = (user.practiceHistory || [])
      .filter(p => p.accuracy < 60)
      .slice(0, 3)
      .map(p => p.topic);

    const level = user.educationLevel || "beginner";
    const hoursPerDay = 2;

    // Generate focus area
    let focusArea = shortTermTopic;
    if (weakTopics.length > 0) {
      focusArea = `${shortTermTopic} + ${weakTopics[0]} revision`;
    }

    // Generate 5 activities with proper distribution
    const activities = [];
    let activityId = 1;

    // Activity 1: Weak Topic Quiz (if weak topics exist)
    if (weakTopics.length > 0) {
      activities.push({
        id: String(activityId++),
        type: "quiz",
        title: `${weakTopics[0]} Revision Quiz`,
        description: "Revisit your weak topic with a focused quiz",
        completed: false,
        duration: "20 mins",
        xp: 100
      });
    } else {
      activities.push({
        id: String(activityId++),
        type: "quiz",
        title: `${shortTermTopic} Concept Quiz`,
        description: "Test your understanding of today's concept",
        completed: false,
        duration: "20 mins",
        xp: 100
      });
    }

    // Activity 2: Practical Coding/Problem Solving
    activities.push({
      id: String(activityId++),
      type: "coding",
      title: `${shortTermTopic} Practice Problem`,
      description: "Solve a practical coding problem on today's topic",
      completed: false,
      difficulty: level,
      duration: "40 mins",
      xp: 150
    });

    // Activity 3: Study Notes / Flashcards
    activities.push({
      id: String(activityId++),
      type: "flashcard",
      title: `${shortTermTopic} Key Concepts`,
      description: "Review important definitions and concepts",
      completed: false,
      duration: "15 mins",
      xp: 75
    });

    // Activity 4: Revision / Long-term Goal Connection
    activities.push({
      id: String(activityId++),
      type: "revision",
      title: `${longTermTopic} Progress Check`,
      description: "Review progress on your long-term learning goal",
      completed: false,
      duration: "15 mins",
      xp: 75
    });

    // Activity 5: Focus Session / Deep Work
    activities.push({
      id: String(activityId++),
      type: "focus",
      title: "Deep Work Session",
      description: "Focused learning on the most challenging concept today",
      completed: false,
      duration: `${hoursPerDay * 60} mins`,
      xp: 200
    });

    const todayPlan = {
      day: currentDay,
      date: today.toISOString().split('T')[0],
      focusArea,
      level,
      hoursPerDay,
      shortTermTopic,
      longTermTopic,
      weakTopics,
      activities,
      totalXP: activities.reduce((sum, a) => sum + (a.xp || 0), 0),
      estimatedDuration: activities.reduce((sum, a) => {
        const mins = parseInt(a.duration) || 0;
        return sum + mins;
      }, 0),
      completedActivities: 0,
      createdAt: new Date()
    };

    // Save daily plan to database
    user.dailyPlan = todayPlan;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Today's adaptive study plan generated and saved",
      data: todayPlan
    });

  } catch (error) {
    console.error("Error generating today's plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate today's plan",
      error: error.message
    });
  }
};

/**
 * Complete an activity in today's plan
 * When all activities are completed, regenerate a new daily plan
 */
export const completeActivity = async (req, res) => {
  try {
    const { activityId } = req.body;

    if (!activityId) {
      return res.status(400).json({
        success: false,
        message: "Activity ID is required"
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.dailyPlan) {
      return res.status(404).json({
        success: false,
        message: "No daily plan found"
      });
    }

    // Find and complete the activity
    const activity = user.dailyPlan.activities.find(
      a => a.id === String(activityId)
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    if (activity.completed) {
      return res.status(400).json({
        success: false,
        message: "Activity already completed"
      });
    }

    // Mark activity as completed
    activity.completed = true;
    user.dailyPlan.completedActivities =
      (user.dailyPlan.completedActivities || 0) + 1;

    // Award XP
    user.xpPoints = (user.xpPoints || 0) + (activity.xp || 0);

    // Check if all activities are completed
    const allCompleted = user.dailyPlan.activities.every(a => a.completed);

    await user.save();

    const response = {
      success: true,
      message: "Activity completed successfully",
      data: {
        activityId,
        activity,
        completedActivities: user.dailyPlan.completedActivities,
        totalActivities: user.dailyPlan.activities.length,
        xpEarned: activity.xp || 0,
        totalXP: user.xpPoints,
        allCompleted
      }
    };

    // If all activities completed, regenerate new daily plan
    if (allCompleted) {
      response.message =
        "All activities completed! New plan will be generated.";

      // Trigger plan regeneration
      setTimeout(() => {
        // This will be handled by the next getTodayPlan call
        console.log(
          `Auto-regenerating daily plan for user ${req.user.userId}`
        );
      }, 1000);
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error("Error completing activity:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete activity",
      error: error.message
    });
  }
};

/**
 * Get today's saved daily plan
 * Returns the saved daily plan without regenerating
 */
export const getSavedTodayPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.dailyPlan) {
      return res.status(404).json({
        success: false,
        message: "No daily plan saved yet"
      });
    }

    // Check if plan is from today
    const savedDate = new Date(user.dailyPlan.date).toDateString();
    const today = new Date().toDateString();

    if (savedDate !== today) {
      return res.status(200).json({
        success: true,
        message: "Daily plan from previous day",
        data: user.dailyPlan,
        isExpired: true
      });
    }

    return res.status(200).json({
      success: true,
      message: "Today's saved daily plan retrieved",
      data: user.dailyPlan,
      isExpired: false
    });

  } catch (error) {
    console.error("Error retrieving saved plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve saved plan",
      error: error.message
    });
  }
};

export const getStudyPlans = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    const plans = user.studyPlans.map(plan => {
      let totalDays = 0;
      let completedDays = 0;

      // Handle new roadmap format (with months/weeks/days)
      if (plan.roadmap && plan.roadmap.months) {
        const allDays = [];

        for (const month of plan.roadmap.months) {
          for (const week of month.weeks) {
            for (const day of week.days) {
              allDays.push(day);
            }
          }
        }

        totalDays = allDays.length;
        completedDays = allDays.filter(d => d.completed).length;
      }
      // Handle old format (with days array directly)
      else if (plan.days && Array.isArray(plan.days)) {
        totalDays = plan.days.length;
        completedDays = plan.days.filter(d => d.completed).length;
      }

      const progress =
        totalDays > 0
          ? Math.round((completedDays / totalDays) * 100)
          : 0;

      return {
        ...plan.toObject(),
        totalDays,
        completedDays,
        progress
      };
    });

    res.status(200).json({
      data: plans
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to load plans"
    });
  }
};

export const getAllPlans = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Helper function to calculate plan progress
    const calculatePlanProgress = (plan) => {
      let totalDays = 0;
      let completedDays = 0;

      if (plan.roadmap && plan.roadmap.months) {
        const allDays = [];

        for (const month of plan.roadmap.months) {
          for (const week of month.weeks) {
            for (const day of week.days) {
              allDays.push(day);
            }
          }
        }

        totalDays = allDays.length;
        completedDays = allDays.filter(d => d.completed).length;
      }
      else if (plan.days && Array.isArray(plan.days)) {
        totalDays = plan.days.length;
        completedDays = plan.days.filter(d => d.completed).length;
      }

      const progress =
        totalDays > 0
          ? Math.round((completedDays / totalDays) * 100)
          : 0;

      return {
        ...plan.toObject(),
        totalDays,
        completedDays,
        progress,
        type: "short-term"
      };
    };

    // Get short-term plans
    const shortTermPlans = (user.studyPlans || []).map(calculatePlanProgress);

    // Get long-term plans
    const longTermPlans = (user.longTermPlans || []).map(plan => {
      const planWithProgress = calculatePlanProgress(plan);
      return {
        ...planWithProgress,
        type: "long-term"
      };
    });

    // Combine both
    const allPlans = {
      shortTermPlans,
      longTermPlans,
      total: shortTermPlans.length + longTermPlans.length
    };

    res.status(200).json({
      success: true,
      data: allPlans
    });

  } catch (error) {
    console.error("Error fetching all plans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load plans",
      error: error.message
    });
  }
};

export const getLatestPlans = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Helper function to calculate plan progress
    const calculatePlanProgress = (plan) => {
      let totalDays = 0;
      let completedDays = 0;

      if (plan.roadmap && plan.roadmap.months) {
        const allDays = [];

        for (const month of plan.roadmap.months) {
          for (const week of month.weeks) {
            for (const day of week.days) {
              allDays.push(day);
            }
          }
        }

        totalDays = allDays.length;
        completedDays = allDays.filter(d => d.completed).length;
      }
      else if (plan.days && Array.isArray(plan.days)) {
        totalDays = plan.days.length;
        completedDays = plan.days.filter(d => d.completed).length;
      }

      const progress =
        totalDays > 0
          ? Math.round((completedDays / totalDays) * 100)
          : 0;

      return {
        ...plan.toObject(),
        totalDays,
        completedDays,
        progress
      };
    };

    // Get latest short-term plan (first in array, as new plans are unshifted)
    const latestShortTermPlan = (user.studyPlans && user.studyPlans.length > 0)
      ? calculatePlanProgress(user.studyPlans[0])
      : null;

    // Get latest long-term plan (first in array, as new plans are unshifted)
    const latestLongTermPlan = (user.longTermPlans && user.longTermPlans.length > 0)
      ? calculatePlanProgress(user.longTermPlans[0])
      : null;

    const latestPlans = {
      shortTermPlan: latestShortTermPlan ? {
        ...latestShortTermPlan,
        type: "short-term"
      } : null,
      longTermPlan: latestLongTermPlan ? {
        ...latestLongTermPlan,
        type: "long-term"
      } : null
    };

    res.status(200).json({
      success: true,
      data: latestPlans
    });

  } catch (error) {
    console.error("Error fetching latest plans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load latest plans",
      error: error.message
    });
  }
};


const updateWeakTopic = (user, topic) => {
  const found = user.weakTopics.find(
    item => item.topic.toLowerCase() === topic.toLowerCase()
  );

  if (found) {
    found.wrongCount += 1;
    found.lastWrongAt = new Date();
  } else {
    user.weakTopics.push({
      topic,
      wrongCount: 1,
      lastWrongAt: new Date()
    });
  }
};

const addXP = (user, points = 10) => {
  user.xpPoints += points;

  while (user.xpPoints >= user.level * 100) {
    user.level += 1;
  }
};

/**
 * Generate chat response
 */
export const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message is required" });
    }

    const response = await generateChatResponse(message);

    const user = await User.findById(req.user.userId);

    if (user) {
      user.chatHistory.unshift({
        userMessage: message,
        aiReply: response
      });

      if (user.chatHistory.length > 30) {
        user.chatHistory = user.chatHistory.slice(0, 30);
      }

      addXP(user, 5);
      await user.save();
    }

    res.status(200).json({
      message: "Response generated successfully",
      data: {
        userMessage: message,
        aiResponse: response
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to generate response"
    });
  }
};

/**
 * Generate quiz
 */
export const generateQuizEndpoint = async (req, res) => {
  try {
    const { topic, numQuestions = 5 } = req.body;

    const quiz = await generateQuiz(topic, numQuestions);

    const user = await User.findById(req.user.userId);

    if (user) {
      user.practiceHistory.unshift({
        sessionType: "quiz",
        topic,
        score: 0,
        total: numQuestions,
        accuracy: 0
      });

      addXP(user, 10);
      await user.save();
    }

    res.status(200).json({
      message: "Quiz generated successfully",
      data: quiz
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to generate quiz"
    });
  }
};


export const submitQuizResult = async (req, res) => {
  try {
    const { topic, score, total } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const accuracy = Math.round((score / total) * 100);

    user.practiceHistory.unshift({
      sessionType: "quiz",
      topic,
      score,
      total,
      accuracy
    });

    if (accuracy < 60) {
      updateWeakTopic(user, topic);
    }

    addXP(user, score * 2);

    await user.save();

    res.status(200).json({
      message: "Quiz result saved",
      data: {
        accuracy,
        xpPoints: user.xpPoints,
        level: user.level
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to save result"
    });
  }
};

/**
 * Summarize text
 */
export const summarize = async (req, res) => {

  try {

    const { text, style = "medium" } = req.body;

    // Validation
    if (!text || text.trim() === "") {

      return res.status(400).json({
        message: "Text is required"
      });
    }

    // Style validation
    if (
      !["short", "medium", "detailed"]
        .includes(style)
    ) {

      return res.status(400).json({

        message:
          "Invalid style. Choose: short, medium, or detailed"

      });
    }

    // Generate summary
    const summary = await summarizeText(
      text,
      style
    );

    // Save in user chat history
    if (req.user?.id) {

      const user = await User.findById(
        req.user.id
      );

      if (user) {

        user.chatHistory.push({

          userMessage: text,

          aiReply: summary,

          createdAt: new Date()

        });

        await user.save();
      }
    }

    // Response
    res.status(200).json({

      message:
        "Text summarized successfully",

      data: {

        originalText:
          text.substring(0, 100) + "...",

        style,

        summary

      }

    });

  } catch (error) {

    console.error(
      "Summarization error:",
      error
    );

    res.status(500).json({

      message:
        "Failed to summarize text",

      error: error.message

    });
  }
};

/**
 * Generate flashcards
 */
export const generateFlashcardsEndpoint = async (req, res) => {
  try {
    const { topic, numCards = 10 } = req.body;

    if (!topic || topic.trim() === '') {
      return res.status(400).json({ message: 'Topic is required' });
    }

    if (numCards < 1 || numCards > 50) {
      return res.status(400).json({ message: 'Number of cards must be between 1 and 50' });
    }

    const flashcards = await generateFlashcards(topic, numCards);

    res.status(200).json({
      message: 'Flashcards generated successfully',
      data: flashcards,
    });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({ message: 'Failed to generate flashcards', error: error.message });
  }
};

/**
 * Generate coding problem
 */
export const generateCodingProblemEndpoint = async (req, res) => {

  try {

    const {
      topic,
      difficulty = "easy"
    } = req.body;

    // VALIDATION

    if (!topic || topic.trim() === "") {

      return res.status(400).json({
        message: "Topic is required"
      });
    }

    if (
      !["easy", "medium", "hard"]
        .includes(difficulty)
    ) {

      return res.status(400).json({
        message:
          "Difficulty must be easy, medium, or hard"
      });
    }

    // GET USER

    const user =
      await User.findById(
        req.user.userId
      );

    if (!user) {

      return res.status(404).json({
        message: "User not found"
      });
    }

    let codingProblem;

    let validationResult;

    let attempts = 0;

    // TRY MAX 3 TIMES

    while (attempts < 3) {

      attempts++;

      console.log(
        `🔁 Attempt ${attempts}`
      );

      // GENERATE PROBLEM

      codingProblem =
        await generateCodingProblem(
          topic,
          difficulty
        );

      // VALIDATE SOLUTION

      validationResult =
        await codeExecutor.runTestCases(
          codingProblem.solutionCode,
          codingProblem.language,
          codingProblem.testCases
        );

      console.log(
        "🧪 Validation Result:",
        JSON.stringify(
          validationResult,
          null,
          2
        )
      );

      // ALL TESTCASES PASSED

      if (
        validationResult.passed ===
        validationResult.total
      ) {

        console.log(
          "✅ AI problem validated"
        );

        break;
      }

      console.log(
        "❌ Invalid AI problem, regenerating..."
      );
    }

    // FINAL FAILURE

    if (
      validationResult.passed !==
      validationResult.total
    ) {

      return res.status(500).json({

        message:
          "AI generated invalid problem after multiple attempts"
      });
    }

    // CREATE STUDY PLAN

    if (
      !user.studyPlans ||
      user.studyPlans.length === 0
    ) {

      user.studyPlans.push({

        title:
          "Coding Practice",

        goal:
          "Daily Coding",

        days: [],

        current: []
      });
    }

    // SAVE PROBLEM

    const latestPlan =
      user.studyPlans[
      user.studyPlans.length - 1
      ];

    latestPlan.current = [
      codingProblem
    ];

    user.markModified(
      "studyPlans"
    );

    await user.save();

    console.log(
      "✅ Tested coding problem saved"
    );

    // RESPONSE

    return res.status(200).json({

      message:
        "Coding problem generated successfully",

      data:
        codingProblem
    });

  } catch (error) {

    console.error(
      "Coding problem generation error:",
      error
    );

    return res.status(500).json({

      message:
        "Failed to generate coding problem",

      error:
        error.message
    });
  }
};

/**
 * Evaluate submitted coding solution
 */
export const evaluateCodingSolutionEndpoint =
  async (req, res) => {

    try {

      const {
        code,
        language = "cpp"
      } = req.body;

      // Validation
      if (
        !code ||
        code.trim() === ""
      ) {

        return res.status(400).json({

          message:
            "Solution code is required"
        });
      }

      // Get user
      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {

        return res.status(404).json({
          message: "User not found"
        });
      }

      // Check study plans
      if (
        !user.studyPlans ||
        user.studyPlans.length === 0
      ) {

        return res.status(404).json({
          message:
            "No coding problem found"
        });
      }

      // Latest study plan
      const latestPlan =
        user.studyPlans[
        user.studyPlans.length - 1
        ];

      // Current problem
      const currentProblem =
        latestPlan.current?.[0];

      if (!currentProblem) {

        return res.status(404).json({
          message:
            "Current problem not found"
        });
      }

      // DB testcases
      const testCases =
        currentProblem.testCases || [];
      console.log(
        "DB TESTCASES:",
        JSON.stringify(
          testCases,
          null,
          2
        )
      );

      // Run code
      const executionResult =
        await codeExecutor.runTestCases(

          code,

          language,

          testCases
        );

      console.log(
        "Execution Result:",
        JSON.stringify(
          executionResult,
          null,
          2
        )
      );

      const passed =
        executionResult?.passed ?? 0;

      const total =
        executionResult?.total ??
        testCases.length;

      const score =
        executionResult?.score ?? 0;

      const results =
        executionResult?.testCases ?? [];

      // Final response
      const evaluation = {

        isCorrect:
          passed === total &&
          total > 0,

        score,

        passed,

        total,

        results:
          results.map(tc => ({

            input:
              tc.input,

            expected:
              tc.expected ??
              tc.expectedOutput ??
              "",

            actual:
              tc.actual,

            passed:
              tc.passed,

            error:
              tc.error || null
          })),

        issues:
          results
            .filter(tc => !tc.passed)
            .map(tc =>

              tc.error

                ? `Error: ${tc.error}`

                : `Expected "${tc.expected}" but got "${tc.actual}"`
            ),

        suggestions:

          passed === total

            ? [
              "Great job! All test cases passed."
            ]

            : [
              "Review failing test cases",
              "Check edge cases",
              "Verify input parsing",
              "Check logic carefully"
            ],

        summary:
          `Passed ${passed}/${total} test cases`
      };

      console.log(evaluation);





      return res.status(200).json({

        message:
          "Coding solution evaluated successfully",

        data:
          evaluation
      });

    } catch (error) {

      console.error(
        "Coding evaluation error:",
        error
      );

      return res.status(500).json({

        message:
          "Failed to evaluate coding solution",

        error:
          error.message
      });
    }
  };

/**
 * Explain a concept
 */
export const explain = async (req, res) => {
  try {
    const { concept, level = 'intermediate' } = req.body;

    if (!concept || concept.trim() === '') {
      return res.status(400).json({ message: 'Concept is required' });
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
      return res.status(400).json({ message: 'Invalid level. Choose: beginner, intermediate, or advanced' });
    }

    const explanation = await explainConcept(concept, level);

    res.status(200).json({
      message: 'Explanation generated successfully',
      data: {
        concept,
        level,
        explanation,
      },
    });
  } catch (error) {
    console.error('Explanation error:', error);
    res.status(500).json({ message: 'Failed to generate explanation', error: error.message });
  }
};

/**
 * Generate study notes
 */
export const notes = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || topic.trim() === '') {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const studyNotes = await generateStudyNotes(topic);

    res.status(200).json({
      message: 'Study notes generated successfully',
      data: {
        topic,
        notes: studyNotes,
      },
    });
  } catch (error) {
    console.error('Study notes error:', error);
    res.status(500).json({ message: 'Failed to generate study notes', error: error.message });
  }
};

/**
 * Run code directly
 */
export const runCodeDirectly = async (req, res) => {
  try {
    const { code, language = 'javascript', stdin = '' } = req.body;

    if (!code || code.trim() === '') {
      return res.status(400).json({ message: 'Code is required' });
    }

    if (!['python', 'javascript', 'cpp', 'c', 'java'].includes(language)) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const result = await codeExecutor.execute(code, language, stdin);

    return res.status(200).json({
      message: 'Code executed successfully',
      data: {
        stdout: result.stdout,
        stderr: result.stderr,
        status: result.status
      }
    });

  } catch (error) {
    console.error('Code execution error:', error);
    return res.status(500).json({
      message: 'Failed to execute code',
      error: error.message
    });
  }
};




export const createStudyPlan = async (req, res) => {
  try {
    const validatedData = studyPlanSchema.parse(req.body);

    const result = await generateAIStudyPlan(
      validatedData.goal,
      validatedData.shortTermDays,
      validatedData.longTermDays,
      validatedData.hoursPerDay,
      validatedData.level
    );

    res.status(200).json(result);

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const generateShortTermPlanController =
  async (req, res) => {

    try {

      const {
        goal,
        days,
        hoursPerDay,
        level
      } = req.body;

      const plan =
        await generateShortTermPlan(
          goal,
          days,
          hoursPerDay,
          level
        );

      const user =
        await User.findById(
          req.user.userId
        );

      if (!user) {

        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      user.studyPlans.unshift(plan);

      await user.save();

      return res.status(200).json({

        success: true,

        data: plan,

        message:
          "Short-term plan generated and saved successfully"
      });

    } catch (error) {

      return res.status(500).json({

        success: false,

        message:
          "Failed to generate short-term plan",

        error:
          error.message
      });
    }
  };

export const generateLongTermPlanController =
  async (req, res) => {

    try {

      const {
        goal,
        days,
        level
      } = req.body;

      console.log(
        "Generating long-term plan with:",
        { goal, days, level }
      );

      const plan =
        await generateLongTermPlan(
          goal,
          days,
          level
        );

      // Save plan to database
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      user.longTermPlans.unshift({
        title: goal,
        goal: goal,
        roadmap: plan
      });

      await user.save();

      return res.status(200).json({

        success: true,

        data: plan,

        message: "Long-term plan generated and saved successfully"
      });

    } catch (error) {

      return res.status(500).json({

        success: false,

        message:
          "Failed to generate long-term plan",

        error:
          error.message
      });
    }
  };

export const getTodayTasks =
  async (req, res) => {

    try {

      const user =
        await User.findById(
          req.user.userId
        );

      const weakTopics =
        user.weakTopics || [];

      const incompleteTasks =
        user.incompleteTasks || [];

      const todayTask =
        await generateTodayTask({

          goal:
            user.currentGoal,

          weakTopics,

          incompleteTasks,

          dayNumber:
            user.currentDay || 1,

          hoursPerDay:
            user.hoursPerDay || 2,

          level:
            user.level || "beginner"
        });

      return res.status(200).json({

        success: true,

        data: todayTask
      });

    } catch (error) {

      return res.status(500).json({

        success: false,

        message:
          "Failed to generate today tasks",

        error:
          error.message
      });
    }
  };

export const createLongTermPlan =
  async (req, res) => {

    try {

      console.log(
        "======================"
      );

      console.log(
        "LONG TERM API HIT"
      );

      console.log(
        "REQ USER:"
      );

      console.log(req.user);

      console.log(
        "REQ BODY:"
      );

      console.log(req.body);

      // ======================
      // FIND USER
      // ======================

      const userId =
        req.user.userId;

      const user =
        await User.findById(
          userId
        );

      console.log(
        "USER FOUND:"
      );

      console.log(user);

      if (!user) {

        console.log(
          "USER NOT FOUND"
        );

        return res.status(404)
          .json({

            success: false,

            message:
              "User not found"
          });
      }

      // ======================
      // BODY
      // ======================

      const {
        goal,
        totalDays = 150,
        level = "beginner"
      } = req.body;

      console.log(
        "GOAL:",
        goal
      );

      console.log(
        "TOTAL DAYS:",
        totalDays
      );

      console.log(
        "LEVEL:",
        level
      );

      // ======================
      // GENERATE ROADMAP
      // ======================

      console.log(
        "GENERATING ROADMAP..."
      );

      const roadmap =
        await generateLongTermPlan(
          goal,
          totalDays,
          level
        );

      console.log(
        "ROADMAP GENERATED"
      );

      console.log(roadmap);

      // ======================
      // PUSH PLAN
      // ======================

      console.log(
        "OLD PLAN COUNT:"
      );

      console.log(
        user.longTermPlans
          ?.length
      );

      user.longTermPlans.push({

        title:
          roadmap.title,

        goal:
          roadmap.goal,

        roadmap,

        createdAt:
          new Date()
      });

      console.log(
        "PLAN PUSHED"
      );

      console.log(
        "NEW PLAN COUNT:"
      );

      console.log(
        user.longTermPlans
          ?.length
      );

      // ======================
      // MARK MODIFIED
      // ======================

      user.markModified(
        "longTermPlans"
      );

      console.log(
        "MARK MODIFIED DONE"
      );

      // ======================
      // SAVE USER
      // ======================

      console.log(
        "SAVING USER..."
      );



      const savedUser =
        await user.save();

      console.log(
        "USER SAVED"
      );

      console.log(
        savedUser
          .longTermPlans
          ?.length
      );

      console.log(
        "======================"
      );

      // ======================
      // RESPONSE
      // ======================

      return res.status(201)
        .json({

          success: true,

          message:
            "Long-term roadmap created successfully",

          data: roadmap
        });

    } catch (error) {

      console.log(
        "======================"
      );

      console.log(
        "LONG TERM ERROR"
      );

      console.log(error);

      console.log(
        error.message
      );

      console.log(
        "======================"
      );

      return res.status(500)
        .json({

          success: false,

          message:
            "Failed to create roadmap",

          error:
            error.message
        });
    }
  };