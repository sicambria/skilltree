import { z } from 'zod';

export const userDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['user', 'admin', 'moderator']),
  avatar: z.string().url().nullable(),
  mainTree: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type UserData = z.infer<typeof userDataSchema>;

export const skillLevelSchema = z.object({
  level: z.number().int().min(1).max(5),
  description: z.string(),
});
export type SkillLevel = z.infer<typeof skillLevelSchema>;

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  icon: z.string().nullable(),
  description: z.string().nullable(),
  levels: z.array(skillLevelSchema).length(5),
  trainings: z.array(z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().url(),
    provider: z.string(),
    duration: z.string().nullable(),
    cost: z.string().nullable(),
  })).optional(),
  prerequisites: z.array(z.string()).optional(),
  relatedSkills: z.array(z.string()).optional(),
});
export type Skill = z.infer<typeof skillSchema>;

export const treeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  owner: z.string(),
  skills: z.array(skillSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Tree = z.infer<typeof treeSchema>;

export const trainingSchema = z.object({
  id: z.string(),
  skillId: z.string(),
  title: z.string(),
  url: z.string().url(),
  provider: z.string(),
  duration: z.string().nullable(),
  cost: z.string().nullable(),
});
export type Training = z.infer<typeof trainingSchema>;

export const historyEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  skillId: z.string(),
  skillName: z.string(),
  previousLevel: z.number().int().min(1).max(5),
  newLevel: z.number().int().min(1).max(5),
  timestamp: z.string().datetime(),
});
export type HistoryEntry = z.infer<typeof historyEntrySchema>;

export const planHorizonSchema = z.object({
  id: z.string(),
  name: z.string(),
  period: z.enum(['3-month', '1-year', '3-year']),
  skills: z.array(z.object({
    skillId: z.string(),
    skillName: z.string(),
    targetLevel: z.number().int().min(1).max(5),
    priority: z.number().int().min(1).max(3),
  })),
});
export type PlanHorizon = z.infer<typeof planHorizonSchema>;

export const planProgressSchema = z.object({
  horizonId: z.string(),
  horizonName: z.string(),
  totalSkills: z.number(),
  completedSkills: z.number(),
  progress: z.number().min(0).max(100),
});
export type PlanProgress = z.infer<typeof planProgressSchema>;

export const planSchema = z.object({
  horizons: z.array(planHorizonSchema).length(3),
});
export type Plan = z.infer<typeof planSchema>;

export const communityFeedItemSchema = z.object({
  id: z.string(),
  type: z.enum(['level_up', 'training_offer', 'training_request', 'comment', 'question']),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().url().nullable(),
  skillId: z.string().nullable(),
  skillName: z.string().nullable(),
  content: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});
export type CommunityFeedItem = z.infer<typeof communityFeedItemSchema>;

export const recommendationSchema = z.object({
  type: z.enum(['mentor', 'complementary_skill', 'training', 'peer']),
  userId: z.string().optional(),
  skillId: z.string().optional(),
  score: z.number().min(0).max(1),
  reason: z.string(),
});
export type Recommendation = z.infer<typeof recommendationSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  user: userDataSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const submitAllSchema = z.object({
  skills: z.array(z.object({
    skillId: z.string(),
    level: z.number().int().min(1).max(5),
  })),
});
export type SubmitAllInput = z.infer<typeof submitAllSchema>;

export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;