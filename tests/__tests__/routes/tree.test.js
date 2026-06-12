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
