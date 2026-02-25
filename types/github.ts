export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  private: boolean
  default_branch: string
  language: string | null
  description: string | null
  updated_at: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  state: string
  labels: Array<{
    name: string
    color: string
  }>
  created_at: string
  updated_at: string
  html_url: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  state: string
  created_at: string
  updated_at: string
  html_url: string
  draft: boolean
}
