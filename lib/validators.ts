import { z } from "zod"

export const connectRepoSchema = z.object({
  github_repo_id: z.number(),
  github_owner: z.string().min(1),
  github_name: z.string().min(1),
  github_full_name: z.string().min(1),
  github_url: z.string().url(),
  default_branch: z.string().default("main"),
  is_private: z.boolean().default(false),
  language: z.string().nullable().default(null),
})

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
})

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
})

export const updateSettingsSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  hourlyRate: z.number().min(0).max(10000).optional(),
})

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")

export const updateMemberRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "member", "viewer"]),
})
