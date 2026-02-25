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
