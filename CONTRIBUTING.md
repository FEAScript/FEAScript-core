## Contributing to FEAScript

Thank you for your interest in contributing! FEAScript is in early development, with continuous additions of new features and improvements. To ensure a smooth and collaborative development process, please review and follow the guidelines below.

## Contribution Guidelines

1. **Development Tools:**  
   We recommend using [Visual Studio Code](https://code.visualstudio.com/) with the [Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) for automatic code formatting. Additionally, use a **110-character line width** to maintain consistent formatting.

2. **Coding Style:**  
   Observe the code near your intended changes and aim to preserve that style in your modifications.

3. **Variable Naming:**  
   Use [camelCase](https://en.wikipedia.org/wiki/Camel_case) formatting for variable names throughout the code.

4. **File Naming:**  
   All JavaScript source files in FEAScript end with the suffix `Script` before the `.js` extension (e.g., `loggingScript.js`, `meshGenerationScript.js`, `newtonRaphsonScript.js`). This is an explicit, project‑level stylistic choice to:

   - Visually distinguish internal FEAScript modules from third‑party or external library files.
   - Keep historical and stylistic consistency across the codebase.

   Exceptions:

   - Public entry file: `index.js` (standard entry point convention).
   - Core model file: `FEAScript.js` (matches the library name; appending "Script" would be redundant).

5. **File Structure:**  
   All files in the FEAScript-core codebase should follow this structure:

   1. **Banner**: All files start with the FEAScript ASCII art banner.
   2. **Imports**:
      - External imports (from npm packages) first, alphabetically ordered.
      - Internal imports next, grouped by module/folder.
   3. **Classes/Functions**: Implementation with proper JSDoc comments.

   Example:

   ```javascript
   //   ______ ______           _____           _       _     //
   //  |  ____|  ____|   /\    / ____|         (_)     | |    //
   //  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
   //  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
   //  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
   //  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
   //                                            | |   | |    //
   //                                            |_|   | |_   //
   //       Website: https://feascript.com/             \__|  //

   // External imports
   import { mathLibrary } from "math-package";

   // Internal imports
   import { relatedFunction } from "../utilities/helperScript.js";

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

6. **Branching & Workflow:**  
   To contribute a new feature or fix:

   - Do not commit directly to `main`.
   - Instead, create a short‑lived branch:
     - `feature/<topic>` for new functionality
     - `fix/<issue>` for bug fixes

   External contributors:

   1. Fork the repo.  
   2. Branch from `main` in your fork.  
   3. Push and open a PR from your fork’s branch into `main`.

7. **Local Testing:**  
   Before submitting a pull request, test your modifications by running the FEAScript library from a local directory. For example, you can load the library in your HTML file as follows:

   ```javascript
   import { FEAScriptModel, plotSolution, printVersion } from "[USER_DIRECTORY]/FEAScript-core/src/index.js";
   ```

   FEAScript can be run on a local server. To start a local server, you can use [Python HTTP Server](https://docs.python.org/3/library/http.server.html):

   ```bash
   python -m http.server
   ```

   where the server will be available at `http://127.0.0.1:8000/`. Static file server npm packages like [serve](https://github.com/vercel/serve#readme) and [Vite](https://vite.dev/) can also be used.
