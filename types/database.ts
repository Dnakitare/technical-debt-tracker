export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          github_username: string | null
          github_token: string | null
          stripe_customer_id: string | null
          current_team_id: string | null
          hourly_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          github_username?: string | null
          github_token?: string | null
          stripe_customer_id?: string | null
          current_team_id?: string | null
          hourly_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          github_username?: string | null
          github_token?: string | null
          stripe_customer_id?: string | null
          current_team_id?: string | null
          hourly_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          plan: "free" | "starter" | "pro" | "enterprise"
          stripe_subscription_id: string | null
          subscription_status: "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "unpaid"
          subscription_period_end: string | null
          max_repos: number
          max_members: number
          default_hourly_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          plan?: "free" | "starter" | "pro" | "enterprise"
          stripe_subscription_id?: string | null
          subscription_status?: "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "unpaid"
          subscription_period_end?: string | null
          max_repos?: number
          max_members?: number
          default_hourly_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          plan?: "free" | "starter" | "pro" | "enterprise"
          stripe_subscription_id?: string | null
          subscription_status?: "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "unpaid"
          subscription_period_end?: string | null
          max_repos?: number
          max_members?: number
          default_hourly_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: "owner" | "admin" | "member" | "viewer"
          invited_email: string | null
          invited_at: string | null
          joined_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: "owner" | "admin" | "member" | "viewer"
          invited_email?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: "owner" | "admin" | "member" | "viewer"
          invited_email?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
        }
      }
      repos: {
        Row: {
          id: string
          team_id: string
          github_repo_id: number
          github_owner: string
          github_name: string
          github_full_name: string
          github_url: string
          default_branch: string
          is_private: boolean
          language: string | null
          last_synced_at: string | null
          sync_status: "pending" | "syncing" | "completed" | "failed"
          sync_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          github_repo_id: number
          github_owner: string
          github_name: string
          github_full_name: string
          github_url: string
          default_branch?: string
          is_private?: boolean
          language?: string | null
          last_synced_at?: string | null
          sync_status?: "pending" | "syncing" | "completed" | "failed"
          sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          github_repo_id?: number
          github_owner?: string
          github_name?: string
          github_full_name?: string
          github_url?: string
          default_branch?: string
          is_private?: boolean
          language?: string | null
          last_synced_at?: string | null
          sync_status?: "pending" | "syncing" | "completed" | "failed"
          sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      team_invites: {
        Row: {
          id: string
          team_id: string
          email: string
          role: "admin" | "member" | "viewer"
          invited_by: string
          status: "pending" | "accepted" | "declined"
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          team_id: string
          email: string
          role?: "admin" | "member" | "viewer"
          invited_by: string
          status?: "pending" | "accepted" | "declined"
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          email?: string
          role?: "admin" | "member" | "viewer"
          invited_by?: string
          status?: "pending" | "accepted" | "declined"
          created_at?: string
          expires_at?: string
        }
      }
      debt_metrics: {
        Row: {
          id: string
          repo_id: string
          snapshot_date: string
          total_issues: number
          critical_issues: number
          high_issues: number
          medium_issues: number
          low_issues: number
          estimated_hours: number
          estimated_cost_usd: number
          avg_pr_age_days: number | null
          stale_branches: number
          todo_count: number
          issues_opened: number
          issues_closed: number
          created_at: string
        }
        Insert: {
          id?: string
          repo_id: string
          snapshot_date: string
          total_issues?: number
          critical_issues?: number
          high_issues?: number
          medium_issues?: number
          low_issues?: number
          estimated_hours?: number
          estimated_cost_usd?: number
          avg_pr_age_days?: number | null
          stale_branches?: number
          todo_count?: number
          issues_opened?: number
          issues_closed?: number
          created_at?: string
        }
        Update: {
          id?: string
          repo_id?: string
          snapshot_date?: string
          total_issues?: number
          critical_issues?: number
          high_issues?: number
          medium_issues?: number
          low_issues?: number
          estimated_hours?: number
          estimated_cost_usd?: number
          avg_pr_age_days?: number | null
          stale_branches?: number
          todo_count?: number
          issues_opened?: number
          issues_closed?: number
          created_at?: string
        }
      }
    }
  }
}
