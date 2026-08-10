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

import { defineConfig } from "@storm-software/eslint";

Error.stackTraceLimit = Number.POSITIVE_INFINITY;

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig({
  name: "action-set-release-sha",
  nx: false,
  typescript: true,
  tsdoc: false,
  markdown: true
});
