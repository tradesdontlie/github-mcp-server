import { Octokit } from "octokit";

// Initialize Octokit with the GitHub token from environment variables
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Repository type for easier parameter passing
type Repository = {
  owner: string;
  repo: string;
};

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
 * Get a pull request by number
 */
export async function getPullRequest(repo: Repository, pullNumber: number) {
  const { data } = await octokit.rest.pulls.get({
    owner: repo.owner,
    repo: repo.repo,
    pull_number: pullNumber,
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
 * Create a comment on a pull request
 */
export async function createPullRequestComment(
  repo: Repository,
  pullNumber: number,
  body: string
) {
  const { data } = await octokit.rest.issues.createComment({
    owner: repo.owner,
    repo: repo.repo,
    issue_number: pullNumber,
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
 * Update a pull request
 */
export async function updatePullRequest(
  repo: Repository,
  pullNumber: number,
  updates: {
    title?: string;
    body?: string;
    state?: "open" | "closed";
  }
) {
  const { data } = await octokit.rest.pulls.update({
    owner: repo.owner,
    repo: repo.repo,
    pull_number: pullNumber,
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

/**
 * List pull requests for a repository
 */
export async function listPullRequests(
  repo: Repository,
  options: {
    state?: "open" | "closed" | "all";
    sort?: "created" | "updated" | "popularity" | "long-running";
    direction?: "asc" | "desc";
    per_page?: number;
    page?: number;
  } = {}
) {
  const { data } = await octokit.rest.pulls.list({
    owner: repo.owner,
    repo: repo.repo,
    ...options,
  });
  return data;
} 