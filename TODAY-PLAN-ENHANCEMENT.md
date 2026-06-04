# Today's Plan Enhancement - Adaptive Study Planner

## Overview
The `getTodayPlan` controller has been enhanced to implement an **Adaptive AI Study Planner** that generates personalized daily study plans based on multiple learning factors.

## Key Features

### 1. **Current Day Calculation**
```javascript
const daysDiff = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
const currentDay = daysDiff + 1;
```
- Calculates the current day dynamically using the formula: `floor((Today - createdAt) / (1000 × 60 × 60 × 24)) + 1`

### 2. **Dual Plan Analysis**
- **Short-term Plan**: Current learning focus (typically 30 days)
- **Long-term Plan**: Extended learning goals (typically 365 days)
- Extracts the first topic from each plan's roadmap

### 3. **Weak Topic Prioritization**
- Analyzes user's `weakTopics` array
- Sorts by `wrongCount` (descending)
- Takes top 3 weak topics for targeted review
- First weak topic gets dedicated quiz activity

### 4. **Incomplete Task Recovery**
- Reviews `practiceHistory` entries with accuracy < 60%
- Collects up to 3 incomplete topics
- Ensures users revisit previously failed concepts

### 5. **Adaptive Activity Generation**
Returns exactly **5 activities** with guaranteed distribution:

#### Activity 1: Weak Topic Quiz (20 mins, 100 XP)
- If weak topics exist: `${weakTopics[0]} Revision Quiz`
- Otherwise: `${shortTermTopic} Concept Quiz`
- **Type**: `quiz` ✓ Required (ensures weak topic coverage)

#### Activity 2: Practical Coding Problem (40 mins, 150 XP)
- Title: `${shortTermTopic} Practice Problem`
- **Type**: `coding` ✓ Required (practical application)
- Difficulty matches user's level

#### Activity 3: Key Concepts Review (15 mins, 75 XP)
- Title: `${shortTermTopic} Key Concepts`
- **Type**: `flashcard` (memory reinforcement)

#### Activity 4: Long-term Progress Check (15 mins, 75 XP)
- Title: `${longTermTopic} Progress Check`
- **Type**: `revision` ✓ Required (review activity)
- Connects short-term work to long-term goals

#### Activity 5: Deep Work Session (120 mins, 200 XP)
- Title: `Deep Work Session`
- **Type**: `focus` (intense concentration)
- Duration: `${hoursPerDay * 60} minutes`

### 6. **Activity Structure**
Each activity includes:
```javascript
{
  id: "1-5",                    // Unique identifier
  type: "quiz|coding|flashcard|revision|focus",  // Activity type
  title: "...",                 // Short, descriptive title
  description: "...",           // Detailed explanation
  completed: false,             // Always false (new activity)
  duration: "20 mins",          // Time estimate
  xp: 100-200,                  // Experience points reward
  difficulty?: "beginner"       // Optional level
}
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Today's adaptive study plan generated",
  "data": {
    "day": 5,
    "date": "2026-05-31",
    "focusArea": "JavaScript + Promise Handling revision",
    "level": "beginner",
    "hoursPerDay": 2,
    "shortTermTopic": "JavaScript",
    "longTermTopic": "Web Development",
    "weakTopics": ["Promise Handling", "Async-Await", "Callbacks"],
    "activities": [
      {
        "id": "1",
        "type": "quiz",
        "title": "Promise Handling Revision Quiz",
        "description": "Revisit your weak topic with a focused quiz",
        "completed": false,
        "duration": "20 mins",
        "xp": 100
      },
      // ... 4 more activities
    ],
    "totalXP": 600,
    "estimatedDuration": 130  // minutes
  }
}
```

### Error Responses
- **404 - User Not Found**: User ID not in database
- **404 - No Study Plan Found**: User has no study plans created
- **500 - Server Error**: Internal generation failure

## Data Extraction Logic

### Topic Extraction
```javascript
// Short-term topic (from latest short-term plan)
shortTermPlan.roadmap?.months?.[0]?.weeks?.[0]?.days?.[0]?.topic

// Long-term topic (from latest long-term plan)
longTermPlan?.roadmap?.months?.[0]?.weeks?.[0]?.days?.[0]?.topic
```

### Weak Topics
```javascript
user.weakTopics
  .sort((a, b) => b.wrongCount - a.wrongCount)  // Highest failures first
  .slice(0, 3)  // Top 3 only
  .map(wt => wt.topic)
```

### Incomplete Tasks
```javascript
user.practiceHistory
  .filter(p => p.accuracy < 60)  // Failed attempts (< 60% accuracy)
  .slice(0, 3)  // Top 3 only
  .map(p => p.topic)
```

## Requirements Met ✓

| Requirement | Status | Details |
|---|---|---|
| Analyze long-term plan | ✓ | Extracts from `longTermPlans[0].roadmap` |
| Analyze short-term plan | ✓ | Extracts from `studyPlans[0].roadmap` |
| Analyze weak topics | ✓ | Sorts by `wrongCount`, takes top 3 |
| Analyze incomplete tasks | ✓ | Filters `practiceHistory` by accuracy < 60% |
| Current day calculation | ✓ | Uses `floor((Today - createdAt) / milliseconds)` formula |
| Exactly 5 activities | ✓ | Quiz, Coding, Flashcard, Revision, Focus |
| Unique IDs | ✓ | Sequential strings "1" through "5" |
| Non-empty titles | ✓ | All titles dynamically generated from plan topics |
| completed: false | ✓ | All activities initialized with `completed: false` |
| At least 1 weak topic activity | ✓ | Activity 1 (Quiz) prioritizes weak topics |
| At least 1 revision activity | ✓ | Activity 4 is explicitly type `revision` |
| At least 1 practical activity | ✓ | Activity 2 is type `coding` (practical) |
| Valid JSON response | ✓ | Returns clean JSON structure with success flag |
| No markdown/explanations | ✓ | Pure JSON response only |
| Prioritize weak topics | ✓ | First activity targets highest weak topic |
| Recover incomplete tasks | ✓ | Collected in `incompleteTasks` array |
| Balance goals | ✓ | Combines short/long term topics in focus area |
| Progressive activities | ✓ | Logical flow: review → practice → concepts → progress → deep work |

## Improvements Over Previous Version

### Old Implementation
- ❌ Searched for single next incomplete day in roadmap
- ❌ Returned only one task (not 5)
- ❌ Didn't consider weak topics or learning history
- ❌ No activity structure or gamification (XP)
- ❌ Didn't calculate current day accurately

### New Implementation
- ✅ Generates personalized 5-activity daily plan
- ✅ Integrates weak topics for targeted learning
- ✅ Analyzes practice history for gaps
- ✅ Includes XP rewards and duration estimates
- ✅ Accurate current day calculation
- ✅ Clear focus area combining both plans
- ✅ Activity descriptions explain purpose
- ✅ Estimated total duration provided

## Usage Example

**Request:**
```bash
GET /api/ai/today-plan
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Today's adaptive study plan generated",
  "data": {
    "day": 15,
    "date": "2026-05-31",
    "focusArea": "React Hooks + State Management revision",
    "level": "intermediate",
    "hoursPerDay": 2,
    "shortTermTopic": "React Hooks",
    "longTermTopic": "Full-Stack Development",
    "weakTopics": ["State Management", "useContext", "Custom Hooks"],
    "activities": [
      {
        "id": "1",
        "type": "quiz",
        "title": "State Management Revision Quiz",
        "description": "Revisit your weak topic with a focused quiz",
        "completed": false,
        "duration": "20 mins",
        "xp": 100
      },
      // ... 4 more activities
    ],
    "totalXP": 600,
    "estimatedDuration": 130
  }
}
```

## Next Steps (Optional Enhancements)

1. **Activity Completion Tracking**: Add endpoint to mark activities as complete
2. **XP and Gamification**: Integrate with achievement system
3. **Performance Analytics**: Track completion rates and adjust difficulty
4. **Smart Recommendations**: Suggest activities based on past performance
5. **Notification System**: Remind users of their daily plan

## Testing Checklist

- [ ] Endpoint accessible at `GET /api/ai/today-plan`
- [ ] Requires valid JWT authentication
- [ ] Returns 404 when user has no study plans
- [ ] Returns exactly 5 activities
- [ ] All activities have unique IDs
- [ ] All activities have `completed: false`
- [ ] XP totals correctly calculated
- [ ] Duration estimates are reasonable
- [ ] Weak topics appear in Activity 1 title
- [ ] Long-term topic appears in Activity 4 title
- [ ] Current day calculated correctly
