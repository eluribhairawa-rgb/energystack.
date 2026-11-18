## Overview
This repository contains the web application for **Energy Stacks**.

## Development

### Prerequisites
- Clone the [repository](https://github.com/energystacks/webapp)
- Install the latest version of [Node.js](https://nodejs.org/en/download)
- Install [pnpm](https://pnpm.io/installation)

### Setup
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the development server:
   ```bash
   pnpm dev
   ```

## Testing (Playwright)

We use Playwright for End-to-End (E2E) and Visual Regression testing. 

### Initial Setup
If you are running tests for the first time, you need to install the browser binaries:
```bash
pnpm exec playwright install
```

### Running Tests
- **Run all tests (headless)**:
  ```bash
  pnpm test:e2e
  ```
- **Open Interactive UI**:
  ```bash
  pnpm test:e2e:ui
  ```

### Visual Regression (Snapshots)
Our tests take "Golden Image" screenshots of the application to catch layout shifts. 
- **Platform Specific**: Screenshots include a platform suffix (e.g., `-win32` or `-darwin`) to handle differences in font rendering between Windows and Mac.
- **Update Baselines**: If you intentionally changed the layout and want to save new "perfect" screenshots, run:
  ```bash
  pnpm test:e2e:update
  ```
*Note: Snapshots are ignored by Git. You should generate a local baseline before starting development.*

### Deployment

To deploy changes:
1. Create a new branch.
2. Commit your changes.
3. Open a Pull Request for review and approval.
4. Merging the PR triggers auto deployment.

### Endpoints

- staging: https://staging--eswebapp.netlify.app/
- production: 
  - https://eswebapp.netlify.app/
  - https://energystacks.ai/
