const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const LearningPlan = require('../../../src/models/learningplanmodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('planController', () => {
    let planController;
    let req, res;

    beforeEach(() => {
        planController = require('../../../src/controllers/planController');
        req = { body: {}, params: {}, decoded: { username: 'testuser' } };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('createPlan', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
        });

        it('should create a plan with default title', async () => {
            await planController.createPlan(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.plan.title).toBe("testuser's Learning Plan");
            expect(data.plan.horizons.shortTerm).toBeDefined();
            expect(data.plan.horizons.midTerm).toBeDefined();
            expect(data.plan.horizons.longTerm).toBeDefined();
        });

        it('should create a plan with custom title', async () => {
            req.body = { title: 'My Custom Plan', description: 'A plan' };

            await planController.createPlan(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.plan.title).toBe('My Custom Plan');
            expect(data.plan.description).toBe('A plan');
        });

        it('should reject duplicate plan', async () => {
            await LearningPlan.create({ username: 'testuser', horizons: {} });

            await planController.createPlan(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Plan already exists.'
            });
        });

        it('should return error when user not found', async () => {
            req.decoded = { username: 'nonexistent' };

            await planController.createPlan(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));

            await planController.createPlan(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('getPlan', () => {
        beforeEach(async () => {
            await LearningPlan.create({
                username: 'testuser',
                title: 'Test Plan',
                horizons: {}
            });
        });

        it('should return the plan', async () => {
            await planController.getPlan(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.username).toBe('testuser');
            expect(data.title).toBe('Test Plan');
        });

        it('should return error when no plan found', async () => {
            req.decoded = { username: 'noplan' };

            await planController.getPlan(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No plan found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(LearningPlan, 'findOne').mockRejectedValue(new Error('DB error'));

            await planController.getPlan(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('updateHorizon', () => {
        let plan;

        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            plan = await LearningPlan.create({
                username: 'testuser',
                title: 'Plan',
                horizons: {
                    shortTerm: { targetDate: new Date(), skills: [] },
                    midTerm: { targetDate: new Date(), skills: [] },
                    longTerm: { targetDate: new Date(), skills: [] }
                }
            });
        });

        it('should update horizon skills', async () => {
            req.params = { horizon: 'shortTerm' };
            req.body = {
                skills: [{
                    skillName: 'SkillA',
                    targetAssessment: { autonomy: 3, complexity: 2, influence: 2, knowledge: 3, business_skills: 2 }
                }]
            };

            await planController.updateHorizon(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.plan.horizons.shortTerm.skills.length).toBe(1);
            expect(data.plan.horizons.shortTerm.skills[0].skillName).toBe('SkillA');
            expect(data.plan.horizons.shortTerm.skills[0].targetAssessment.autonomy).toBe(3);
        });

        it('should reject invalid horizon', async () => {
            req.params = { horizon: 'invalid' };

            await planController.updateHorizon(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid horizon. Use shortTerm, midTerm, or longTerm.'
            });
        });

        it('should return error when no plan found', async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'noplan',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            req.decoded = { username: 'noplan' };
            req.params = { horizon: 'shortTerm' };
            req.body = { skills: [] };

            await planController.updateHorizon(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No plan found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(LearningPlan, 'findOne').mockRejectedValue(new Error('DB error'));
            req.params = { horizon: 'shortTerm' };
            req.body = { skills: [] };

            await planController.updateHorizon(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('classifyTransition', () => {
        let plan;

        beforeEach(async () => {
            plan = await LearningPlan.create({
                username: 'testuser',
                title: 'Plan',
                horizons: {
                    shortTerm: {
                        targetDate: new Date(),
                        skills: [{ skillName: 'SkillA', targetAssessment: { autonomy: 3, complexity: 2, influence: 2, knowledge: 3, business_skills: 2 } }]
                    },
                    midTerm: { targetDate: new Date(), skills: [] },
                    longTerm: { targetDate: new Date(), skills: [] }
                }
            });
        });

        it('should classify shortTerm as broaden (no previous)', async () => {
            req.params = { horizon: 'shortTerm' };

            await planController.classifyTransition(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.transitionType).toBe('broaden');
        });

        it('should classify midTerm as deepen when levels increase', async () => {
            plan.horizons.midTerm.skills = [{ skillName: 'SkillA', targetAssessment: { autonomy: 5, complexity: 4, influence: 4, knowledge: 5, business_skills: 4 } }];
            await plan.save();

            req.params = { horizon: 'midTerm' };

            await planController.classifyTransition(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.transitionType).toBe('deepen');
        });

        it('should classify as pivot when overlap is low', async () => {
            plan.horizons.midTerm.skills = [
                { skillName: 'SkillX', targetAssessment: { autonomy: 3, complexity: 2, influence: 2, knowledge: 3, business_skills: 2 } },
                { skillName: 'SkillY', targetAssessment: { autonomy: 3, complexity: 2, influence: 2, knowledge: 3, business_skills: 2 } }
            ];
            await plan.save();

            req.params = { horizon: 'midTerm' };

            await planController.classifyTransition(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.transitionType).toBe('pivot');
        });

        it('should reject invalid horizon', async () => {
            req.params = { horizon: 'invalid' };

            await planController.classifyTransition(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid horizon.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(LearningPlan, 'findOne').mockRejectedValue(new Error('DB error'));
            req.params = { horizon: 'shortTerm' };

            await planController.classifyTransition(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('getPlanProgress', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [{
                    name: 'SkillA',
                    achievedPoint: 2,
                    parents: [],
                    children: [],
                    trainings: [],
                    assessment: { autonomy: 2, complexity: 2, influence: 1, knowledge: 2, business_skills: 1, effectiveLevel: 1 }
                }],
                trees: []
            });
            await LearningPlan.create({
                username: 'testuser',
                title: 'Plan',
                horizons: {
                    shortTerm: {
                        targetDate: new Date(),
                        skills: [{ skillName: 'SkillA', targetAssessment: { autonomy: 4, complexity: 3, influence: 3, knowledge: 4, business_skills: 3 } }]
                    },
                    midTerm: { targetDate: new Date(), skills: [] },
                    longTerm: { targetDate: new Date(), skills: [] }
                }
            });
        });

        it('should return per-factor progress comparison', async () => {
            await planController.getPlanProgress(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.username).toBe('testuser');
            expect(data.progress.shortTerm).toBeDefined();
            expect(data.progress.shortTerm.length).toBe(1);
            expect(data.progress.shortTerm[0].skillName).toBe('SkillA');
            expect(data.progress.shortTerm[0].currentEffectiveLevel).toBe(1);
            expect(data.progress.shortTerm[0].targetEffectiveLevel).toBe(3);
        });

        it('should fall back to achievedPoint when assessment is missing', async () => {
            const user = await User.findOne({ username: 'testuser' });
            user.skills[0].assessment = undefined;
            await user.save();

            await planController.getPlanProgress(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.progress.shortTerm[0].current.achievedPoint).toBe(2);
            expect(data.progress.shortTerm[0].currentEffectiveLevel).toBe(2);
        });

        it('should return error when user not found', async () => {
            req.decoded = { username: 'nonexistent' };

            await planController.getPlanProgress(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should return error when no plan found', async () => {
            await LearningPlan.deleteMany({});

            await planController.getPlanProgress(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No plan found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));

            await planController.getPlanProgress(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });
});
