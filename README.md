# Skill Tree

> A web application to visualize skills, motivate self-development, and foster a culture of collaboration and knowledge sharing.

[![Total alerts](https://img.shields.io/lgtm/alerts/g/sicambria/skilltree.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/sicambria/skilltree/alerts/)
[![Maintainability](https://api.codeclimate.com/v1/badges/0315c0b0650106013493/maintainability)](https://codeclimate.com/github/sicambria/skilltree/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/0315c0b0650106013493/test_coverage)](https://codeclimate.com/github/sicambria/skilltree/test_coverage)

## ✨ Features

- **Visual Skill Recording** – Track your skills and proficiency levels in visual form
- **Self-Development Awareness** – Immediately see growth opportunities, available help & trainings
- **Personal Learning Plans** – Create time-framed development roadmaps
- **Expert Discovery** – Find people with specific skills willing to share knowledge
- **Peer-to-Peer Training** – Request or offer training for specific skills at any level

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | [Node.js](https://nodejs.org) |
| **Framework** | [Express.js](https://expressjs.com/) |
| **Database** | [MongoDB](https://www.mongodb.com/) |
| **Web Server** | [Nginx](https://www.nginx.com/) |
| **SSL** | [Let's Encrypt](https://letsencrypt.org/) |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) (v14+)
- [MongoDB](https://www.mongodb.com/) (running locally or via Atlas)

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Database**:
   Ensure MongoDB is running, then seed the database with initial data:
   ```bash
   npm run db:seed
   ```

3. **Run the Application**:
   - **Development mode** (with auto-reload):
     ```bash
     npm run dev
     ```
   - **Production mode**:
     ```bash
cd ~
mkdir skilltree && cd skilltree
wget https://raw.githubusercontent.com/sicambria/skilltree/master/install/skilltree_install_debian9.sh
chmod +x skilltree_install_debian9.sh
nano skilltree_install_debian9.sh  # Configure before running
./skilltree_install_debian9.sh
```

**Option 2: Docker (Beta)**

```bash
# Build images
docker build --no-cache -t localhost/skilltree-mongodb:latest ./docker-build/mongodb/
docker build --no-cache -t localhost/skilltree-nginx:latest ./docker-build/nginx/
docker build --no-cache -t localhost/skilltree-nodejs:latest ./docker-build/nodejs/

# Run containers (in order)
docker run -d -p <IP>:27017:27017 localhost/skilltree-mongodb
docker run -d -p <IP>:3000:3000 -e DBADDRESS=<IP> localhost/skilltree-nodejs
docker run -d -e BACKEND=<IP> -p 0.0.0.0:80:80 localhost/skilltree-nginx
```

### Production Nginx Setup

After installation, configure `/etc/nginx/sites-available/default`:

```nginx
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;

    ssl_certificate     /etc/letsencrypt/live/YOUR_DOMAIN/cert.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;

    location / {
        proxy_pass http://localhost:3000/;
    }
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    return 301 https://$host$request_uri;
}
```

## ⚙️ Configuration

### Environment Variables (.env)

For local development, a `.env` file is used to store environment-specific settings. This file is ignored by Git.

Default credentials for local testing:
- **Username**: `admin`
    - **Password**: `admin`

1. **Domain**: Register a domain (e.g., via [Freenom](https://www.freenom.com))
2. **Security**: Update `config.js` with a long, random secret key
3. **Database**: Configure MongoDB connection (local or [MongoDB Atlas](https://cloud.mongodb.com/))

## 📖 Documentation

- [Architecture Overview](ARCHITECTURE.MD)
- [Contributing Guide](docs/contribute/CONTRIBUTING.md)
- [Project Roadmap](https://github.com/sicambria/skilltree/projects)

## 🤝 Contributing

We welcome contributions! You can help by:

- Extending the [list of skills](assets/json/skills.json) and [trees](assets/json/trees.json)
- Improving code quality and test coverage
- Creating new features
- Spreading the word about SkillTree

Please read our [Contributing Guidelines](docs/contribute/CONTRIBUTING.md) before submitting PRs.

## 📜 License

This project is dual-licensed to ensure both systemic openness and software freedom:

- **Source Code**: Licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPLv3).
- **Textual Content & Data**: All curriculum, documentation, and systemic data are licensed under [Creative Commons Attribution-ShareAlike 4.0 International](LICENSE-TEXT) (CC-BY-SA 4.0).
