const request = require('supertest');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const jwt = require('jsonwebtoken');

let app;
let validToken;

beforeAll(async () => {
    await connectTestDB();
    app = require('../../../src/app');
    validToken = jwt.sign({ username: 'testuser' }, 'verysecret', { expiresIn: '1d' });
});

afterAll(async () => {
    await disconnectTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

describe('Protected Tree Routes', () => {
    const User = require('../../../src/models/usermodel');
    const Tree = require('../../../src/models/treemodel');
    const Skill = require('../../../src/models/skillmodel');
    const security = require('../../../src/utils/security');

    beforeEach(async () => {
        await User.create({
            username: 'testuser',
            hashData: security.hashPassword('pw'),
            skills: [],
            trees: []
        });
    });

    describe('POST /protected/searchTreesByName', () => {
        it('should search trees', async () => {
            await Tree.create({ name: 'MyTree' });
            const res = await request(app)
                .post('/protected/searchTreesByName')
                .set('x-access-token', validToken)
                .send({ value: 'MyTree' });
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].name).toBe('MyTree');
        });
    });

    describe('POST /protected/getPublicTreeData', () => {
        it('should get public tree data', async () => {
            await Tree.create({ name: 'PublicTree', focusArea: 'Dev' });
            const res = await request(app)
                .post('/protected/getPublicTreeData')
                .set('x-access-token', validToken)
                .send({ value: 'Public' });
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });
    });

    describe('POST /protected/addTreeToUser', () => {
        it('should add a tree to user', async () => {
            await Skill.create({ name: 'SkillA' });
            await Tree.create({ name: 'NewTree', skillNames: ['SkillA'] });
            const res = await request(app)
                .post('/protected/addTreeToUser')
                .set('x-access-token', validToken)
                .send({ value: 'NewTree' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return notfound for missing tree', async () => {
            const res = await request(app)
                .post('/protected/addTreeToUser')
                .set('x-access-token', validToken)
                .send({ value: 'NonExistent' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('notfound');
        });
    });

    describe('POST /protected/newtree', () => {
        it('should create a new tree', async () => {
            const res = await request(app)
                .post('/protected/newtree')
                .set('x-access-token', validToken)
                .send({
                    name: 'BrandNewTree',
                    focusArea: 'Dev',
                    description: 'My new tree',
                    skills: [{ name: 'SkillX', parents: [], children: [] }]
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject duplicate tree name', async () => {
            const user = await User.findOne({ username: 'testuser' });
            user.trees.push({ name: 'ExistingTree', skillNames: [] });
            await user.save();

            const res = await request(app)
                .post('/protected/newtree')
                .set('x-access-token', validToken)
                .send({ name: 'ExistingTree', skills: [] });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('exists');
        });
    });

    describe('POST /protected/editmytree', () => {
        it('should edit an existing tree', async () => {
            const user = await User.findOne({ username: 'testuser' });
            user.trees.push({ name: 'MyTree', skillNames: [] });
            await user.save();

            const res = await request(app)
                .post('/protected/editmytree')
                .set('x-access-token', validToken)
                .send({ name: 'MyTree', skills: [{ name: 'SkillX' }], focusArea: 'Dev', description: 'Updated' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return error for non-existent tree', async () => {
            const res = await request(app)
                .post('/protected/editmytree')
                .set('x-access-token', validToken)
                .send({ name: 'NonExistent', skills: [] });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /protected/deletemytree', () => {
        it('should delete an existing tree', async () => {
            const user = await User.findOne({ username: 'testuser' });
            user.trees.push({ name: 'ToDelete', skillNames: [] });
            await user.save();

            const res = await request(app)
                .post('/protected/deletemytree')
                .set('x-access-token', validToken)
                .send({ name: 'ToDelete' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return error for non-existent tree', async () => {
            const res = await request(app)
                .post('/protected/deletemytree')
                .set('x-access-token', validToken)
                .send({ name: 'NonExistent' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /protected/gettree', () => {
        it('should get tree details', async () => {
            await Tree.create({ name: 'MyTree', focusArea: 'Dev', skillNames: [] });
            const res = await request(app)
                .post('/protected/gettree')
                .set('x-access-token', validToken)
                .send({ name: 'MyTree' });
            expect(res.status).toBe(200);
            expect(res.body.name).toBe('MyTree');
        });

        it('should return null for unknown tree', async () => {
            const res = await request(app)
                .post('/protected/gettree')
                .set('x-access-token', validToken)
                .send({ name: 'NonExistent' });
            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });
    });

    describe('GET /graph/data', () => {
        it('should return graph data', async () => {
            const res = await request(app)
                .get('/graph/data')
                .set('x-access-token', validToken);
            expect(res.status).toBe(200);
            expect(res.body.nodes).toBeDefined();
        });
    });
});
