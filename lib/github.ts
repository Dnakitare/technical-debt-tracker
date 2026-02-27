import { Octokit } from "octokit"
import { GITHUB_API_PAGE_SIZE, DEBT_KEYWORDS } from "./constants"

export function createOctokit(token: string) {
  return new Octokit({ auth: token })
}

export async function fetchUserRepos(token: string) {
  const octokit = createOctokit(token)
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: GITHUB_API_PAGE_SIZE,
  })
  return data
}

export async function fetchRepoIssues(
  token: string,
  owner: string,
  repo: string,
  labels?: string[]
) {
  const octokit = createOctokit(token)
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "open",
    labels: labels?.join(","),
    per_page: GITHUB_API_PAGE_SIZE,
  })
  return data
}

export async function fetchRepoPullRequests(
  token: string,
  owner: string,
  repo: string
) {
  const octokit = createOctokit(token)
  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: GITHUB_API_PAGE_SIZE,
  })
  return data
}

export async function searchCodeForDebt(
  token: string,
  owner: string,
  repo: string
) {
  const octokit = createOctokit(token)
  const queries = DEBT_KEYWORDS
  let totalCount = 0

  for (const query of queries) {
    try {
      const { data } = await octokit.rest.search.code({
        q: `${query}+repo:${owner}/${repo}`,
      })
      totalCount += data.total_count
    } catch (error) {
      console.error(`GitHub search failed for "${query}" in ${owner}/${repo}:`, error)
    }
  }

  return totalCount
}
