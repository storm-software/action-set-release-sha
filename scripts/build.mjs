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

import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
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

  if (!existsSync("./dist")) {
    await mkdir("./dist", { recursive: true });
  }

  proc = $`pnpm copyfiles README.md LICENSE action.yml dist`.timeout(
    `${30 * 60}s`
  );
  proc.stdout.on("data", data => {
    echo`${data}`;
  });
  result = await proc;
  if (result.exitCode !== 0) {
    throw new Error(
      `An error occurred while copying files to the dist directory: \n\n${result.message}\n`
    );
  }

  echo`${chalk.green(
    ` ✔ Successfully built the repository in ${configuration} mode!`
  )}`;
} catch (error) {
  echo`${chalk.red(error?.message ? error.message : "A failure occurred while building the repository")}`;

  process.exit(1);
}
