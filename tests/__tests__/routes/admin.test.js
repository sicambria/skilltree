const request = require('supertest');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const jwt = require('jsonwebtoken');

let app;
let adminToken;
let userToken;

beforeAll(async () => {
    await connectTestDB();
    app = require('../../../src/app');
    adminToken = jwt.sign({ username: 'admin', admin: true }, 'verysecret', { expiresIn: '1d' });
    userToken = jwt.sign({ username: 'user', admin: false }, 'verysecret', { expiresIn: '1d' });
});

afterAll(async () => {
    await disconnectTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

describe('Admin Routes Auth', () => {
    const User = require('../../../src/models/usermodel');

    it('should reject without token (403)', async () => {
        const res = await request(app).get('/admin/testAdmin');
        expect(res.status).toBe(403);
    });

    it('should reject non-admin token (403)', async () => {
        const res = await request(app)
            .get('/admin/testAdmin')
            .set('x-access-token', userToken);
        expect(res.status).toBe(403);
    });

    it('should allow admin token (200)', async () => {
        const res = await request(app)
            .get('/admin/testAdmin')
            .set('x-access-token', adminToken);
        expect(res.status).toBe(200);
    });
});

describe('Admin Routes - approveSkill', () => {
    const ApprovableSkill = require('../../../src/models/skillsforapprovemodel');
    const Skill = require('../../../src/models/skillmodel');

    it('should approve a new skill', async () => {
        await ApprovableSkill.create({
            username: 'testuser',
            name: 'NewSkill',
            categoryName: 'General',
            pointDescription: ['1', '2', '3', '4', '5'],
            maxPoint: 5,
            parents: [],
            children: [],
            trainings: []
        });
        const res = await request(app)
            .post('/admin/approveskill')
            .set('x-access-token', adminToken)
            .send({ name: 'NewSkill', categoryName: 'General', pointDescription: ['1', '2', '3', '4', '5'], maxPoint: 5 });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const globalSkill = await Skill.findOne({ name: 'NewSkill' });
        expect(globalSkill).not.toBeNull();
    });

    it('should reject when skill already exists', async () => {
        await Skill.create({ name: 'ExistingSkill', categoryName: 'General' });
        const res = await request(app)
            .post('/admin/approveskill')
            .set('x-access-token', adminToken)
            .send({ name: 'ExistingSkill' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('already exists');
    });
});

describe('Admin Routes - editTree', () => {
    const Tree = require('../../../src/models/treemodel');

    it('should edit a global tree', async () => {
        await Tree.create({ name: 'MyTree', description: 'Old', focusArea: 'OldArea', skillNames: [] });
        const res = await request(app)
            .post('/admin/edittree')
            .set('x-access-token', adminToken)
            .send({ name: 'MyTree', description: 'New', focusArea: 'NewArea', skills: [] });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return error when tree not found', async () => {
        const res = await request(app)
            .post('/admin/edittree')
            .set('x-access-token', adminToken)
            .send({ name: 'NonExistent', skills: [] });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
    });
});

describe('Admin Routes - editSkill', () => {
    const Skill = require('../../../src/models/skillmodel');
    const User = require('../../../src/models/usermodel');

    it('should edit a global skill', async () => {
        await Skill.create({ name: 'TargetSkill', parents: [], children: [], trainings: [] });
        const res = await request(app)
            .post('/admin/editskill')
            .set('x-access-token', adminToken)
            .send({
                name: 'TargetSkill',
                description: 'Updated',
                parents: [],
                children: [],
                trainings: []
            });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return error when skill not found', async () => {
        const res = await request(app)
            .post('/admin/editskill')
            .set('x-access-token', adminToken)
            .send({ name: 'NonExistent', parents: [], children: [], trainings: [] });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(false);
    });
});

describe('Admin Routes - approveTree', () => {
    const ApprovableTree = require('../../../src/models/treesforapprovemodel');
    const Tree = require('../../../src/models/treemodel');

    it('should approve a tree from ApprovableTree', async () => {
        await ApprovableTree.create({
            username: 'testuser',
            name: 'NewTree',
            focusArea: 'Dev',
            description: 'A tree',
            skillNames: []
        });
        const res = await request(app)
            .post('/admin/approvetree')
            .set('x-access-token', adminToken)
            .send({ name: 'NewTree', username: 'testuser' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const globalTree = await Tree.findOne({ name: 'NewTree' });
        expect(globalTree).not.toBeNull();
    });

    it('should succeed idempotently when no ApprovableTree exists', async () => {
        const res = await request(app)
            .post('/admin/approvetree')
            .set('x-access-token', adminToken)
            .send({ name: 'NonExistent', username: 'nobody' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('Admin Routes - approveTraining', () => {
    const Skill = require('../../../src/models/skillmodel');
    const ApprovableTraining = require('../../../src/models/trainingsforapprovemodel');

    it('should approve a training', async () => {
        await Skill.create({ name: 'TestSkill', trainings: [] });
        await ApprovableTraining.create({
            username: 'testuser',
            skillName: 'TestSkill',
            name: 'Training1',
            level: 1,
            shortDescription: 'Desc',
            URL: 'http://example.com',
            goal: 'Learn',
            length: '1',
            language: 'en'
        });
        const res = await request(app)
            .post('/admin/approvetraining')
            .set('x-access-token', adminToken)
            .send({ skillName: 'TestSkill', name: 'Training1', username: 'testuser' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should succeed when training does not exist', async () => {
        const res = await request(app)
            .post('/admin/approvetraining')
            .set('x-access-token', adminToken)
            .send({ skillName: 'NoSkill', name: 'NoTraining', username: 'nobody' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('Admin Routes - dropOffers', () => {
    const Skill = require('../../../src/models/skillmodel');

    it('should drop all offers', async () => {
        await Skill.create({ name: 'S1', offers: [{ username: 'u1' }] });
        const res = await request(app)
            .post('/admin/dropoffers')
            .set('x-access-token', adminToken);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const skill = await Skill.findOne({ name: 'S1' });
        expect(skill.offers).toEqual([]);
    });
});

describe('Admin Routes - export', () => {
    const Skill = require('../../../src/models/skillmodel');
    const Tree = require('../../../src/models/treemodel');

    it('should export all data', async () => {
        await Skill.create({ name: 'S1' });
        await Tree.create({ name: 'T1' });
        const res = await request(app)
            .get('/admin/export')
            .set('x-access-token', adminToken);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.skills).toBeDefined();
        expect(res.body.data.trees).toBeDefined();
    });

    it('should export filtered by type', async () => {
        await Skill.create({ name: 'S1' });
        await Tree.create({ name: 'T1' });
        const res = await request(app)
            .get('/admin/export?type=skills')
            .set('x-access-token', adminToken);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.skills).toBeDefined();
        expect(res.body.data.trees).toBeUndefined();
    });

    it('should export filtered by category', async () => {
        await Skill.create({ name: 'S1', categoryName: 'CatA' });
        await Skill.create({ name: 'S2', categoryName: 'CatB' });
        const res = await request(app)
            .get('/admin/export?type=skills&category=CatA')
            .set('x-access-token', adminToken);
        expect(res.status).toBe(200);
        expect(res.body.data.skills.length).toBe(1);
        expect(res.body.data.skills[0].name).toBe('S1');
    });
});

describe('Admin Routes - deleteUser', () => {
    const User = require('../../../src/models/usermodel');

    it('should allow admin to delete user', async () => {
        await User.create({ username: 'todelete' });
        const res = await request(app)
            .post('/admin/deleteUser')
            .set('x-access-token', adminToken)
            .send({ username: 'todelete' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('Admin Routes - setadmin', () => {
    const User = require('../../../src/models/usermodel');

    it('should allow admin to set admin status', async () => {
        await User.create({ username: 'target' });
        const res = await request(app)
            .post('/admin/setadmin')
            .set('x-access-token', adminToken)
            .send({ username: 'target', give: true });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('Admin Routes - wikidata import/export', () => {
    it('should reject wikidata import with no body', async () => {
        const res = await request(app)
            .post('/admin/wikidata/import')
            .set('x-access-token', adminToken);
        expect(res.status).toBe(400);
    });

    it('should succeed wikidata search with no query', async () => {
        const res = await request(app)
            .get('/admin/wikidata/search')
            .set('x-access-token', adminToken);
        expect(res.status).toBe(200);
    });

    it('should reject import without qids', async () => {
        const res = await request(app)
            .post('/admin/wikidata/import')
            .set('x-access-token', adminToken)
            .send({ qids: [] });
        expect(res.status).toBe(400);
    });
});

describe('Admin Routes - importData', () => {
    it('should import data', async () => {
        const res = await request(app)
            .post('/admin/import')
            .set('x-access-token', adminToken)
            .send({ skills: [{ name: 'ImportedSkill', categoryName: 'General' }] });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
