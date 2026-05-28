import { z } from "zod";

export const studyPlanSchema = z.object({
  goal: z
    .string()
    .min(3, "Goal must be at least 3 characters"),

  shortTermDays: z
    .number()
    .min(1)
    .max(30),

  longTermDays: z
    .number()
    .min(7)
    .max(365),

  hoursPerDay: z
    .number()
    .min(1)
    .max(12),

  level: z.enum([
    "beginner",
    "intermediate",
    "advanced",
  ]),
});