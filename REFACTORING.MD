# Refactoring Guide & Best Practices

This document outlines the major refactoring performed on the Skill Tree project and establishes best practices for future development.

## 🏛️ New Architecture

The project has transitioned from a monolithic `app.js` to a modular, layered architecture located in the `src/` directory.

### Directory Structure

```text
src/
├── app.js            # Express application configuration
├── server.js         # Entry point (DB connection & Server start)
├── config/           # Centralized configuration & DB logic
├── controllers/      # Business logic and request handling
├── middleware/       # Express middleware (Auth, Validation)
├── models/           # Mongoose schemas and models
├── routes/           # Router definitions and endpoint mapping
└── utils/            # Shared helper functions and logic
```

## 🛠️ Major Changes

### 1. Separation of Concerns
- **Logic extraction**: Business logic previously embedded in route handlers has been moved to **Controllers**.
- **Route Modularization**: Endpoints are grouped by domain (e.g., `/auth`, `/user`, `/admin`) in separate files within `src/routes/`.
- **Centralized Middleware**: Authentication logic is now a reusable middleware in `src/middleware/auth.js`.

### 2. Modern Asynchronous Patterns
- **Async/Await**: Replaced legacy Mongoose callback patterns with `async/await` to improve readability and compatibility with Mongoose 8.
- **Error Handling**: Standardized `try/catch` blocks in controllers to manage asynchronous errors gracefully.

### 3. Clean Entry Point
- **`server.js` vs `app.js`**: Separated the application setup (routes, middleware) from the actual server start-up (listening on a port). This is a best practice for easier testing.

## 🌟 Best Practices for Future Development

### 1. Keep Controllers Thin
Controllers should primarily handle request parsing and response orchestration. Complex business logic should be delegated to utilities or service layers.

### 2. Use Middleware for Cross-Cutting Concerns
Validation, authentication, and logging should always be handled via Express middleware to keep route handlers focused on their specific tasks.

### 3. Environment Configuration
Always use `src/config/config.js` or environment variables (via `dotenv`) for secrets and connection strings. Never hardcode sensitive values in the logic.

### 4. Consistent Error Responses
Follow the established pattern of returning a consistent JSON structure for both success and error cases:
```json
{
  "success": boolean,
  "message": "Human readable message",
  "data": { ... }
}
```

### 5. Dependency Injection (Implicit)
When creating utilities, ensure they are independent of the request/response cycle where possible, making them easier to unit test.
