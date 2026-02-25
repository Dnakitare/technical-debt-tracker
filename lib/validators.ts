import { z } from "zod"

export const connectRepoSchema = z.object({
  githubRepoId: z.number(),
  githubOwner: z.string().min(1),
  githubName: z.string().min(1),
  githubFullName: z.string().min(1),
  githubUrl: z.string().url(),
  defaultBranch: z.string().default("main"),
  isPrivate: z.boolean().default(false),
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
