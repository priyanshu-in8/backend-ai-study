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
  generateLongTermPlan
 
} from '../services/aiService.js';
import User from "../models/User.js";
import codeExecutor from '../utils/codeExecutor.js';
import { studyPlanSchema } from "../validators/studyPlan.validator.js";


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

export const generateStudyPlan = async (req, res) => {
  try {
    const {
      goal,
      days ,
      hoursPerDay = 2,
      level = "beginner"
    } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const plan = await generateAIStudyPlan(
      goal,
      days,
      hoursPerDay,
      level
    );

    user.studyPlans.unshift({
      title: plan.title,
      goal,
      days: plan.days
    });

    await user.save();

    res.status(200).json({
      message: "Study plan generated and saved",
      data: plan
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const getTodayPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || user.studyPlans.length === 0) {
      return res.status(404).json({
        message: "No study plan found"
      });
    }

    const latestPlan = user.studyPlans[0];

    const nextDay = latestPlan.days.find(
      day => day.completed === false
    );

    if (!nextDay) {
      return res.status(200).json({
        message: "Plan completed",
        data: null
      });
    }

    res.status(200).json({
      message: "Today's task",
      data: {
        title: latestPlan.title,
        day: nextDay.day,
        focus: nextDay.focus,
        tasks: nextDay.tasks
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to load today's task"
    });
  }
};

export const getStudyPlans = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    const plans = user.studyPlans.map(plan => {
      const totalDays = plan.days.length;

      const completedDays = plan.days.filter(
        d => d.completed
      ).length;

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

    // Save plan to database
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.studyPlans.unshift({
      title: goal,
      goal: goal,
      roadmap: plan
    });

    await user.save();

    return res.status(200).json({

      success: true,

      data: plan,

      message: "Short-term plan generated and saved successfully"
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