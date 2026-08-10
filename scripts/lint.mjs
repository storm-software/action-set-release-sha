#!/usr/bin/env zx
/* -------------------------------------------------------------------

             🗲 Storm Software - Minimal Template

 This code was released as part of the Minimal Template project. Minimal Template
 is maintained by Storm Software under the Apache-2.0 license, and is
 free for commercial and private use. For more information, please visit
 our licensing page at https://stormsoftware.com/licenses/projects/minimal-template.

 Website:                  https://stormsoftware.com
 Repository:               https://github.com/storm-software/minimal-template
 Documentation:            https://docs.stormsoftware.com
 Contact:                  https://stormsoftware.com/contact

 SPDX-License-Identifier:  Apache-2.0

 ------------------------------------------------------------------- */

import { $, argv, chalk, echo } from "zx";

try {
  echo`${chalk.whiteBright(" 📋  Linting the repository...")}`;

  let filesList = "";
  if (argv._ && argv._.length > 0) {
    filesList = argv._.join(" ");
  }

  let proc =
    $`pnpm exec eslint --fix --quiet --color --no-error-on-unmatched-pattern --config ./eslint.config.mjs --cache --cache-location ./node_modules/.cache/eslint/workspace.json --concurrency auto ${
      filesList || "**/*.{ts,tsx,js,jsx,json}"
    }`.timeout(`${30 * 60}s`);
  proc.stdout.on("data", data => {
    echo`${data}`;
  });
  let result = await proc;
  if (result.exitCode !== 0) {
    throw new Error(
      `An error occurred while running ESLint on the repository: \n\n${result.message}\n`
    );
  }

  proc = $`pnpm exec storm-lint actions-up`.timeout(`${30 * 60}s`);
  proc.stdout.on("data", data => {
    echo`${data}`;
  });
  result = await proc;
  if (result.exitCode !== 0) {
    throw new Error(
      `An error occurred while running \`storm-lint\` on the repository: \n\n${result.message}\n`
    );
  }

  echo`${chalk.green(" ✔ Successfully linted the repository's files")}`;
} catch (error) {
  echo`${chalk.red(error?.message ? error.message : "A failure occurred while linting the repository")}`;

  process.exit(1);
}
