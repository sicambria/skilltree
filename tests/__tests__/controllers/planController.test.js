const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const LearningPlan = require('../../../src/models/learningplanmodel');
const Skill = require('../../../src/models/skillmodel');

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

    describe('getSkillCatalog', () => {
        beforeEach(async () => {
            await Skill.create([
                { name: 'Empathy', categoryName: 'Emotional Intelligence', maxPoint: 5, reusability: 'transversal', skillId: 'skilltree:skill:empathy', parents: [], children: [], trainings: [], relationships: [] },
                { name: 'Active Listening', categoryName: 'Human Skills', maxPoint: 5, reusability: 'transversal', skillId: 'skilltree:skill:active-listening', parents: [], children: [], trainings: [], relationships: [] },
                { name: 'Critical Thinking', categoryName: 'Cognitive Skills', maxPoint: 5, reusability: 'transversal', skillId: 'skilltree:skill:critical-thinking', parents: [], children: [], trainings: [], relationships: [] },
                { name: 'HTML', categoryName: 'Digital competence', maxPoint: 5, reusability: 'transversal', skillId: 'skilltree:skill:html', parents: [], children: [], trainings: [], relationships: [] }
            ]);
        });

        it('should return skills grouped by curated categories', async () => {
            await planController.getSkillCatalog(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.catalog['Human Skills'].length).toBe(1);
            expect(data.catalog['Emotional Intelligence'].length).toBe(1);
            expect(data.catalog['Cognitive Skills'].length).toBe(1);
            expect(data.catalog['Human Skills'][0].name).toBe('Active Listening');
        });

        it('should exclude skills not in curated categories', async () => {
            await planController.getSkillCatalog(req, res);

            const data = res.json.mock.calls[0][0];
            const allSkills = Object.values(data.catalog).flat();
            expect(allSkills.length).toBe(3);
            expect(allSkills.every(s => s.name !== 'HTML')).toBe(true);
        });

        it('should handle server error', async () => {
            jest.spyOn(Skill, 'find').mockRejectedValue(new Error('DB error'));

            await planController.getSkillCatalog(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('createRelationalPlan', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            await User.create({
                username: 'partner',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
        });

        it('should create a relational plan with two participants', async () => {
            req.body = { partnerUsername: 'partner' };

            await planController.createRelationalPlan(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.plan.type).toBe('relational');
            expect(data.plan.participants).toEqual(['testuser', 'partner']);
        });

        it('should reject when partner not found', async () => {
            req.body = { partnerUsername: 'nonexistent' };

            await planController.createRelationalPlan(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Partner not found.'
            });
        });

        it('should reject creating plan with yourself', async () => {
            req.body = { partnerUsername: 'testuser' };

            await planController.createRelationalPlan(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Cannot create relational plan with yourself.'
            });
        });

        it('should reject when partner username missing', async () => {
            req.body = {};

            await planController.createRelationalPlan(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Partner username required.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));
            req.body = { partnerUsername: 'partner' };

            await planController.createRelationalPlan(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('updateWizardStep', () => {
        beforeEach(async () => {
            await LearningPlan.create({
                username: 'testuser',
                title: 'Plan',
                horizons: {}
            });
        });

        it('should persist wizard step', async () => {
            req.body = { step: 3 };

            await planController.updateWizardStep(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.wizardStep).toBe(3);

            const plan = await LearningPlan.findOne({ username: 'testuser' });
            expect(plan.wizardStep).toBe(3);
        });

        it('should reject step > 5', async () => {
            req.body = { step: 6 };

            await planController.updateWizardStep(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid step. Must be 0-5.'
            });
        });

        it('should reject negative step', async () => {
            req.body = { step: -1 };

            await planController.updateWizardStep(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid step. Must be 0-5.'
            });
        });

        it('should return error when no plan found', async () => {
            req.decoded = { username: 'noplan' };
            req.body = { step: 1 };

            await planController.updateWizardStep(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No plan found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(LearningPlan, 'findOne').mockRejectedValue(new Error('DB error'));
            req.body = { step: 1 };

            await planController.updateWizardStep(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('relationalInvite', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            await LearningPlan.create({
                username: 'testuser',
                title: 'Relational Plan',
                type: 'relational',
                participants: ['testuser'],
                horizons: {}
            });
        });

        it('should generate an invite code', async () => {
            await planController.relationalInvite(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.inviteCode).toBeDefined();
            expect(data.inviteCode.length).toBe(6);
        });

        it('should reject invite on personal plan', async () => {
            await LearningPlan.deleteMany({});
            await LearningPlan.create({
                username: 'testuser',
                title: 'Personal Plan',
                type: 'personal',
                horizons: {}
            });

            await planController.relationalInvite(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not a relational plan.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(LearningPlan, 'findOne').mockRejectedValue(new Error('DB error'));

            await planController.relationalInvite(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('joinRelationalPlan', () => {
        let plan;

        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            await User.create({
                username: 'joiner',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            plan = await LearningPlan.create({
                username: 'testuser',
                title: 'Relational Plan',
                type: 'relational',
                participants: ['testuser'],
                inviteCode: 'abc123',
                horizons: {}
            });
        });

        it('should add participant via valid invite code', async () => {
            req.decoded = { username: 'joiner' };
            req.body = { inviteCode: 'abc123' };

            await planController.joinRelationalPlan(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.plan.participants).toContain('joiner');
        });

        it('should reject invalid invite code', async () => {
            req.body = { inviteCode: 'invalid' };

            await planController.joinRelationalPlan(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid invite code.'
            });
        });

        it('should reject when invite code missing', async () => {
            req.body = {};

            await planController.joinRelationalPlan(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invite code required.'
            });
        });

        it('should reject when plan already has 2 participants', async () => {
            plan.participants = ['testuser', 'other'];
            await plan.save();

            req.decoded = { username: 'joiner' };
            req.body = { inviteCode: 'abc123' };

            await planController.joinRelationalPlan(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Plan already has 2 participants.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(LearningPlan, 'findOne').mockRejectedValue(new Error('DB error'));
            req.body = { inviteCode: 'abc123' };

            await planController.joinRelationalPlan(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('getRelationalProgress', () => {
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
            await User.create({
                username: 'partner',
                hashData: security.hashPassword('pw'),
                skills: [{
                    name: 'SkillA',
                    achievedPoint: 4,
                    parents: [],
                    children: [],
                    trainings: [],
                    assessment: { autonomy: 4, complexity: 3, influence: 3, knowledge: 4, business_skills: 3, effectiveLevel: 3 }
                }],
                trees: []
            });
            await LearningPlan.create({
                username: 'testuser',
                title: 'Relational Plan',
                type: 'relational',
                participants: ['testuser', 'partner'],
                horizons: {
                    shortTerm: {
                        targetDate: new Date(),
                        skills: [{ skillName: 'SkillA', targetAssessment: { autonomy: 5, complexity: 4, influence: 4, knowledge: 5, business_skills: 4 } }]
                    },
                    midTerm: { targetDate: new Date(), skills: [] },
                    longTerm: { targetDate: new Date(), skills: [] }
                }
            });
        });

        it('should return progress for both participants', async () => {
            await planController.getRelationalProgress(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.participants).toEqual(['testuser', 'partner']);
            expect(data.progress.testuser).toBeDefined();
            expect(data.progress.partner).toBeDefined();
            expect(data.progress.testuser.shortTerm[0].currentEffectiveLevel).toBe(1);
            expect(data.progress.partner.shortTerm[0].currentEffectiveLevel).toBe(3);
        });

        it('should return error when no plan found', async () => {
            req.decoded = { username: 'noplan' };

            await planController.getRelationalProgress(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No plan found.'
            });
        });

        it('should return error for personal plan', async () => {
            await LearningPlan.deleteMany({});
            await LearningPlan.create({
                username: 'testuser',
                title: 'Personal',
                type: 'personal',
                horizons: {}
            });

            await planController.getRelationalProgress(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not a relational plan.'
            });
        });
    });
});
