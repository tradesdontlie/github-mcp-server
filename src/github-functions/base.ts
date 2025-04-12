import { Octokit } from "octokit";

// Initialize Octokit with the GitHub token from environment variables
export const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Repository type for easier parameter passing
export type Repository = {
  owner: string;
  repo: string;
}; 