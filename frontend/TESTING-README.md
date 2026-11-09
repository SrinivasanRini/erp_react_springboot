# Frontend test and lint setup

This pack adds a baseline automated test suite for the existing SpringERP frontend.

## What is covered

- Shared UI components: Button, Badge, Input, Select, Table, Modal, ConfirmDialog, StatCard, and ProtectedRoute.
- ERP page smoke tests: Customers, Suppliers, Products, Invoices, Employees, Inventory, Accounting, and CRM.
- API service contract tests: representative endpoint, HTTP method, payload, query-parameter, and response-unwrapping behaviour for Auth, Customers, Suppliers, Products, Employees, Invoices, Inventory, and Accounting.
- ESLint baseline for TypeScript/React source.

## Install the test libraries

The four test libraries are now declared in `package.json`. After applying this pack, run this once from the `frontend` directory:

```powershell
npm install
```

This synchronizes `package-lock.json` with `package.json` and installs the test dependencies. Commit both files so Jenkins `npm ci` installs the same versions.

## Run locally

```powershell
npm test
npm run lint
npm run build
```

Run these commands from `frontend`, not from the monorepo root.

## What these tests do not prove

The page tests mock the data hooks, and API tests mock Axios. They verify frontend rendering, interaction, and API request construction without requiring a running backend or database. They do not prove that the deployed backend accepts each request or that a complete browser journey works end-to-end.

For full end-to-end validation, add browser automation (for example, Playwright) against a running frontend and backend with a dedicated test database. That should be a separate CI stage after the unit-test baseline is stable.
