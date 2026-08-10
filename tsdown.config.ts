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

import { defineConfig } from "tsdown";

const config = defineConfig({
  name: "set-release-sha",
  entry: "src/index.ts",
  platform: "node",
  target: "node24",
  outDir: "dist",
  format: "cjs",
  exports: false,
  minify: true,
  sourcemap: false,
  dts: false,
  deps: {
    alwaysBundle: ["@actions/core", "@actions/github"]
  }
});

export default config;
