# Skill Tree Architecture

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
├── app.js              # Main application entry point
├── config.js           # Configuration (secrets, DB connection)
├── pbkdf2.js           # Password hashing utilities
├── api/                # API route modules
│   ├── admin.js        # Admin-specific endpoints
│   └── search.js       # Search functionality
├── models/             # Mongoose data models
│   ├── usermodel.js    # User schema
│   ├── skillmodel.js   # Skill schema
│   ├── treemodel.js    # Skill tree schema
│   ├── categorymodel.js
│   ├── focusareamodel.js
│   └── *forapprovemodel.js  # Approval workflow models
├── public/             # Static frontend assets
│   ├── login.html      # Login page
│   ├── register.html   # Registration page
│   ├── user/           # Authenticated user pages
│   └── *.css, *.js     # Stylesheets and scripts
├── assets/             # Application data
│   └── json/           # Predefined skills, trees, categories
├── docs/               # Documentation
└── install/            # Installation scripts
```

## Core Components

### 1. Application Layer (`app.js`)

The main Express application handles:

- **Static file serving** – Login, registration, and user dashboard pages
- **Authentication** – JWT-based user authentication with PBKDF2 password hashing
- **Protected routes** – Token-validated endpoints under `/protected/*`
- **RESTful API** – CRUD operations for users, skills, trees, and trainings

### 2. Data Models

#### User Model
```javascript
{
  username: String,
  admin: Boolean,
  email: String,
  hashData: Buffer,           // PBKDF2 password hash
  focusArea: { name, treeNames[] },
  location: String,
  willingToTeach: Boolean,
  teachingDay: String,
  teachingTime: String,
  categories: [{ name, achievedPoint, maxPoint }],
  skills: [SkillObject],
  mainTree: String,
  trees: [TreeObject]
}
```

#### Skill Model
```javascript
{
  name: String,
  categoryName: String,
  skillIcon: String,
  description: String,
  descriptionWikipediaURL: String,
  pointDescription: [String],
  achievedPoint: Number,
  maxPoint: Number,
  parents: [String],
  children: [{ name, minPoint, recommended }],
  trainings: [TrainingObject],
  offers: [OfferObject],
  *Requests: [RequestObject]  // beginner/intermediate/advanced
}
```

#### Tree Model
```javascript
{
  name: String,
  skillNames: [String],
  description: String,
  focusArea: String
}
```

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
└──────────┘
```

**Security:**
- Passwords hashed using PBKDF2
- JWT tokens with 1-day expiration
- Token passed via `x-access-token` header

### 4. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/registration` | POST | Create new user account |
| `/auth` | POST | Authenticate and receive JWT |
| `/protected/userdata` | GET | Get current user's full profile |
| `/protected/offers` | GET | Get skill teaching offers |
| `/protected/searchSkillsByName` | POST | Search skills by name |
| `/protected/searchUserSkillsByName` | POST | Search user's skills |
| `/protected/getPublicUserData` | POST | Get public user profiles |
| `/protected/getPublicSkillData` | POST | Get skill details with learners |
| `/protected/addTreeToUser` | POST | Add a skill tree to user |

## Data Flow

### Skill Tree Visualization

1. User authenticates → receives JWT
2. Frontend requests `/protected/userdata`
3. Server returns user's skills, trees, and categories
4. Frontend renders interactive skill tree visualization
5. User can update skill levels, add trees, request/offer training

### Peer-to-Peer Training

1. User marks `willingToTeach: true` for a skill
2. Other users search for training offers
3. Offers displayed with teacher's availability and location
4. Training requests tracked at beginner/intermediate/advanced levels

## Technology Choices

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Express.js** | Web framework | Lightweight, flexible, widely adopted |
| **MongoDB** | Database | Document model fits skill/tree structures |
| **JWT** | Authentication | Stateless, scalable token-based auth |
| **PBKDF2** | Password hashing | Industry-standard key derivation |
| **Nginx** | Reverse proxy | SSL termination, static file caching |

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

## Future Considerations

- **API versioning** – Add `/api/v1/` prefix for backwards compatibility
- **Rate limiting** – Protect against abuse
- **Caching** – Redis for session/query caching
- **Testing** – Add unit and integration tests
- **TypeScript** – Type safety for larger codebase
