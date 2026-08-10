#!/usr/bin/env zx
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

import { $, argv, chalk, echo } from "zx";

try {
  let configuration = argv.configuration;
  if (!configuration) {
    if (argv.prod) {
      configuration = "production";
    } else if (argv.dev) {
      configuration = "development";
    } else {
      configuration = "production";
    }
  }

  echo`${chalk.whiteBright(
    `🏗️  Building the repository in ${configuration} mode...`
  )}`;

  let proc = $`pnpm bootstrap`.timeout(`${1 * 60}s`);
  proc.stdout.on("data", data => {
    echo`${data}`;
  });
  let result = await proc;
  if (result.exitCode !== 0) {
    throw new Error(
      `An error occurred while bootstrapping the repository: \n\n${
        result.message
      }\n`
    );
  }

  proc = $`pnpm exec tsdown --config tsdown.config.ts`.timeout(`${30 * 60}s`);
  proc.stdout.on("data", data => {
    echo`${data}`;
  });
  result = await proc;
  if (result.exitCode !== 0) {
    throw new Error(
      `An error occurred while building the project: \n\n${result.message}\n`
    );
  }

  echo`${chalk.green(
    ` ✔ Successfully built the repository in ${configuration} mode!`
  )}`;
} catch (error) {
  echo`${chalk.red(error?.message ? error.message : "A failure occurred while building the repository")}`;

  process.exit(1);
}
