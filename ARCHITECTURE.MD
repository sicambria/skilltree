# Skill Tree Architecture

Content licensed under [CC-BY-SA 4.0](LICENSE-TEXT).

This document describes the high-level architecture of the Skill Tree application.

## Overview

Skill Tree is a full-stack web application built with Node.js and Express, using MongoDB as the primary data store. The application enables users to visualize and track their skills, find mentors, and organize peer-to-peer training.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    Nginx    │────▶│   Express   │
│   Client    │◀────│   (Proxy)   │◀────│   (Node.js) │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                                         ┌──────▼──────┐
                                         │   MongoDB   │
                                         └─────────────┘
```

## Directory Structure

```
skilltree/
├── src/                           # Application source code
│   ├── app.js                     # Express application setup & error handling
│   ├── server.js                  # Entry point (DB connect, server start)
│   ├── config/
│   │   ├── config.js              # Environment-based configuration
│   │   └── db.js                  # MongoDB connection handler
│   ├── controllers/               # Business logic & request handling
│   │   ├── adminController.js     # Admin endpoints (approve, edit, import/export)
│   │   ├── authController.js      # Registration & login
│   │   ├── graphController.js     # Skill dependency graph data
│   │   ├── skillController.js     # Skill CRUD, search, offers, training
│   │   ├── treeController.js      # Skill tree management
│   │   └── userController.js      # User profile, endorse, password, settings
│   ├── middleware/
│   │   └── auth.js                # JWT token verification (verifyToken, verifyAdmin)
│   ├── models/                    # Mongoose data models
│   │   ├── usermodel.js           # User schema
│   │   ├── skillmodel.js          # Global skill schema
│   │   ├── treemodel.js           # Global tree schema
│   │   ├── categorymodel.js       # Category schema
│   │   ├── focusareamodel.js      # Focus area schema
│   │   ├── skillsforapprovemodel.js    # Pending skill approvals
│   │   ├── treesforapprovemodel.js     # Pending tree approvals
│   │   └── trainingsforapprovemodel.js # Pending training approvals
│   ├── routes/                    # Express route definitions
│   │   ├── index.js               # Route aggregation & middleware wiring
│   │   ├── auth.js                # Public auth routes
│   │   ├── admin.js               # Admin-only routes
│   │   ├── graph.js               # Graph data routes
│   │   ├── skill.js               # Protected skill routes
│   │   ├── tree.js                # Protected tree routes
│   │   └── user.js                # Protected user routes
│   ├── services/
│   │   └── wikidataService.js     # Wikidata API integration
│   └── utils/
│       ├── security.js            # PBKDF2 password hashing
│       ├── seed.js                # Database seeder
│       ├── skillUtils.js          # Skill lookup helpers
│       └── treeUtils.js           # Tree sorting & dependency traversal
├── public/                        # Static frontend assets
│   ├── login.html                 # Login page
│   ├── register.html              # Registration page
│   ├── login.js, register.js      # Frontend logic
│   ├── style.css                  # Global styles
│   └── user/                      # Authenticated user pages & scripts
├── assets/                        # Application seed data
│   └── json/                      # Skills (split by letter range), trees, categories
├── tests/                         # Test suites
│   ├── __tests__/                 # Backend tests (controllers, routes, models, utils)
│   ├── frontend/                  # Frontend tests (login, helpers)
│   └── helpers/                   # Test DB lifecycle (mongodb-memory-server)
├── docs/                          # Documentation
└── install/                       # Deployment scripts & Docker config
```

## Core Components

### 1. Application Entry Point (`src/server.js`)

- Loads environment variables via dotenv
- Connects to MongoDB via `src/config/db.js`
- Creates HTTP server with the Express app
- Handles graceful shutdown (SIGTERM/SIGINT)
- Catches unhandled rejections and uncaught exceptions

### 2. Express Application (`src/app.js`)

- Security headers via Helmet
- JSON & URL-encoded body parsing
- Request logging via Morgan
- Static file serving for frontend assets
- API routes mounted under `/`, `/protected`, `/admin`, `/graph`
- 404 handler and global error handler (handles Mongoose ValidationError, CastError)

### 3. Authentication Flow

```
┌──────────┐     POST /registration     ┌─────────────┐
│  Client  │ ─────────────────────────▶ │   Server    │
│          │ ◀───────────────────────── │             │
└──────────┘     { success, token }     └─────────────┘

┌──────────┐     POST /auth             ┌─────────────┐
│  Client  │ ─────────────────────────▶ │   Server    │
│          │ ◀───────────────────────── │             │
└──────────┘     { success, token }     └─────────────┘

┌──────────┐     GET /protected/*       ┌─────────────┐
│  Client  │ ─────────────────────────▶ │   Server    │
│ (+ JWT   │ ◀───────────────────────── │             │
│  Header) │     { data }               └─────────────┘
```

**Security:**
- Passwords hashed using PBKDF2 with SHA-512, 248,573 iterations
- JWT tokens with 1-day expiration
- Token passed via `x-access-token` header
- Rate limiting on auth routes (20 requests per 15 minutes)

### 4. Data Models

#### User Model
Fields: `username`, `admin`, `email`, `hashData` (PBKDF2), `focusArea`, `location`, `willingToTeach`, `teachingDay`, `teachingTime`, `categories`, `skills` (embedded array), `mainTree`, `trees` (embedded array)

#### Skill Model
Fields: `name`, `categoryName`, `skillIcon`, `description`, `descriptionWikipediaURL`, `pointDescription`, `achievedPoint`, `maxPoint`, `parents`, `children`, `trainings`, `offers`, `beginnerRequests`, `intermediateRequests`, `advancedRequests`

#### Tree Model
Fields: `name`, `skillNames`, `description`, `focusArea`

### 5. Data Flow

#### Skill Tree Visualization
1. User authenticates → receives JWT
2. Frontend requests `/protected/userdata`
3. Server returns user's skills, trees, and categories
4. Frontend renders interactive skill tree visualization
5. User can update skill levels, add trees, request/offer training

#### Peer-to-Peer Training
1. User marks `willingToTeach: true` for a skill
2. Other users search for training offers
3. Offers displayed with teacher's availability and location
4. Training requests tracked at beginner/intermediate/advanced levels

#### Approval Workflow
1. User proposes a new skill/tree/training → saved to Approvable* collection
2. Admin reviews and approves via admin endpoints
3. Upon approval, the item is saved to the global collection and propagated to users

### 6. API Endpoints

See [README.md](README.md#api-endpoints) for the complete API reference.

## Technology Choices

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Express.js** | Web framework | Lightweight, flexible, widely adopted |
| **MongoDB** | Database | Document model fits skill/tree structures |
| **Mongoose 8** | ODM | Schema validation, query building, middleware |
| **JWT** | Authentication | Stateless, scalable token-based auth |
| **PBKDF2** | Password hashing | Industry-standard key derivation |
| **Jest** | Testing | Fast, feature-rich test framework |
| **mongodb-memory-server** | Test DB | In-memory MongoDB for isolated tests |

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Production Server                   │
│  ┌─────────────┐                                        │
│  │   Nginx     │  Port 80/443 (SSL via Let's Encrypt)  │
│  │  (Reverse   │                                        │
│  │   Proxy)    │                                        │
│  └──────┬──────┘                                        │
│         │                                                │
│  ┌──────▼──────┐     ┌─────────────┐                   │
│  │  Node.js    │────▶│   MongoDB   │                   │
│  │   :3000     │◀────│   :27017    │                   │
│  └─────────────┘     └─────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

## CI/CD

Tests run automatically via GitHub Actions on push/PR to `main`:
- Node.js 18 and 20 matrix
- `npm ci` + `npm test` with coverage
- Coverage artifacts uploaded

## Covered Testing Areas

| Layer | Tools | Location |
|-------|-------|----------|
| Controller unit tests | Jest + mongodb-memory-server | `tests/__tests__/controllers/` |
| Route integration tests | supertest + JWT | `tests/__tests__/routes/` |
| Model validation | Mongoose | `tests/__tests__/models/` |
| Utility functions | Jest | `tests/__tests__/utils/` |
| Middleware | Jest | `tests/__tests__/middleware/` |
| Frontend tests | Jest + jsdom | `tests/frontend/` |
| Fuzz/property tests | fast-check | `tests/__tests__/utils/*.fuzz.test.js` |

Coverage thresholds: statements 80%, branches 70%, functions 80%, lines 80%.

## Future Considerations

- **API versioning** – Add `/api/v1/` prefix for backwards compatibility
- **Redis caching** – Session/query caching for performance
- **TypeScript** – Type safety for larger codebase
- **WebSocket** – Real-time updates for collaborative features
