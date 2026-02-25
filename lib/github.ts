import { Octokit } from "octokit"

export function createOctokit(token: string) {
  return new Octokit({ auth: token })
}

export async function fetchUserRepos(token: string) {
  const octokit = createOctokit(token)
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
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
    per_page: 100,
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
    per_page: 100,
  })
  return data
}

export async function searchCodeForDebt(
  token: string,
  owner: string,
  repo: string
) {
  const octokit = createOctokit(token)
  const queries = ["TODO", "FIXME", "HACK", "WORKAROUND", "TECHNICAL DEBT"]
  let totalCount = 0

  for (const query of queries) {
    try {
      const { data } = await octokit.rest.search.code({
        q: `${query}+repo:${owner}/${repo}`,
      })
      totalCount += data.total_count
    } catch {
      // Rate limit or search API error — skip this query
    }
  }

  return totalCount
}
