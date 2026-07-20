# Skill Tree

> A web application to visualize skills, motivate self-development, and foster a culture of collaboration and knowledge sharing.

[![Test Suite](https://github.com/sicambria/skilltree/actions/workflows/test.yml/badge.svg)](https://github.com/sicambria/skilltree/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/sicambria/skilltree/branch/main/graph/badge.svg)](https://codecov.io/gh/sicambria/skilltree)

## Features

- **Visual Skill Recording** – Track your skills and proficiency levels in visual form
- **Self-Development Awareness** – Immediately see growth opportunities, available help & trainings
- **Personal Learning Plans** – Create time-framed development roadmaps
- **Expert Discovery** – Find people with specific skills willing to share knowledge
- **Peer-to-Peer Training** – Request or offer training for specific skills at any level
- **Graph Visualization** – Explore the full skill dependency graph
- **Wikidata Import** – Import skills from Wikidata with admin tools
- **Approval Workflow** – Skills, trees, and trainings go through an approval process

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | [Node.js](https://nodejs.org) (18+) |
| **Framework** | [Express.js](https://expressjs.com/) |
| **Database** | [MongoDB](https://www.mongodb.com/) (via [Mongoose 8](https://mongoosejs.com/)) |
| **Auth** | JWT + PBKDF2 |
| **Testing** | [Jest](https://jestjs.io/) + [supertest](https://github.com/ladjs/supertest) + [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server) |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) (v18+)
- [MongoDB](https://www.mongodb.com/) (running locally or via Atlas)

### Local Development

1. **Clone and install**:
   ```bash
   git clone https://github.com/sicambria/skilltree.git
   cd skilltree
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Initialize Database**:
   Ensure MongoDB is running, then seed the database:
   ```bash
   npm run db:seed
   ```

4. **Run the Application**:
   - **Development** (with auto-reload):
     ```bash
     npm run dev
     ```
   - **Production**:
     ```bash
     npm start
     ```

5. **Open in browser**: `http://localhost:3000`
   - Default credentials: **admin** / **admin**

### Running Tests

```bash
# Full test suite (backend + frontend)
npm test

# Frontend tests only
npm run test:frontend

# All tests
npm run test:all
```

## Project Structure

```
skilltree/
├── src/                    # Application source
│   ├── app.js              # Express app configuration & middleware
│   ├── server.js           # Entry point (DB connection + server start)
│   ├── config/             # DB connection & environment config
│   ├── controllers/        # Business logic (auth, user, skill, tree, admin, graph)
│   ├── middleware/          # JWT authentication middleware
│   ├── models/             # Mongoose schemas (User, Skill, Tree, etc.)
│   ├── routes/             # Express route definitions
│   ├── services/           # External API integrations (Wikidata)
│   └── utils/              # Helpers (password hashing, tree sorting, seeding)
├── public/                 # Static frontend assets (HTML, CSS, JS)
├── tests/                  # Test suites
│   ├── __tests__/          # Backend tests (controllers, routes, models, utils)
│   ├── frontend/           # Frontend tests (login, helper functions)
│   └── helpers/            # Test DB lifecycle (mongodb-memory-server)
├── assets/json/            # Seed data (skills, trees, categories)
├── install/                # Deployment scripts
└── docs/                   # Documentation
```

## Configuration

### Environment Variables (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `verysecret` | Secret key for JWT signing (change in production!) |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/skilltreenew` | MongoDB connection string |
| `NODE_ENV` | `development` | Environment mode (`development` / `production`) |
| `PORT` | `3000` | Server listening port |

## API Endpoints

### Public
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/registration` | POST | Create a new user account |
| `/auth` | POST | Authenticate and receive JWT |

### Protected (requires `x-access-token` header)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/protected/userdata` | GET | Get current user's full profile |
| `/protected/offers` | POST | Get skill teaching offers |
| `/protected/searchSkillsByName` | POST | Search skills by name |
| `/protected/searchUserSkillsByName` | POST | Search user's skills |
| `/protected/getPublicSkillData` | POST | Get skill details with learners |
| `/protected/getPublicUserData` | POST | Get public user data |
| `/protected/getskill` | POST | Get skill details with dependency tree |
| `/protected/newskill` | POST | Propose a new skill |
| `/protected/newtraining` | POST | Add training to a skill |
| `/protected/submitall` | POST | Batch update skill levels |
| `/protected/newtree` | POST | Create a new skill tree |
| `/protected/editmytree` | POST | Edit a user's tree |
| `/protected/deletemytree` | POST | Delete a user's tree |
| `/protected/addTreeToUser` | POST | Add a global tree to user |
| `/protected/searchTreesByName` | POST | Search trees by name |
| `/protected/getPublicTreeData` | POST | Get public tree data |
| `/protected/gettree` | POST | Get tree details |
| `/protected/endorse` | POST | Endorse a user's skill |
| `/protected/newpassword` | POST | Change password |
| `/protected/newplace` | POST | Update location |
| `/protected/newemail` | POST | Update email |
| `/protected/newhelp` | POST | Toggle teaching availability |
| `/protected/firstlogindata` | POST | Save initial setup |

### Admin (requires admin JWT)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/approveskill` | POST | Approve a proposed skill |
| `/admin/editskill` | POST | Edit a global skill |
| `/admin/edittree` | POST | Edit a global tree |
| `/admin/approvetree` | POST | Approve a proposed tree |
| `/admin/approvetraining` | POST | Approve proposed training |
| `/admin/dropoffers` | POST | Clear all teaching offers |
| `/admin/setadmin` | POST | Grant/revoke admin role |
| `/admin/deleteUser` | POST | Delete a user |
| `/admin/wikidata/search` | GET | Search Wikidata entities |
| `/admin/wikidata/import` | POST | Import skills from Wikidata |
| `/admin/export` | GET | Export skills/trees as JSON |
| `/admin/import` | POST | Import skills/trees from JSON |

### Graph
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/graph/data` | GET | Get full skill dependency graph |

## Documentation

- [Architecture Overview](ARCHITECTURE.MD)
- [Testing Guide](TESTING.md)
- [Contributing Guide](docs/contribute/CONTRIBUTING.md)
- [Skill Levels](docs/skills/skill-levels.md)
- [Metamodels Framework](docs/framework/metamodels.md)
- [Wikidata Import](docs/features/wikidata-import.md)
- [Graph View](docs/features/graph-view.md)

## License

This project is dual-licensed:

- **Source Code**: [GNU Affero General Public License v3.0](LICENSE) (AGPLv3)
- **Textual Content & Data**: [Creative Commons Attribution-ShareAlike 4.0 International](LICENSE-TEXT) (CC-BY-SA 4.0)
