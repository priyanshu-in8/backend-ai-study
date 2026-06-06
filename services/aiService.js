import OpenAI from "openai";
import dotenv from "dotenv";
import codeExecutor
from "../utils/codeExecutor.js";



dotenv.config();

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY, // ✅ FREE API
  baseURL: "https://api.groq.com/openai/v1" // ✅ Groq endpoint
});

//
// 🔥 CORE FUNCTION
//
async function generateResponse(messages) {
  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant", // ✅ FREE + FAST model
      messages,
      temperature: 0.5,
      max_tokens: 1024
    });

    return completion.choices[0]?.message?.content || "No response";

  } catch (error) {
    console.error("Groq error:", error.message);
    throw error;
  }
}

//
// ✅ 1. Chat
//
export const generateChatResponse = async (prompt) => {
  try {
    return await generateResponse([
      { role: "user", content: prompt }
    ]);
  } catch (error) {
    console.error("Chat error:", error.message);
    throw new Error("Failed to generate chat response");
  }
};

//
// ✅ 2. Quiz
//
export const generateQuiz = async (
  topic,
  numQuestions = 25
) => {

  try {

    const chunkSize = 5;

    let allQuestions = [];

    let currentId = 1;

    for (
      let i = 0;
      i < numQuestions;
      i += chunkSize
    ) {

      const remaining =
        numQuestions - i;

      const batchCount =
        remaining >= chunkSize
          ? chunkSize
          : remaining;

      const prompt = `
Generate ${batchCount} MCQ questions on "${topic}".

Return ONLY valid JSON.

Format:
{
  "questions": [
    {
      "id": 1,
      "topic": "${topic}",
      "subTopic": "Specific concept",
      "difficulty": "easy",
      "question": "Question?",
      "options": ["A","B","C","D"],
      "correctAnswer": 0,
      "explanation": "Explain"
    }
  ]
}

Rules:
- Strict JSON only
- No markdown
- No extra text
- Each question must have exactly 4 options
- correctAnswer must be option index (0-3)
- difficulty must be:
  easy / medium / hard
`;

      const text =
        await generateResponse([
          {
            role: "user",
            content: prompt,
          },
        ]);

      console.log(
        "RAW QUIZ RESPONSE:"
      );

      console.log(text);

      let cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const jsonMatch =
        cleaned.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {

        console.log(
          "No valid JSON found"
        );

        continue;
      }

      let parsed;

      try {

        parsed = JSON.parse(
          jsonMatch[0]
        );

      } catch (err) {

        console.log(
          "JSON Parse Error:",
          err.message
        );

        continue;
      }

      if (
        parsed.questions &&
        Array.isArray(
          parsed.questions
        )
      ) {

        const updatedQuestions =
          parsed.questions.map(
            (q) => ({
              id: currentId++,

              topic:
                q.topic || topic,

              subTopic:
                q.subTopic ||
                "General",

              difficulty:
                q.difficulty ||
                "easy",

              question:
                q.question || "",

              options:
                Array.isArray(
                  q.options
                ) &&
                q.options.length === 4
                  ? q.options
                  : [
                      "Option A",
                      "Option B",
                      "Option C",
                      "Option D",
                    ],

              correctAnswer:
                typeof q.correctAnswer ===
                "number"
                  ? q.correctAnswer
                  : 0,

              explanation:
                q.explanation ||
                "No explanation",
            })
          );

        allQuestions.push(
          ...updatedQuestions
        );
      }
    }

    return {
      success: true,
      topic,
      totalQuestions:
        allQuestions.length,
      questions: allQuestions,
    };

  } catch (error) {

    console.error(
      "Quiz error:",
      error.message
    );

    throw new Error(
      "Failed to generate quiz"
    );
  }
};

//
// ✅ 3. Summarize
//
export const summarizeText = async (text, style = "medium") => {
  try {
    let guide = "in 2-3 sentences";
    if (style === "short") guide = "in 1-2 sentences";
    if (style === "detailed") guide = "in detailed paragraphs";

    return await generateResponse([
      {
        role: "user",
        content: `Summarize this ${guide}:\n${text}`
      }
    ]);
  } catch (error) {
    console.error("Summarize error:", error.message);
    throw new Error("Failed to summarize");
  }
};

//
// ✅ 4. Flashcards
//
export const generateFlashcards = async (topic, numCards = 10) => {
  try {
    const prompt = `
Generate ${numCards} flashcards for "${topic}".

Return ONLY JSON:
{
  "topic": "${topic}",
  "flashcards": [
    {
      "id": 1,
      "front": "Question",
      "back": "Answer"
    }
  ]
}
`;

    const text = await generateResponse([
      { role: "user", content: prompt }
    ]);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error("Flashcard error:", error.message);
    throw new Error("Failed to generate flashcards");
  }
};

//
// ✅ 5. Coding problem generation
//
//
// ==============================
// 🔧 Helper: Extract JSON safely
// ==============================
function extractJSON(text) {

  const match = text.match(
    /\{[\s\S]*\}/
  );

  return match ? match[0] : null;
}

//
// ==============================
// 🔧 Helper: Safe JSON Parser
// ==============================
function safeParseJSON(text) {

  try {

    return JSON.parse(text);

  } catch (err) {

    console.log("⚠️ Raw broken JSON:\n");
    console.log(text);

    let fixed = text;

    // Remove markdown
    fixed = fixed
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/`/g, '"')
      .replace(/\r/g, "")
      .trim();

    // Escape multiline strings
    fixed = fixed.replace(
      /"([^"\\]*(\\.[^"\\]*)*)"/gs,
      (match) => {

        return match
          .replace(/\n/g, "\\n")
          .replace(/\t/g, "\\t");
      }
    );

    // Remove trailing commas
    fixed = fixed
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");

    // Fix adjacent objects
    fixed = fixed.replace(
      /}\s*{/g,
      "},{"
    );

    // Escape solutionCode
    fixed = fixed.replace(
      /"solutionCode"\s*:\s*"([\s\S]*?)"/g,
      (match, p1) => {

        const escaped = p1
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\n")
          .replace(/\t/g, "\\t");

        return `"solutionCode":"${escaped}"`;
      }
    );

    // Escape starterCode
    fixed = fixed.replace(
      /"starterCode"\s*:\s*"([\s\S]*?)"/g,
      (match, p1) => {

        const escaped = p1
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\n")
          .replace(/\t/g, "\\t");

        return `"starterCode":"${escaped}"`;
      }
    );

    console.log("✅ Fixed JSON:\n");
    console.log(fixed);

    return JSON.parse(fixed);

  }
}

//
// ==============================
// 🔧 Helper: Clean JSON String
// ==============================
function cleanJSON(text) {

  return text
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

//
// ==============================
// 🚀 Generate Coding Problem
// ==============================
export const generateCodingProblem = async (
  topic,
  difficulty = "medium",
  user
) => {

  try {

const prompt = `
Generate a UNIQUE ${difficulty} competitive programming problem on "${topic}".

STRICT RULES:

1. DO NOT USE:
- markdown
- backticks
- **
- separators
- bullet points
- explanations outside format

2. RETURN ONLY THIS EXACT FORMAT:

TITLE:
<problem title>

DESCRIPTION:
<clear problem description>

LANGUAGE:
cpp

STARTER_CODE:
<incomplete code only>

SOLUTION_CODE:
<fully correct complete code>

EXAMPLES:
Input:
<stdin input>

Output:
<stdout output>

TEST_CASES:
INPUT:
<stdin input>

EXPECTED:
<correct stdout output>

INPUT:
<stdin input>

EXPECTED:
<correct stdout output>

CONSTRAINTS:
<constraint 1>
<constraint 2>

SOLUTION_APPROACH:
<short approach>

IMPORTANT RULES:

- STARTER_CODE and SOLUTION_CODE sections are REQUIRED
- Never leave any section empty
- STARTER_CODE and SOLUTION_CODE must be DIFFERENT
- STARTER_CODE must contain:
  - TODO comments
  - incomplete logic
  - no final algorithm
  - no final answer generation

GOOD STARTER_CODE EXAMPLE:

#include <bits/stdc++.h>
using namespace std;

int main() {

    int n;
    cin >> n;

    vector<int> arr(n);

    for(int i = 0; i < n; i++) {
        cin >> arr[i];
    }

    // TODO: Write your logic here

    return 0;
}

BAD STARTER_CODE:
- full working solution
- copied solution code
- complete logic

INPUT/OUTPUT RULES:

- ALL INPUTS MUST BE RAW STDIN FORMAT
- ALL OUTPUTS MUST BE RAW STDOUT FORMAT

GOOD INPUT:
5 3
1 2 3 4 5

GOOD OUTPUT:
12

BAD INPUT:
arr = [1,2,3,4,5], k = 3

BAD OUTPUT:
The answer is 12

TESTCASE RULES:

- testCases MUST match the code input format exactly
- expected outputs MUST be mathematically correct
- every testcase MUST be executable directly from stdin
- include edge cases
- include at least 3 testcases

SOLUTION RULES:

- SOLUTION_CODE MUST compile successfully
- SOLUTION_CODE MUST pass all testcases
- Use stdin/stdout only
- No hardcoded outputs
- No fake logic
- No placeholder logic

VERY IMPORTANT:

Before returning the response:

1. Mentally execute the SOLUTION_CODE
2. Verify every expectedOutput manually
3. Ensure all testcases pass correctly
4. Ensure STARTER_CODE != SOLUTION_CODE
5. Ensure input format exactly matches cin statements
6. Ensure no markdown or backticks are present anywhere
`;

    const text = await generateResponse([
      {
        role: "user",
        content: prompt
      }
    ]);

    console.log("RAW AI RESPONSE:");
    console.log(text);

    /* ================= EXTRACT SECTION ================= */

    const extractSection = (
      start,
      end
    ) => {

      const regex = new RegExp(
        `${start}:([\\s\\S]*?)${end ? end + ":" : "$"}`,
        "i"
      );

      const match =
        text.match(regex);

      return match
        ? match[1].trim()
        : "";
    };

    /* ================= BASIC FIELDS ================= */

    const title =
      extractSection(
        "TITLE",
        "DESCRIPTION"
      );

    const description =
      extractSection(
        "DESCRIPTION",
        "LANGUAGE"
      );

    const language =
      extractSection(
        "LANGUAGE",
        "STARTER_CODE"
      ) || "cpp";

    const starterCode =
      extractSection(
        "STARTER_CODE",
        "SOLUTION_CODE"
      );

    const solutionCode =
      extractSection(
        "SOLUTION_CODE",
        "EXAMPLES"
      );
/* ================= CLEAN CODE ================= */

const cleanCode = (code) => {

  return code
    .replace(/```cpp/g, "")
    .replace(/```c/g, "")
    .replace(/```java/g, "")
    .replace(/```python/g, "")
    .replace(/```javascript/g, "")
    .replace(/```/g, "")
    .trim();
};

const cleanedStarterCode =
  cleanCode(starterCode);

const cleanedSolutionCode =
  cleanCode(solutionCode);

  if (
  cleanedStarterCode.trim() ===
  cleanedSolutionCode.trim()
) {

  throw new Error(
    "Starter code and solution code are identical"
  );
}
    /* ================= CONSTRAINTS ================= */

    const constraintsRaw =
      extractSection(
        "CONSTRAINTS",
        "SOLUTION_APPROACH"
      );

    const constraints =
      constraintsRaw
        .split("\n")
        .map(c => c.trim())
        .filter(Boolean);

    /* ================= SOLUTION APPROACH ================= */

    const solutionApproach =
      extractSection(
        "SOLUTION_APPROACH",
        null
      );

    /* ================= EXAMPLES ================= */
/* ================= EXAMPLES ================= */

const examplesRaw =
  extractSection(
    "EXAMPLES",
    "TEST_CASES"
  );

const exampleMatches = [
  ...examplesRaw.matchAll(
    /Input:\s*([\s\S]*?)Output:\s*([\s\S]*?)(?=Input:|$)/gi
  )
];

const examples =
  exampleMatches.map(m => ({

    input:
      m[1]
        .replace(/```/g, "")
        .trim(),

    output:
      m[2]
        .replace(/```/g, "")
        .trim()
  }));

    /* ================= TEST CASES ================= */

/* ================= TEST CASES ================= */

const testCasesRaw =
  extractSection(
    "TEST_CASES",
    "CONSTRAINTS"
  );

const testCaseMatches = [
  ...testCasesRaw.matchAll(
    /INPUT:\s*([\s\S]*?)EXPECTED:\s*([\s\S]*?)(?=INPUT:|$)/gi
  )
];

const testCases =
  testCaseMatches.map(m => ({

    // stdin format
    input:
      m[1]
        .replace(/```/g, "")
        .trim(),

    // stdout format
    expectedOutput:
      m[2]
        .replace(/```/g, "")
        .trim(),

    isHidden: false
  }));

  /* ================= VALIDATE TESTCASES ================= */

/* ================= VALIDATE TESTCASES ================= */

for (const tc of testCases) {

  try {

    const result =
      await codeExecutor.execute(

        cleanedSolutionCode,

        language,

        tc.input
      );

    // Only overwrite if execution successful
    if (
      result.status === "success" &&
      result.stdout
    ) {

      tc.expectedOutput =
        result.stdout.trim();
    }

    else {

      console.log(
        "❌ Execution failed"
      );

      console.log(
        result.stderr
      );
    }

  } catch (err) {

    console.log(
      "❌ Testcase validation failed"
    );

    console.log(err.message);
  }
}

    /* ================= FINAL OBJECT ================= */

    const generatedProblem = {

  problem:
    title || "Generated Problem",

  description,

  difficulty,

  topic,

  language,

 starterCode:
  cleanedStarterCode,

solutionCode:
  cleanedSolutionCode,

  examples,

  testCases,

  constraints,

  solutionApproach
};

    /* ================= SAVE TO USER ================= */

/* ================= SAVE TO USER ================= */

if (user) {

  // Create study plan if not exists
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

  // Latest study plan
  const latestPlan =
    user.studyPlans[
      user.studyPlans.length - 1
    ];

  // SAVE COMPLETE OBJECT
  latestPlan.current = [
    generatedProblem
  ];

  // Important
  user.markModified(
    "studyPlans"
  );

  // Save user
  await user.save();

  console.log(
    "✅ Full problem saved"
  );
}

    /* ================= RETURN ================= */

    return {

      topic,

      difficulty,

      title:
        title || "Generated Problem",

      description,

      language,

    starterCode:
  cleanedStarterCode,

solutionCode:
  cleanedSolutionCode,

      examples,

      testCases,

      constraints,

      solutionApproach
    };

  } catch (error) {

    console.error(
      "Coding problem error:",
      error.message
    );

    throw new Error(
      "Failed to generate coding problem"
    );
  }
};

// ==============================
// 🚀 MAIN FUNCTION
// ==============================
export const evaluateCodingSolution = async (
  problemText,
  solutionCode,
  testCases = []
) => {
  try {
const prompt = `
Generate a ${difficulty} competitive programming problem on "${topic}".

STRICT RULES:
- NO JSON
- NO markdown
- NO backticks
- stdin/stdout format only
- STARTER_CODE and SOLUTION_CODE must be DIFFERENT
- STARTER_CODE must NOT contain final logic
- STARTER_CODE must contain TODO comment
- SOLUTION_CODE must contain complete correct solution

RETURN FORMAT EXACTLY:

TITLE:
...

DESCRIPTION:
...

LANGUAGE:
cpp

STARTER_CODE:
#include <bits/stdc++.h>
using namespace std;

int main() {

    // TODO: Write your solution here

    return 0;
}

SOLUTION_CODE:
<full working solution>

EXAMPLES:
Input:
...
Output:
...

TEST_CASES:
INPUT:
...
EXPECTED:
...

INPUT:
...
EXPECTED:
...

CONSTRAINTS:
...

SOLUTION_APPROACH:
...
`;

    const aiResponse = await generateResponse([
      { role: "user", content: prompt },
    ]);

    console.log("AI RAW:", aiResponse);

    const raw = extractJSON(aiResponse);
    if (!raw) throw new Error("No JSON found");

    const parsed = JSON.parse(cleanJSON(raw));

    // ✅ SAFETY FIXES (VERY IMPORTANT)
    return {
      isCorrect: parsed.isCorrect ?? false,
      score: parsed.score ?? 0,
      passed: parsed.passed ?? 0,
      total: parsed.total ?? testCases.length,
      issues: parsed.issues ?? [],
      suggestions: parsed.suggestions ?? [],
      summary: parsed.summary ?? "No summary",
    };

  } catch (error) {
    console.error("❌ Coding evaluation error:", error.message);

    return {
      isCorrect: false,
      score: 0,
      passed: 0,
      total: testCases.length || 0,
      issues: ["Evaluation failed"],
      suggestions: ["Try again"],
      summary: "Could not evaluate solution",
    };
  }
};
//
// ✅ 7. Explain
//
export const explainConcept = async (concept, level = "intermediate") => {
  try {
    return await generateResponse([
      {
        role: "user",
        content: `Explain "${concept}" for ${level} level with examples`
      }
    ]);
  } catch (error) {
    console.error("Explain error:", error.message);
    throw new Error("Failed to explain concept");
  }
};

//
// ✅ 6. Notes
//
export const generateStudyNotes = async (topic) => {
  try {
    return await generateResponse([
      {
        role: "user",
        content: `Create structured study notes for "${topic}"`
      }
    ]);
  } catch (error) {
    console.error("Notes error:", error.message);
    throw new Error("Failed to generate notes");
  }
};
//
// ✅ 8. AI Study Plan
//
export const generateAIStudyPlan = async (
  goal,
  shortTermDays = 7,
  longTermDays = 30,
  hoursPerDay = 2,
  level = "beginner"
) => {

  const prompt = `
You are an expert AI study planner.

IMPORTANT:
- Return ONLY valid JSON
- No markdown
- No explanation
- No trailing commas
- Coding problems, quizzes, flashcards, summaries, and notes are all valid study activities
- Complete ALL brackets properly
- Never cut off response

Generate:
1. Short-term daily study plan
2. Long-term weekly roadmap

Goal: ${goal}
Level: ${level}
Daily Study Time: ${hoursPerDay} hours

Short-term duration: ${shortTermDays} days
Long-term duration: ${longTermDays} days

JSON format:

{
  "shortTermPlan": {
    "title": "",
    "duration": "",
    "objective": "",
    "days": []
  },
  "longTermPlan": {
    "title": "",
    "duration": "",
    "objective": "",
    "weeks": []
  }
}
`;

  try {

    let retries = 3;

    while (retries > 0) {

      try {

        const response =
          await generateResponse([
            {
              role: "user",
              content: prompt,
            },
          ]);

        console.log("RAW RESPONSE:");
        console.log(response);

        let cleaned = response
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        // Extract JSON safely
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");

        if (start === -1 || end === -1) {
          throw new Error("Incomplete JSON");
        }

        cleaned = cleaned.slice(start, end + 1);

        // Remove trailing commas
        cleaned = cleaned.replace(
          /,\s*([}\]])/g,
          "$1"
        );

        const parsed = JSON.parse(cleaned);

        return {
          success: true,
          data: parsed,
        };

      } catch (parseError) {

        console.log(
          "Retrying AI generation..."
        );

        retries--;
      }
    }

    throw new Error(
      "AI failed to generate valid JSON after retries"
    );

  } catch (error) {

    console.error(
      "AI Study Plan Error:",
      error.message
    );

    return {
      success: false,
      message:
        "Failed to generate AI study plan",
      error: error.message,
    };
  }
};



export const generateShortTermPlan = async (
  goal,
  totalDays,
  level = "beginner"
) => {

  totalDays = Number(totalDays);

  try {

    const chunkSize = 7;

    let allTopics = [];

    const sleep = (ms) =>
      new Promise(resolve =>
        setTimeout(resolve, ms)
      );

    // =========================
    // CHUNK GENERATION
    // =========================

    for (
      let startDay = 1;
      startDay <= totalDays;
      startDay += chunkSize
    ) {

      const endDay =
        Math.min(
          startDay +
          chunkSize - 1,
          totalDays
        );

      console.log(
        `Generating short-term chunk ${startDay}-${endDay}`
      );

      const prompt = `
You are an expert AI study roadmap planner.

TASK:
Generate study topics.

GOAL:
${goal}

LEVEL:
${level}

Generate ONLY days
${startDay} to ${endDay}

IMPORTANT:
- Return STRICTLY valid JSON
- No markdown
- No explanations
- No comments
- No trailing commas
- Ensure every array item is comma separated
- One topic per day
- Beginner-friendly sequence

RETURN FORMAT:

{
  "topics": [
    {
      "day": 1,
      "topic": "",
      "completed": false
    }
  ]
}
`;

      let response;

      try {

        response =
          await generateResponse([
            {
              role: "user",
              content: prompt,
            },
          ]);

      } catch (error) {

        if (
          error.message.includes("429")
        ) {

          console.log(
            "Rate limited. Retrying..."
          );

          await sleep(7000);

          response =
            await generateResponse([
              {
                role: "user",
                content: prompt,
              },
            ]);

        } else {

          throw error;
        }
      }

      // =========================
      // CLEAN RESPONSE
      // =========================

      let cleaned = response
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const start =
        cleaned.indexOf("{");

      const end =
        cleaned.lastIndexOf("}");

      if (
        start === -1 ||
        end === -1
      ) {

        console.log(
          "INVALID CHUNK JSON"
        );

        continue;
      }

      cleaned =
        cleaned.slice(
          start,
          end + 1
        );

      cleaned = cleaned
        .replace(/\n/g, "")
        .replace(/\r/g, "")
        .trim();

      let parsed;

      try {

        parsed =
          JSON.parse(cleaned);

      } catch (jsonError) {

        console.log(
          "FAILED PARSE FOR CHUNK"
        );

        continue;
      }

      if (
        parsed.topics &&
        Array.isArray(
          parsed.topics
        )
      ) {

        allTopics = [
          ...allTopics,
          ...parsed.topics
        ];
      }

      // delay after chunk

      await sleep(2000);
    }

    // =========================
    // NORMALIZE
    // =========================

    allTopics =
      allTopics.map(
        (item, index) => ({

          day:
            item.day ||
            index + 1,

          topic:
            item.topic ||
            "General Practice",

          completed:
            item.completed ??
            false
        })
      );

    // =========================
    // FINAL RESPONSE
    // =========================

    return {

      title:
        `${goal} Roadmap`,

      goal,

      level,

      duration:
        `${totalDays} days`,

      topics:
        allTopics
    };

  } catch (error) {

    console.error(
      "Short-term roadmap error:",
      error.message
    );

    throw new Error(
      "Failed to generate short-term roadmap"
    );
  }
};
export const generateLongTermPlan = async (
  goal,
  totalDays,
  level = "beginner"
) => {

  totalDays = Number(totalDays);

  try {

    // =========================
    // SETTINGS
    // =========================

    const chunkSize =
      totalDays > 180
        ? 20
        : 15;

    let allDays = [];

    // =========================
    // SLEEP FUNCTION
    // =========================

    const sleep = (ms) =>
      new Promise(resolve =>
        setTimeout(resolve, ms)
      );

    // =========================
    // GENERATE DAY TOPICS
    // =========================

    for (
      let startDay = 1;
      startDay <= totalDays;
      startDay += chunkSize
    ) {

      const endDay =
        Math.min(
          startDay +
          chunkSize - 1,
          totalDays
        );

      console.log(
        `Generating chunk ${startDay}-${endDay}`
      );

      const prompt = `
You are an expert AI roadmap planner.

TASK:
Generate roadmap topics.

GOAL:
${goal}

LEVEL:
${level}

Generate ONLY days
${startDay} to ${endDay}

IMPORTANT:
- Return STRICTLY valid JSON
- No markdown
- No explanations
- No comments
- No trailing commas
- One topic per day
- Beginner-friendly order
- Topic names should be short and descriptive

RETURN FORMAT:

{
  "days": [
    {
      "day": 1,
      "topic": "",
      "completed": false
    }
  ]
}
`;

      let response;

      // =========================
      // RETRY LOGIC
      // =========================

      try {

        response =
          await generateResponse([
            {
              role: "user",
              content: prompt,
            },
          ]);

      } catch (error) {

        if (
          error.message.includes("429")
        ) {

          console.log(
            `Rate limited for chunk ${startDay}-${endDay}`
          );

          await sleep(8000);

          response =
            await generateResponse([
              {
                role: "user",
                content: prompt,
              },
            ]);

        } else {

          throw error;
        }
      }

      // =========================
      // CLEAN RESPONSE
      // =========================

      let cleaned = response
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const start =
        cleaned.indexOf("{");

      const end =
        cleaned.lastIndexOf("}");

      if (
        start === -1 ||
        end === -1
      ) {

        throw new Error(
          `Invalid JSON for days ${startDay}-${endDay}`
        );
      }

      cleaned =
        cleaned.slice(
          start,
          end + 1
        );

      // =========================
      // SAFE JSON PARSE
      // =========================

      let parsed;

      try {

        parsed =
          JSON.parse(cleaned);

      } catch (jsonError) {

        console.log(
          "INVALID JSON RECEIVED"
        );

        console.log(cleaned);

        try {

          cleaned = cleaned

            // remove trailing commas
            .replace(
              /,\s*([}\]])/g,
              "$1"
            )

            // fix missing commas
            .replace(
              /}\s*{/g,
              "},{"
            )

            // remove line breaks
            .replace(
              /\n/g,
              ""
            );

          parsed =
            JSON.parse(cleaned);

        } catch (retryError) {

          console.log(
            "FAILED TO FIX JSON"
          );

          continue;
        }
      }

      // =========================
      // SAVE DAYS
      // =========================

      if (
        parsed.days &&
        Array.isArray(
          parsed.days
        )
      ) {

        allDays = [
          ...allDays,
          ...parsed.days
        ];
      }

      // =========================
      // DELAY AFTER EACH CHUNK
      // =========================

      await sleep(2500);
    }

    // =========================
    // MONTH → WEEK → DAY
    // =========================

    const months = [];

    let currentMonth = 1;

    let dayIndex = 0;

    while (
      dayIndex < allDays.length
    ) {

      const monthWeeks = [];

      const monthTopics =
        [];

      // =========================
      // 4 WEEKS PER MONTH
      // =========================

      for (
        let w = 0;
        w < 4 &&
        dayIndex <
          allDays.length;
        w++
      ) {

        const weekDays = [];

        const weekTopics =
          [];

        // =========================
        // 7 DAYS PER WEEK
        // =========================

        for (
          let d = 0;
          d < 7 &&
          dayIndex <
            allDays.length;
          d++
        ) {

          const currentDay =
            allDays[
              dayIndex
            ];

          weekDays.push({

            day:
              currentDay.day,

            topic:
              currentDay.topic,

            completed:
              currentDay.completed ??
              false
          });

          weekTopics.push(
            currentDay.topic
          );

          monthTopics.push(
            currentDay.topic
          );

          dayIndex++;
        }

        // =========================
        // REMOVE DUPLICATES
        // =========================

        const uniqueWeekTopics =
          [
            ...new Set(
              weekTopics
            )
          ];

        monthWeeks.push({

          week: w + 1,

          summary:
            `This week focuses on ${uniqueWeekTopics
              .slice(0, 3)
              .join(", ")}.`,

          focus:
            uniqueWeekTopics
              .slice(0, 4)
              .join(", "),

          topics:
            uniqueWeekTopics,

          milestone:
            `Complete practice and revision for ${uniqueWeekTopics.length} topics.`,

          days:
            weekDays
        });
      }

      // =========================
      // REMOVE DUPLICATES
      // =========================

      const uniqueTopics =
        [
          ...new Set(
            monthTopics
          )
        ];

      months.push({

        month:
          currentMonth,

        summary:
          `This month focuses on ${uniqueTopics
            .slice(0, 4)
            .join(", ")} and strengthens problem-solving skills.`,

        focus:
          uniqueTopics
            .slice(0, 5)
            .join(", "),

        topics:
          uniqueTopics,

        milestone:
          `Complete mastery of ${uniqueTopics.length} major topics.`,

        weeks:
          monthWeeks
      });

      currentMonth++;
    }

    // =========================
    // FINAL RESPONSE
    // =========================

    return {

      title:
        `${goal} Roadmap`,

      goal,

      level,

      duration:
        `${totalDays} days`,

      totalMonths:
        months.length,

      months
    };

  } catch (error) {

    console.error(
      "Long-term roadmap error:",
      error.message
    );

    throw new Error(
      "Failed to generate roadmap"
    );
  }
};



export const generateTodayAIPlan =
  async ({

    shortTermTopic,

    longTermTopic,

    weakTopic,

    currentDay,

    level,

    shortGoal,

    hoursPerDay,

    incompleteTasks,

  }) => {

    try {


const prompt = `
You are an advanced Adaptive AI Study Planner.

Your task is to generate a highly personalized study plan for ONLY TODAY.

Student Profile:

- Current Study Day: ${currentDay}
- Education Level: ${level}
- Daily Study Hours: ${hoursPerDay}

Learning Goals:

- Short-Term Goal: ${shortGoal}
- Short-Term Topic: ${shortTermTopic}
- Long-Term Topic: ${longTermTopic}

Performance Analysis:

- Weak Topics: ${JSON.stringify(weakTopic)}
- Incomplete Tasks: ${JSON.stringify(incompleteTasks)}

Rules:

1. Return ONLY valid JSON.
2. No markdown.
3. No explanations.
4. Generate EXACTLY 5 activities.
5. Activities must be personalized.
6. Prioritize weak areas.
7. Avoid generic titles like "General Quiz".
8. Keep titles practical and specific.
9. Match difficulty with student's level.
10. Include a balanced mix of:
   - problem solving
   - revision
   - quiz
   - active recall
   - deep focus
11. Activities should feel like a real mentor designed them.
12. completed must always be false.
13. Each activity should have:
   - realistic duration
   - xp
   - difficulty
   - clear topic focus

Allowed activity types:
- coding
- revision
- quiz
- notes
- flashcards
- focus

JSON FORMAT:

{
  "day": ${currentDay},
  "focusArea": "",
  "estimatedDuration": 0,
  "activities": [
    {
      "id": "1",
      "type": "coding",
      "topic": "",
      "title": "",
      "description": "",
      "difficulty": "easy",
      "duration": "30 mins",
      "xp": 100,
      "completed": false
    }
  ]
}
`;



      const response =
        await generateResponse([
          {
            role: "user",
            content: prompt,
          },
        ]);

      console.log(
        "RAW RESPONSE:"
      );

      console.log(response);

      let cleaned =
        response
          .replace(
            /```json/gi,
            ""
          )
          .replace(
            /```/g,
            ""
          )
          .trim();

      const start =
        cleaned.indexOf("{");

      const end =
        cleaned.lastIndexOf("}");

      cleaned =
        cleaned.slice(
          start,
          end + 1
        );

      const parsed =
        JSON.parse(cleaned);

      return {

        success: true,

        data: parsed,
      };

    } catch (error) {

      console.error(
        "TODAY AI ERROR:",
        error
      );

      return {

        success: false,

        message:
          error.message,
      };
    }
  };



