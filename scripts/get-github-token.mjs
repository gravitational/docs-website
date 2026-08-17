#!/usr/bin/env node

import { createAppAuth } from "@octokit/auth-app";

const [repo] = process.argv.slice(2);
const githubApiUrl = process.env.GITHUB_API_URL || "https://api.github.com";
const coreRepo = "gravitational/core";

// Helper function to make a request to the GitHub API and return the JSON response.
async function requestJson(path, token, init = {}) {
  const response = await fetch(`${githubApiUrl}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub API request failed with ${response.status} ${response.statusText}: ${body}`,
    );
  }

  return response.json();
}

// Attempts to find the specific installation ID for the given repo
// The installation ID is needed as the oauth token generated is specific to the installation
async function resolveInstallationId(auth, repoPath) {
  const appAuthentication = await auth({ type: "app" });
  const installation = await requestJson(
    `/repos/${repoPath}/installation`,
    appAuthentication.token,
  );

  if (!installation.id) {
    throw new Error(`GitHub did not return an installation ID for ${repoPath}.`);
  }

  return installation.id;
}

// Perform OAuth flow with signed JWT
async function generateOAuthToken(auth, repoPath) {
  const [, repoName] = repoPath.split("/");
  const installationId = await resolveInstallationId(auth, repoPath);

  const appAuthentication = await auth({ type: "app" });
  const installationAuthentication = await requestJson(
    `/app/installations/${installationId}/access_tokens`,
    appAuthentication.token,
    {
      method: "POST",
      body: JSON.stringify({
        permissions: { contents: "read" },
        repositories: [repoName],
      }),
    },
  );

  if (!installationAuthentication.token) {
    throw new Error("GitHub did not return an installation token.");
  }

  return installationAuthentication.token;
}

async function main() {
  if (!repo) {
    console.error(`Usage: ${process.argv[1]} <owner/repository>`);
    process.exit(1);
  }

  if (process.env.GITHUB_TOKEN) {
    process.stdout.write(process.env.GITHUB_TOKEN);
    return;
  }

  if (repo !== coreRepo) {
    // Public repositories can still be downloaded without authentication.
    return;
  }

  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!clientId || !privateKey) {
    console.error(
      "GITHUB_TOKEN is not set, and GitHub authentication is now required because docs content is fetched from the private gravitational/core repository.",
    );
    console.error(
      "Set GITHUB_TOKEN, or set both GITHUB_APP_CLIENT_ID and GITHUB_APP_PRIVATE_KEY.",
    );
    process.exit(1);
  }

  // This createAppAuth only gives us a signed JWT that is capable of authenticating to a very small subset of APIs
  // We can use it as part of the OAuth flow to create an access token that can be used for normal operations
  const auth = createAppAuth({
    appId: clientId,
    privateKey,
  });

  try {
    const token = await generateOAuthToken(auth, repo);
    process.stdout.write(token);
  } catch (error) {
    console.error(`Could not mint a GitHub App installation token for ${repo}.`);
    console.error(error.message);
    process.exit(1);
  }
}

await main();
