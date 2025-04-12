import { octokit, type Repository } from "./base.js";

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