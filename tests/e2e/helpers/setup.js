require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

process.env.JWT_SECRET = 'verysecret';
process.env.NODE_ENV = 'e2e';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');
const app = require('../../../src/app');
const Category = require('../../../src/models/categorymodel');
const Skill = require('../../../src/models/skillmodel');
const Tree = require('../../../src/models/treemodel');
const User = require('../../../src/models/usermodel');
const security = require('../../../src/utils/security');

const PORT = process.env.E2E_PORT || 3099;

let mongoServer;

async function seedData() {
  await Category.create({ name: 'General' });
  await Category.create({ name: 'Engineering' });
  await Category.create({ name: 'Communication' });
  await Category.create({ name: 'Business' });
  await Category.create({ name: 'People' });
  await Category.create({ name: 'Support functions' });

  const javaSkill = await Skill.create({
    name: 'Java',
    description: 'Java programming language',
    categoryName: 'Engineering',
    maxPoint: 5,
    pointDescription: ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'],
    parents: [],
    children: [],
    trainings: [
      { name: 'Java Basics', level: 1, shortDescription: 'Intro to Java', URL: 'https://example.com/java', goal: 'Learn Java', length: 10, language: 'en' }
    ],
    offers: []
  });

  const pythonSkill = await Skill.create({
    name: 'Python',
    description: 'Python programming language',
    categoryName: 'Engineering',
    maxPoint: 5,
    pointDescription: ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'],
    parents: [],
    children: [],
    trainings: [],
    offers: []
  });

  const commSkill = await Skill.create({
    name: 'Communication',
    description: 'Communication skills',
    categoryName: 'Communication',
    maxPoint: 3,
    pointDescription: ['Basic', 'Intermediate', 'Advanced'],
    parents: [],
    children: [],
    trainings: [],
    offers: []
  });

  await Tree.create({
    name: 'Software Engineering',
    description: 'Core software engineering skills',
    focusArea: 'Engineering',
    skillNames: ['Java', 'Python']
  });

  await Tree.create({
    name: 'Communication Skills',
    description: 'Core communication skills',
    focusArea: 'Communication',
    skillNames: ['Communication']
  });

  await User.create({
    username: 'e2e-admin',
    email: 'admin@e2e.test',
    hashData: security.hashPassword('AdminPass123'),
    admin: true,
    categories: [{ name: 'General', achievedPoint: 0, maxPoint: 0 }],
    skills: []
  });
}

async function startServer() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  await seedData();

  const server = http.createServer(app);

  return new Promise((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`E2E test server running on http://localhost:${PORT}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

if (require.main === module) {
  startServer().then(server => {
    process.on('SIGINT', async () => {
      server.close();
      await mongoose.disconnect();
      if (mongoServer) await mongoServer.stop();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      server.close();
      await mongoose.disconnect();
      if (mongoServer) await mongoServer.stop();
      process.exit(0);
    });
  }).catch(err => {
    console.error('Failed to start E2E server:', err);
    process.exit(1);
  });
}

module.exports = { startServer, seedData };
