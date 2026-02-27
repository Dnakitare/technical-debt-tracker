import { http, HttpResponse } from "msw"

export const handlers = [
  http.post("/api/repos/:repoId/sync", () => {
    return HttpResponse.json({ success: true, summary: { totalIssues: 5 } })
  }),

  http.post("/api/teams/:teamId/members", () => {
    return HttpResponse.json({ status: "invited" }, { status: 201 })
  }),

  http.get("/api/repos", () => {
    return HttpResponse.json([])
  }),

  http.get("/api/github/token", () => {
    return HttpResponse.json({ connected: true, github_username: "octocat" })
  }),
]
