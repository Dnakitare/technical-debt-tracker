import { describe, it, expect } from "vitest"
import {
  connectRepoSchema,
  createTeamSchema,
  inviteMemberSchema,
  updateSettingsSchema,
} from "../validators"

describe("connectRepoSchema", () => {
  const validRepo = {
    github_repo_id: 12345,
    github_owner: "octocat",
    github_name: "hello-world",
    github_full_name: "octocat/hello-world",
    github_url: "https://github.com/octocat/hello-world",
    default_branch: "main",
    is_private: false,
    language: "TypeScript",
  }

  it("accepts valid input", () => {
    const result = connectRepoSchema.safeParse(validRepo)
    expect(result.success).toBe(true)
  })

  it("applies defaults for optional fields", () => {
    const minimal = {
      github_repo_id: 1,
      github_owner: "a",
      github_name: "b",
      github_full_name: "a/b",
      github_url: "https://github.com/a/b",
    }
    const result = connectRepoSchema.safeParse(minimal)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.default_branch).toBe("main")
      expect(result.data.is_private).toBe(false)
      expect(result.data.language).toBeNull()
    }
  })

  it("rejects missing github_repo_id", () => {
    const { github_repo_id: _, ...without } = validRepo
    expect(connectRepoSchema.safeParse(without).success).toBe(false)
  })

  it("rejects empty github_owner", () => {
    expect(
      connectRepoSchema.safeParse({ ...validRepo, github_owner: "" }).success
    ).toBe(false)
  })

  it("rejects invalid URL", () => {
    expect(
      connectRepoSchema.safeParse({ ...validRepo, github_url: "not-a-url" }).success
    ).toBe(false)
  })
})

describe("createTeamSchema", () => {
  it("accepts valid name", () => {
    expect(createTeamSchema.safeParse({ name: "My Team" }).success).toBe(true)
  })

  it("rejects empty name", () => {
    expect(createTeamSchema.safeParse({ name: "" }).success).toBe(false)
  })

  it("rejects name over 100 chars", () => {
    expect(createTeamSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false)
  })
})

describe("inviteMemberSchema", () => {
  it("accepts valid email and role", () => {
    const result = inviteMemberSchema.safeParse({
      email: "test@example.com",
      role: "admin",
    })
    expect(result.success).toBe(true)
  })

  it("defaults role to member", () => {
    const result = inviteMemberSchema.safeParse({ email: "test@example.com" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe("member")
    }
  })

  it("rejects invalid email", () => {
    expect(
      inviteMemberSchema.safeParse({ email: "not-email" }).success
    ).toBe(false)
  })

  it("rejects invalid role", () => {
    expect(
      inviteMemberSchema.safeParse({ email: "a@b.com", role: "superadmin" }).success
    ).toBe(false)
  })
})

describe("updateSettingsSchema", () => {
  it("accepts valid settings", () => {
    const result = updateSettingsSchema.safeParse({
      fullName: "John Doe",
      hourlyRate: 150,
    })
    expect(result.success).toBe(true)
  })

  it("accepts partial updates", () => {
    expect(updateSettingsSchema.safeParse({ fullName: "Jane" }).success).toBe(true)
    expect(updateSettingsSchema.safeParse({ hourlyRate: 50 }).success).toBe(true)
    expect(updateSettingsSchema.safeParse({}).success).toBe(true)
  })

  it("rejects hourlyRate below 0", () => {
    expect(
      updateSettingsSchema.safeParse({ hourlyRate: -1 }).success
    ).toBe(false)
  })

  it("rejects hourlyRate above 10000", () => {
    expect(
      updateSettingsSchema.safeParse({ hourlyRate: 10001 }).success
    ).toBe(false)
  })

  it("accepts boundary hourlyRate values", () => {
    expect(updateSettingsSchema.safeParse({ hourlyRate: 0 }).success).toBe(true)
    expect(updateSettingsSchema.safeParse({ hourlyRate: 10000 }).success).toBe(true)
  })
})
