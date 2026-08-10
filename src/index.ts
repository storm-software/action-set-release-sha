/* -------------------------------------------------------------------

       🗲 Storm Software - Action Set Release Sha

 This code was released as part of the Action Set Release Sha project. Action Set Release Sha
 is maintained by Storm Software under the Apache-2.0 license, and is
 free for commercial and private use. For more information, please visit
 our licensing page at https://stormsoftware.com/licenses/projects/action-set-release-sha.

 Website:                  https://stormsoftware.com
 Repository:               https://github.com/storm-software/action-set-release-sha
 Documentation:            https://docs.stormsoftware.com
 Contact:                  https://stormsoftware.com/contact

 SPDX-License-Identifier:  Apache-2.0

 ------------------------------------------------------------------- */

import * as core from "@actions/core";
import * as github from "@actions/github";
import type { GitHub } from "@actions/github/lib/utils";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const {
  runId,
  repo: { repo, owner },
  eventName
} = github.context;
process.env.GITHUB_TOKEN = core.getInput("gh-token");
const errorOnNoSuccessfulWorkflow = core.getBooleanInput(
  "error-on-no-successful-workflow"
);
const lastSuccessfulEvent = core.getInput("last-successful-event");
const workingDirectory = core.getInput("working-directory");
const fallbackSHA = core.getInput("fallback-sha");
const remote = core.getInput("remote");
const usePreviousMergeGroupCommit = core.getBooleanInput(
  "use-previous-merge-group-commit"
);
const defaultWorkingDirectory = ".";

let BASE_SHA: string | undefined;
void (async () => {
  if (workingDirectory !== defaultWorkingDirectory) {
    if (existsSync(workingDirectory)) {
      process.chdir(workingDirectory);
    } else {
      process.stdout.write("\n");
      process.stdout.write(
        `WARNING: Working directory '${workingDirectory}' doesn't exist.\n`
      );
    }
  }

  const headResult = spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8"
  });
  let HEAD_SHA = headResult.stdout;

  if (
    ["pull_request", "pull_request_target"].includes(eventName) &&
    !github.context.payload.pull_request?.merged
  ) {
    // Both pull_request and pull_request_target events have the same payload structure
    // https://github.com/nrwl/nx-set-shas/issues/186
    const pullRequestEventName = "pull_request";
    const baseResult = spawnSync(
      "git",
      [
        "merge-base",
        `${remote}/${github.context.payload[pullRequestEventName]?.base.ref}`,
        "HEAD"
      ],
      { encoding: "utf-8" }
    );
    BASE_SHA = baseResult.stdout;
  } else if (eventName == "merge_group" && usePreviousMergeGroupCommit) {
    const baseResult = spawnSync("git", ["rev-parse", "HEAD^1"], {
      encoding: "utf-8"
    });
    BASE_SHA = baseResult.stdout;
  } else {
    try {
      const successfulCommit = await findSuccessfulCommit(
        runId,
        owner,
        repo,
        "main",
        lastSuccessfulEvent
      );
      if (!successfulCommit) {
        throw new Error(
          `No successful commit found on '${remote}/main' for event '${lastSuccessfulEvent}'.`
        );
      }
      BASE_SHA = successfulCommit;
    } catch (e) {
      if (errorOnNoSuccessfulWorkflow) {
        core.setFailed((e as Error)?.message);
        return;
      }
    }

    if (!BASE_SHA) {
      if (errorOnNoSuccessfulWorkflow) {
        reportFailure();
        return;
      } else {
        process.stdout.write("\n");
        process.stdout.write(
          `WARNING: Unable to find a successful workflow run on '${remote}/main', or the latest successful workflow was connected to a commit which no longer exists on that branch (e.g. if that branch was rebased)\n`
        );
        if (fallbackSHA) {
          BASE_SHA = fallbackSHA;
          process.stdout.write(`Using provided fallback SHA: ${fallbackSHA}\n`);
        } else {
          // Check if HEAD~1 exists, and if not, set BASE_SHA to the empty tree hash
          const LAST_COMMIT_CMD = `${remote}/main~1`;

          const baseRes = spawnSync("git", ["rev-parse", LAST_COMMIT_CMD], {
            encoding: "utf-8"
          });

          if (baseRes.status !== 0 || !baseRes.stdout) {
            const emptyTreeRes = spawnSync(
              "git",
              ["hash-object", "-t", "tree", "/dev/null"],
              {
                encoding: "utf-8"
              }
            );
            // 4b825dc642cb6eb9a060e54bf8d69288fbee4904 is the expected result of hashing the empty tree
            BASE_SHA =
              emptyTreeRes.stdout ?? `4b825dc642cb6eb9a060e54bf8d69288fbee4904`;
            process.stdout.write(
              `HEAD~1 does not exist. We are therefore defaulting to use the empty git tree hash as BASE.\n`
            );
          } else {
            process.stdout.write(
              `We are therefore defaulting to use HEAD~1 on '${remote}/main'\n`
            );

            BASE_SHA = baseRes.stdout;
          }

          process.stdout.write("\n");
          process.stdout.write(
            `NOTE: You can instead make this a hard error by setting 'error-on-no-successful-workflow' on the action in your workflow.\n`
          );
          process.stdout.write("\n");
        }
        core.setOutput("noPreviousBuild", "true");
      }
    } else {
      process.stdout.write("\n");
      process.stdout.write(
        `Found the last successful workflow run on '${remote}/main'\n`
      );
      process.stdout.write(`Commit: ${BASE_SHA}\n`);
    }
  }

  BASE_SHA = stripNewLineEndings(BASE_SHA);
  HEAD_SHA = stripNewLineEndings(HEAD_SHA);

  // Log base and head SHAs used for nx affected
  process.stdout.write("\n");
  process.stdout.write("Base SHA");
  process.stdout.write(BASE_SHA);
  process.stdout.write("\n");
  process.stdout.write("Head SHA");
  process.stdout.write(HEAD_SHA);
  process.stdout.write("\n");

  // Optionally set the derived SHAs as NX_BASE and NX_HEAD environment variables for the current job
  if (core.getBooleanInput("set-environment-variables-for-job")) {
    core.exportVariable("NX_BASE", BASE_SHA);
    core.exportVariable("NX_HEAD", HEAD_SHA);
    process.stdout.write(
      "NX_BASE and NX_HEAD environment variables have been set for the current Job"
    );
  }

  core.setOutput("base", BASE_SHA);
  core.setOutput("head", HEAD_SHA);
})();

function reportFailure(): void {
  core.setFailed(`
     Unable to find a successful workflow run on '${remote}/main'
     NOTE: You have set 'error-on-no-successful-workflow' on the action so this is a hard error.

     Is it possible that you have no runs currently on '${remote}/main'?
     - If yes, then you should run the workflow without this flag first.
     - If no, then you might have changed your git history and those commits no longer exist.`);
}

/**
 * Find last successful workflow run on the repo
 */
async function findSuccessfulCommit(
  runId: number,
  owner: string,
  repo: string,
  branch: string,
  lastSuccessfulEvent: string
): Promise<string | undefined> {
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN ?? "");

  const shas = await octokit
    .request(`GET /repos/${owner}/${repo}/actions/workflows/release.yml/runs`, {
      owner,
      repo,
      event: lastSuccessfulEvent,
      status: "success"
    })
    // eslint-disable-next-line ts/naming-convention, camelcase
    .then(({ data: { workflow_runs } }) =>
      // eslint-disable-next-line camelcase, ts/no-unsafe-call
      workflow_runs.map((run: { head_sha: any }) => run.head_sha)
    );

  return findExistingCommit(octokit, branch, shas);
}

/**
 * Get first existing commit
 */
async function findExistingCommit(
  octokit: InstanceType<typeof GitHub>,
  branchName: string,
  shas: string[]
): Promise<string | undefined> {
  for (const commitSha of shas) {
    if (await commitExists(octokit, branchName, commitSha)) {
      return commitSha;
    }
  }
  return undefined;
}

/**
 * Check if given commit is valid
 */
async function commitExists(
  octokit: InstanceType<typeof GitHub>,
  branchName: string,
  commitSha: string
): Promise<boolean> {
  try {
    spawnSync("git", ["cat-file", "-e", commitSha], {
      stdio: ["pipe", "pipe", null]
    });

    // Check the commit exists in general
    await octokit.request("GET /repos/{owner}/{repo}/commits/{commit_sha}", {
      owner,
      repo,
      commit_sha: commitSha
    });

    // Check the commit exists on the expected main branch (it will not in the case of a rebased main branch)
    const commits = await octokit.request("GET /repos/{owner}/{repo}/commits", {
      owner,
      repo,
      sha: branchName,
      per_page: 100
    });

    return commits.data.some(
      (commit: { sha: string }) => commit.sha === commitSha
    );
  } catch {
    return false;
  }
}

/**
 * Strips LF line endings from given string
 */
function stripNewLineEndings(string: string): string {
  return string.replace("\n", "");
}
