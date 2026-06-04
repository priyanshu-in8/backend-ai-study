import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const shortTermPlanSchema = new mongoose.Schema({

  title: String,

  goal: String,

  level: Number,

  duration: String,

  topics: [
    {
      day: Number,

      topic: String,

      completed: {
        type: Boolean,
        default: false
      }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }

}, {
  _id: false
});



const studyPlanSchema =
new mongoose.Schema({

  title: String,

  goal: String,

  roadmap: {

    totalMonths: Number,

    months: [
      {
        month: Number,

        summary: String,

        focus: String,

        topics: [
          String
        ],

        milestone: String,

        weeks: [
          {
            week: Number,

            summary: String,

            focus: String,

            topics: [
              String
            ],

            milestone: String,

            days: [
              {
                day: Number,

                topic: String
              }
            ]
          }
        ]
      }
    ]
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

}, {
  _id: false
});
/* ================= CURRENT PROBLEM SCHEMA ================= */

const currentProblemSchema =
new mongoose.Schema({

  problem: String,

  description: String,

  difficulty: String,

  topic: String,

  language: String,

  starterCode: String,

  solutionCode: String,

  examples: [
    {
      input: String,
      output: String
    }
  ],

  testCases: [
    {
      input: String,

      expectedOutput: String,

      isHidden: Boolean
    }
  ],

  constraints: [
    String
  ],

  solutionApproach: String

}, {
  _id: false
});

/* ================= STUDY PLAN SCHEMA ================= */

/* ================= USER SCHEMA ================= */

const userSchema =
new mongoose.Schema(
{
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },

  password: {
  type: String,
  minlength: 6,
  select: false,
  default: null
},


  isVerified: {
    type: Boolean,
    default: false
  },

  verificationToken: {
    type: String,
    select: false
  },

  verificationTokenExpires: {
    type: Date,
    select: false
  },

  // Education
 role: {
    type: String,
    enum: [
      "student",
      "teacher",
      "admin"
    ],
    default: "student"
  },

educationLevel: {
  type: String,
  default: "Not Specified"
},

  subjects: [String],

  // AI Chat History
  chatHistory: [
    {
      userMessage: String,

      aiReply: String,

      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  // Weak Topics
 // Weak Topics
weakTopics: [
  {
    topic: String,

    wrongCount: {
      type: Number,
      default: 1
    },

    lastWrongAt: {
      type: Date,
      default: Date.now
    }
  }
],

// =====================
// SHORT-TERM PLANS
// =====================
currentCode:[currentProblemSchema],
studyPlans: [
   shortTermPlanSchema
],

// =====================
// LONG-TERM PLANS
// =====================

longTermPlans: [
  studyPlanSchema
],

// =====================
// DAILY PLANS
// =====================

dailyPlan: {
  date: String,
  day: Number,
  focusArea: String,
  level: String,
  hoursPerDay: Number,
  shortTermTopic: String,
  longTermTopic: String,
  weakTopics: [String],
  activities: [
    {
      id: String,
      type: {
        type: String,
        enum: ["quiz", "coding", "flashcard", "revision", "focus", "notes"]
      },
      title: String,
      description: String,
      completed: {
        type: Boolean,
        default: false
      },
      duration: String,
      xp: Number,
      difficulty: String
    }
  ],
  totalXP: Number,
  estimatedDuration: Number,
  completedActivities: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
},

// =====================
// DAILY MISSIONS
// =====================




  // Daily Missions
  dailyMissions: [
    {
      title: String,

      xp: Number,

      completed: {
        type: Boolean,
        default: false
      }
    }
  ],

  lastMissionDate: Date,

  // Achievements
  achievements: [
    {
      key: String,

      title: String,

      icon: String,

      unlockedAt: Date
    }
  ],

  // Practice History
  practiceHistory: [
    {
      sessionType: {
        type: String,
        enum: [
          "quiz",
          "flashcards",
          "coding"
        ]
      },

      topic: String,

      score: Number,

      total: Number,

      accuracy: Number,

      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  // Gamification
  xpPoints: {
    type: Number,
    default: 0
  },

  level: {
    type: Number,
    default: 1
  },

  streakDays: {
    type: Number,
    default: 0
  },

  currentCode: {
    type: String,
    default: "",
    select: false
  },

  badges: [String],

  // Productivity
  studyHours: {
    type: Number,
    default: 0
  },

  completedTasks: {
    type: Number,
    default: 0
  },

  // Recommendation Engine
  recommendedTopics: [
    String
  ],

  // Last Active
  lastLogin: {
    type: Date,
    default: Date.now
  }

},
{
  timestamps: true
}
);

/* ================= PASSWORD HASH ================= */

userSchema.pre(
  "save",
  async function(next){

    if(
      !this.isModified(
        "password"
      )
    ){
      return next();
    }

    const salt =
      await bcryptjs.genSalt(10);

    this.password =
      await bcryptjs.hash(
        this.password,
        salt
      );

    next();
  }
);

/* ================= MATCH PASSWORD ================= */

userSchema.methods.matchPassword =
async function(password){

  return await bcryptjs.compare(
    password,
    this.password
  );
};

/* ================= CLEAR TOKEN ================= */

userSchema.methods
.clearVerificationToken =
function(){

  this.verificationToken =
    undefined;

  this.verificationTokenExpires =
    undefined;
};

/* ================= MODEL ================= */

const User =
mongoose.model(
  "User",
  userSchema
);

export default User;