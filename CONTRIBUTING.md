# Contributing to FEAScript

Thank you for your interest in contributing! FEAScript is in early development, with continuous additions of new features and improvements. To ensure a smooth and collaborative development process, please review and follow the guidelines below.

## Contents

- [Development Environment & Coding Style](#development-environment--coding-style)
- [Variable & File Naming](#variable--file-naming)
- [File Structure](#file-structure)
- [Branching & Workflow](#branching--workflow)
- [Signing Off Commits (DCO)](#signing-off-commits-dco)
- [Local Testing](#local-testing)
- [Running the Node.js Examples](#running-the-nodejs-examples)
- [Verifying Your Changes](#verifying-your-changes)

## Development Environment & Coding Style

- Use [Visual Studio Code](https://code.visualstudio.com/) with the [Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) for automatic code formatting
- Use a **110-character line width** to maintain consistent formatting
- Observe the code near your intended changes and aim to preserve that style in your modifications

## Variable & File Naming

- Use [camelCase](https://en.wikipedia.org/wiki/Camel_case) formatting for variable names throughout the code
- JavaScript source file names use camelCase (e.g., `logging.js`, `structuredMesh.js`, `newtonRaphson.js`)

### Exceptions

- Public entry file: `index.js` (standard entry point convention)
- Core model file: `FEAScript.js` (matches the library name)

## File Structure

All files in the FEAScript-core codebase should follow this structure:

1.  Banner: All files start with the FEAScript banner
2.  Imports:
    - External imports first, alphabetically ordered
    - Internal imports next, grouped by module/folder
3.  Classes/Functions: Implementation with proper JSDoc comments

Example:

```javascript
/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Finite Element Simulation in JavaScript
 *  Version: {VERSION} | https://feascript.com
 *  MIT License © 2023–20xx FEAScript
 * ════════════════════════════════════════════════════════════
 */

// External imports
import { mathLibrary } from "math-package";

// Internal imports
import { relatedFunction } from "../utilities/helper.js";

/**
 * Class to handle specific functionality
 */
export class MyClass {
  /**
   * Constructor to initialize the class
   * @param {object} options - Configuration options
   */
  constructor(options) {
    // Implementation
  }

  /**
   * Function to perform a specific action
   * @param {number} input - Input value
   * @returns {number} Processed result
   */
  doSomething(input) {
    // Implementation
    return input * DEFAULT_VALUE;
  }
}
```

## Branching & Workflow

FEAScript uses two kinds of long-lived branches:

- `main`: holds the current stable version of FEAScript, i.e., the latest published release. It is only updated when a release is finalized (or by a hotfix)
- `release/<version>` (e.g., `release/0.4.0-rc`): the active development branch for the upcoming release. All contributions go here

When a release is ready, the `release/<version>` branch is merged into `main` and tagged.

To contribute a new feature or fix:

- Do not commit to or open pull requests against `main`
- Instead, create a short‑lived branch from the current `release/<version>` branch (the most recent one listed under [branches](https://github.com/FEAScript/FEAScript-core/branches)):
  - `feature/<topic>` for new functionality
  - `fix/<issue>` for bug fixes

External contributors:

1.  Fork the repo
2.  Branch from the current `release/<version>` branch in your fork
3.  Push and open a PR from your fork’s branch into the same `release/<version>` branch

> **Note:** GitHub selects `main` as the base branch by default when opening a PR. Make sure to change the base to the current `release/<version>` branch.

### Hotfixes

The only exception is an urgent fix to an already published release:

1.  Create a `hotfix/<issue>` branch from `main`
2.  Open a PR from it into `main`

After the hotfix is merged, maintainers merge `main` back into the active `release/<version>` branch so the fix is not lost in the next release.

## Signing Off Commits (DCO)

All commits must be signed off under the [Developer Certificate of Origin (DCO)](https://developercertificate.org). By signing off, you certify that you wrote the code or otherwise have the right to submit it under the project's license.

To sign off, add the `-s` flag when committing:

```bash
git commit -s -m "Your commit message"
```

This appends a line like the following to your commit message, using your `user.name` and `user.email` from Git config:

```
Signed-off-by: Jane Doe <jane@example.com>
```

If you forgot to sign off:

- Last commit only: `git commit --amend -s --no-edit`
- Several commits: `git rebase --signoff HEAD~N` (where `N` is the number of commits)

Then force-push your branch to update the PR.

### Author Name (.mailmap)

If your commits appear under different names or emails (e.g., a username in some and your full name in others), you can add an entry to the [`.mailmap`](.mailmap) file so Git tools such as `git log`, `git shortlog` and `git blame` show a single, consistent identity. Existing commits are not modified. Use one line per identity:

```
# Use this name for all commits made with this email
Your Full Name <your@email.com>

# Also map commits made with a different email to your preferred name and email
Your Full Name <your@email.com> <old@email.com>
```

Include the `.mailmap` change in your PR.

## Local Testing

Before submitting a pull request, test your modifications by running the FEAScript library from a local directory. For example, you can load the library in your HTML file as follows:

```javascript
import { FEAScriptModel, plotSolution, version } from "[USER_DIRECTORY]/FEAScript-core/src/index.js";
```

FEAScript can be run on a local server. You **must** start the server from the workspace root directory (the folder that contains both `FEAScript-core/` and `FEAScript-website/`), not from inside either subfolder. The HTML files use relative paths such as `../feascript-website.css` and `../../FEAScript-core/src/index.js` that only resolve correctly from that root.

```bash
# Navigate to the workspace root first
cd /path/to/FEAScript-workspace

# Then start the server
python3 -m http.server
```

The server will be available at `http://127.0.0.1:8000/`. Open a tutorial at its full path, e.g.:

```
http://127.0.0.1:8000/FEAScript-website/tutorials/solidification-front-2d-worker.html
```

Static file server npm packages like [serve](https://github.com/vercel/serve#readme) and [Vite](https://vite.dev/) can also be used.

Testing can be also performed at the Node.js environment. In this case you can also run predefined tests to make sure nothing is broken. This performed as follows:

```bash
npm test
```

This command uses the Node.js test runner to discover all test files under `tests/`. The tests compare numerical results against stored reference solutions and verify individual solver and assembler behavior.

The script-tag build (`dist/feascript.umd.js`) and its web workers can only be checked in a browser. `npm test` does not run that check; run it with `npm run test:browser`, which builds and opens the page in headless Chromium and Firefox (see [`tests/umd`](tests/umd/README.md)).
