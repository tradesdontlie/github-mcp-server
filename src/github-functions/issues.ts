import { octokit, type Repository } from "./base.js";

/**
 * Get an issue by number
 */
export async function getIssue(repo: Repository, issueNumber: number) {
  const { data } = await octokit.rest.issues.get({
    owner: repo.owner,
    repo: repo.repo,
    issue_number: issueNumber,
  });
  return data;
}

/**
 * Create a comment on an issue
 */
export async function createIssueComment(
  repo: Repository,
  issueNumber: number,
  body: string
) {
  const { data } = await octokit.rest.issues.createComment({
    owner: repo.owner,
    repo: repo.repo,
    issue_number: issueNumber,
    body,
  });
  return data;
}

/**
 * Update an issue
 */
export async function updateIssue(
  repo: Repository,
  issueNumber: number,
  updates: {
    title?: string;
    body?: string;
    state?: "open" | "closed";
    labels?: string[];
    assignees?: string[];
  }
) {
  const { data } = await octokit.rest.issues.update({
    owner: repo.owner,
    repo: repo.repo,
    issue_number: issueNumber,
    ...updates,
  });
  return data;
}

/**
 * List issues for a repository
 */
export async function listIssues(
  repo: Repository,
  options: {
    state?: "open" | "closed" | "all";
    labels?: string;
    sort?: "created" | "updated" | "comments";
    direction?: "asc" | "desc";
    per_page?: number;
    page?: number;
  } = {}
) {
  const { data } = await octokit.rest.issues.listForRepo({
    owner: repo.owner,
    repo: repo.repo,
    ...options,
  });
  return data;
} 