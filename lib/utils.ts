import { z } from "zod";

/**
 * Validation schemas
 */

export const ScoreSchema = z.object({
  score: z.number().min(1).max(45).int("Score must be an integer"),
  score_date: z.string().date("Invalid date"),
});

export const CharitySelectionSchema = z.object({
  charity_id: z.string().uuid("Invalid charity ID"),
  contribution_percentage: z
    .number()
    .min(10)
    .max(100)
    .multipleOf(0.01, "Must be a valid percentage"),
});

export const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  avatar_url: z.string().url().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  selected_charity_id: z.string().uuid("Invalid charity selection"),
  contribution_percentage: z.number().min(10).max(100),
});

export const WinningProofSchema = z.object({
  winning_id: z.string().uuid("Invalid winning ID"),
  proof_image: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "File must be less than 5MB",
    )
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "File must be an image (JPEG, PNG, or WebP)",
    ),
});

export const DrawConfigSchema = z.object({
  draw_date: z.string().date("Invalid date"),
  draw_mode: z.enum(["random", "algorithm"]),
  publish_immediately: z.boolean().optional().default(false),
});

export const AdminUserUpdateSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  is_admin: z.boolean().optional(),
  full_name: z.string().optional(),
});

/**
 * Error handler
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * API error response formatter
 */
export function formatErrorResponse(
  error: unknown,
  defaultStatus = 500,
): { message: string; statusCode: number; code?: string } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    };
  }

  if (error instanceof z.ZodError) {
    return {
      message: "Validation error",
      statusCode: 400,
      code: "VALIDATION_ERROR",
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: defaultStatus,
    };
  }

  return {
    message: "An unexpected error occurred",
    statusCode: defaultStatus,
  };
}

/**
 * Validation helpers
 */
export async function validateScore(data: unknown) {
  return ScoreSchema.parseAsync(data);
}

export async function validateCharitySelection(data: unknown) {
  return CharitySelectionSchema.parseAsync(data);
}

export async function validateLogin(data: unknown) {
  return LoginSchema.parseAsync(data);
}

export async function validateSignup(data: unknown) {
  return SignupSchema.parseAsync(data);
}

export async function validateWinningProof(data: unknown) {
  return WinningProofSchema.parseAsync(data);
}

export async function validateDrawConfig(data: unknown) {
  return DrawConfigSchema.parseAsync(data);
}

/**
 * Input sanitization
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeString(str: string): string {
  return str.trim().substring(0, 1000);
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxAttempts: number;

  constructor(windowMs: number = 60000, maxAttempts: number = 10) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
  }

  isLimited(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(
      (time) => now - time < this.windowMs,
    );

    if (recentAttempts.length >= this.maxAttempts) {
      return true;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return false;
  }
}
