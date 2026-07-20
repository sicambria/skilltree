const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const Skill = require('../../../src/models/skillmodel');
const Tree = require('../../../src/models/treemodel');
const ApprovableSkill = require('../../../src/models/skillsforapprovemodel');
const ApprovableTraining = require('../../../src/models/trainingsforapprovemodel');
const ApprovableTree = require('../../../src/models/treesforapprovemodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('adminController', () => {
    let adminController;
    let req, res;

    beforeEach(() => {
        adminController = require('../../../src/controllers/adminController');
        req = { body: {}, query: {} };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('testAdmin', () => {
        it('should return success true', () => {
            adminController.testAdmin(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });
    });

    describe('approveSkill', () => {
        it('should approve a skill and create global skill', async () => {
            req.body = {
                name: 'NewGlobalSkill',
                categoryName: 'General',
                skillIcon: 'icon.png',
                description: 'Desc',
                descriptionWikipediaURL: '',
                pointDescription: ['Novice'],
                maxPoint: 5,
                parent: [],
                minPoint: 0,
                recommended: false,
                training: { name: 'Training1', level: 1, shortDescription: 'Intro', URL: '', goal: '', language: 'en' },
                traininglength: 10
            };

            await adminController.approveSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ message: 'Succes', success: true });

            const skill = await Skill.findOne({ name: 'NewGlobalSkill' });
            expect(skill).not.toBeNull();
        });

        it('should reject already existing skill', async () => {
            await Skill.create({ name: 'ExistingSkill' });
            req.body = { name: 'ExistingSkill' };

            await adminController.approveSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Skill already exists'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(Skill.prototype, 'save').mockRejectedValue(new Error('Save error'));
            req.body = { name: 'ErrorSkill', training: {} };

            await adminController.approveSkill(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });

        it('should approve skill and link parent children from dependency', async () => {
            await Skill.create({ name: 'RootParent', parents: [] });
            await ApprovableSkill.create({
                username: 'u1', name: 'DepSkill', categoryName: 'General',
                maxPoint: 3, parents: ['RootParent']
            });

            req.body = {
                name: 'NewSkill', categoryName: 'General', skillIcon: '',
                description: '', descriptionWikipediaURL: '', pointDescription: [],
                maxPoint: 5, parent: [], minPoint: 0, recommended: false,
                training: { name: '', level: 1, shortDescription: '', URL: '', goal: '', language: 'en' },
                traininglength: 0, parents: []
            };

            await adminController.approveSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ message: 'Succes', success: true });
        });

        it('should handle trainings array directly (short-circuit || on line 36)', async () => {
            req.body = {
                name: 'SkillWithTrainingsArray',
                categoryName: 'General',
                trainings: [{ name: 'DirectTraining', level: 1, shortDescription: 'S', URL: '', goal: '', length: 10, language: 'en' }],
                parent: [],
                minPoint: 0,
                recommended: false
            };

            await adminController.approveSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ message: 'Succes', success: true });
            const skill = await Skill.findOne({ name: 'SkillWithTrainingsArray' });
            expect(skill.trainings.length).toBe(1);
            expect(skill.trainings[0].name).toBe('DirectTraining');
        });

        it('should handle neither trainings nor training (empty array fallback)', async () => {
            req.body = {
                name: 'SkillNoTraining',
                categoryName: 'General',
                parent: [],
                minPoint: 0,
                recommended: false
            };

            await adminController.approveSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ message: 'Succes', success: true });
            const skill = await Skill.findOne({ name: 'SkillNoTraining' });
            expect(skill.trainings).toEqual([]);
        });

        it('should process dependency chain where lastdependency has parents', async () => {
            await Skill.create({ name: 'ExistingParent', parents: [], children: [] });
            await ApprovableSkill.create({
                username: 'u1',
                name: 'DepSkill',
                categoryName: 'General',
                maxPoint: 3,
                parents: ['ExistingParent']
            });

            req.body = {
                name: 'NewSkill',
                categoryName: 'General',
                skillIcon: '',
                description: '',
                descriptionWikipediaURL: '',
                pointDescription: [],
                maxPoint: 5,
                parent: ['DepSkill'],
                parents: ['DepSkill'],
                minPoint: 0,
                recommended: false,
                training: { name: '', level: 1, shortDescription: '', URL: '', goal: '', language: 'en' },
                traininglength: 0
            };

            await adminController.approveSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ message: 'Succes', success: true });
        });

        it('should handle dependency item with trainings array (short-circuit || on line 56)', async () => {
            await Skill.create({ name: 'RootForLine56', parents: [], children: [] });
            await ApprovableSkill.create({
                username: 'u1',
                name: 'DepWithTrainings',
                categoryName: 'General',
                maxPoint: 3,
                parents: ['RootForLine56'],
                trainings: [{ name: 'DepTraining', level: 1, shortDescription: 'S', URL: '', goal: '', length: 10, language: 'en' }]
            });

            req.body = {
                name: 'NewSkill56a',
                categoryName: 'General',
                skillIcon: '',
                description: '',
                descriptionWikipediaURL: '',
                pointDescription: [],
                maxPoint: 5,
                parent: ['DepWithTrainings'],
                parents: ['DepWithTrainings'],
                minPoint: 0,
                recommended: false,
                traininglength: 0
            };

            await adminController.approveSkill(req, res);
            expect(res.json).toHaveBeenCalledWith({ message: 'Succes', success: true });

            const createdDep = await Skill.findOne({ name: 'DepWithTrainings' });
            expect(createdDep.trainings.length).toBe(1);
        });

        // Note: line 56 ternary `dependency[i].training ? [dependency[i].training] : []`
        // is dead code — Mongoose 8 does not expose non-schema fields via dot access
        // on hydrated documents. The `training` (singular) fallback can never be reached.
    });

    describe('editTree', () => {
        it('should edit existing global tree and sync to users', async () => {
            const tree = await Tree.create({
                name: 'MyTree',
                focusArea: 'Old',
                description: 'Old desc',
                skillNames: ['A']
            });

            await Skill.create({ name: 'A', categoryName: 'General', parents: [], children: [], trainings: [] });

            const user = await User.create({
                username: 'testuser',
                trees: [{ name: 'MyTree', skillNames: ['A'], focusArea: 'Old', description: 'Old desc' }],
                skills: [{ name: 'A', parents: [], children: [], trainings: [] }]
            });

            req.body = {
                name: 'MyTree',
                focusArea: 'NewArea',
                description: 'New desc',
                skills: [{ name: 'A', categoryName: 'General', parents: [], children: [], trainings: [] }]
            };

            await adminController.editTree(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const updatedTree = await Tree.findOne({ name: 'MyTree' });
            expect(updatedTree.focusArea).toBe('NewArea');
        });

        it('should return error for non-existent tree', async () => {
            req.body = { name: 'NonExistent', skills: [] };

            await adminController.editTree(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Tree not found'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(Tree, 'findOne').mockRejectedValue(new Error('DB error'));
            req.body = { name: 'MyTree', focusArea: 'A', description: 'D', skills: [] };

            await adminController.editTree(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });
    });

    describe('editSkill', () => {
        it('should edit existing skill', async () => {
            const skill = await Skill.create({
                name: 'OldName',
                categoryName: 'General',
                parents: [],
                children: [],
                trainings: [],
                achievedPoint: 2,
                maxPoint: 5
            });

            req.body = {
                name: 'OldName',
                description: 'Updated',
                descriptionWikipediaURL: '',
                skillIcon: '',
                categoryName: 'NewCat',
                maxPoint: 10,
                pointDescription: ['A', 'B'],
                parents: [],
                children: [],
                trainings: []
            };

            await adminController.editSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('should return error for non-existent skill', async () => {
            req.body = { name: 'NonExistent' };

            await adminController.editSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Skill not found'
            });
        });

        it('should add child skill to user when editing skill with new child', async () => {
            await Skill.create({ name: 'ParentExisting' });
            await Skill.create({ name: 'ChildFromDB', parents: ['ParentExisting'] });
            await Skill.create({
                name: 'EditMe',
                categoryName: 'General',
                parents: ['ParentExisting'],
                children: [],
                trainings: [],
                achievedPoint: 1,
                maxPoint: 5
            });
            const user = await User.create({
                username: 'testuser',
                skills: [{ name: 'EditMe', parents: ['ParentExisting'], children: [], trainings: [], achievedPoint: 1 }]
            });

            req.body = {
                name: 'EditMe',
                description: 'Updated',
                descriptionWikipediaURL: '',
                skillIcon: '',
                categoryName: 'General',
                maxPoint: 5,
                pointDescription: [],
                parents: [{ name: 'ParentExisting', minPoint: 1, recommended: false }],
                children: [{ name: 'ChildFromDB', minPoint: 2, recommended: false }],
                trainings: []
            };

            await adminController.editSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const updatedUser = await User.findOne({ username: 'testuser' });
            const childInUser = updatedUser.skills.find(s => s.name === 'ChildFromDB');
            expect(childInUser).toBeDefined();
            expect(childInUser.parents).toContain('EditMe');
        });

        it('should update user skills when editing skill', async () => {
            await Skill.create({ name: 'SkillToEdit', parents: [], children: [], trainings: [], achievedPoint: 1, maxPoint: 5 });
            const user = await User.create({
                username: 'testuser',
                skills: [{ name: 'SkillToEdit', parents: [], children: [], trainings: [], achievedPoint: 2 }]
            });

            req.body = {
                name: 'SkillToEdit',
                description: 'Updated',
                descriptionWikipediaURL: '',
                skillIcon: '',
                categoryName: 'Cat',
                maxPoint: 5,
                pointDescription: [],
                parents: [],
                children: [],
                trainings: []
            };

            await adminController.editSkill(req, res);

            const updatedUser = await User.findOne({ username: 'testuser' });
            const us = updatedUser.skills.find(s => s.name === 'SkillToEdit');
            expect(us.description).toBe('Updated');
        });

        it('should edit skill with parents, children and clamp achievedPoint', async () => {
            await Skill.create({ name: 'ParentSkill' });
            await Skill.create({ name: 'ChildSkill', parents: ['EditMe'] });
            const skill = await Skill.create({
                name: 'EditMe',
                categoryName: 'General',
                parents: ['ParentSkill'],
                children: [{ name: 'ChildSkill', minPoint: 1, recommended: true }],
                trainings: [],
                achievedPoint: 8,
                maxPoint: 5
            });

            const user = await User.create({
                username: 'testuser',
                skills: [{
                    name: 'EditMe', parents: ['ParentSkill'], children: [{ name: 'ChildSkill', minPoint: 1, recommended: true }], trainings: [], achievedPoint: 8
                }, {
                    name: 'ChildSkill', parents: ['EditMe'], children: [], trainings: []
                }],
                trees: [{ name: 'MyTree', skillNames: ['EditMe', 'ChildSkill'], focusArea: 'Dev', description: 'Tree' }]
            });

            req.body = {
                name: 'EditMe',
                description: 'Edited',
                descriptionWikipediaURL: '',
                skillIcon: '',
                categoryName: 'General',
                maxPoint: 3,
                pointDescription: ['A', 'B'],
                parents: [{ name: 'ParentSkill', minPoint: 1, recommended: true }],
                children: [{ name: 'ChildSkill', minPoint: 2, recommended: false }],
                trainings: [{ name: 'Training', level: 1, shortDescription: 'S', URL: '', goal: '', length: '', language: 'en' }]
            };

            await adminController.editSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const updatedUser = await User.findOne({ username: 'testuser' });
            const us = updatedUser.skills.find(s => s.name === 'EditMe');
            expect(us.description).toBe('Edited');
            expect(us.achievedPoint).toBe(3);
        });

        it('should skip relinking when parent/child not in global Skills DB (lines 119-128 falsy)', async () => {
            const skill = await Skill.create({
                name: 'OrphanSkill', categoryName: 'General', parents: ['NonExistentParent'],
                children: [{ name: 'NonExistentChild', minPoint: 1, recommended: false }],
                trainings: [], achievedPoint: 1, maxPoint: 5
            });

            req.body = {
                name: 'OrphanSkill', description: 'Updated', descriptionWikipediaURL: '', skillIcon: '',
                categoryName: 'General', maxPoint: 5, pointDescription: [],
                parents: [{ name: 'NewParent', minPoint: 1, recommended: false }],
                children: [], trainings: []
            };

            await adminController.editSkill(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('should skip user relinking when parent/child not in user skills (lines 158-167 falsy)', async () => {
            await Skill.create({ name: 'GlobalParent' });
            await Skill.create({ name: 'NewChild', parents: [], children: [], trainings: [], maxPoint: 5 });
            await Skill.create({ name: 'EditMeV2', parents: ['GlobalParent'], children: [], trainings: [], achievedPoint: 2, maxPoint: 5 });
            const user = await User.create({
                username: 'testuser',
                skills: [{
                    name: 'EditMeV2', parents: ['GlobalParent'],
                    children: [{ name: 'ExistingChild', minPoint: 1, recommended: false }],
                    trainings: [], achievedPoint: 2
                }, {
                    name: 'ExistingChild', parents: ['EditMeV2'], children: [], trainings: []
                }]
            });

            req.body = {
                name: 'EditMeV2', description: 'Updated', descriptionWikipediaURL: '', skillIcon: '',
                categoryName: 'General', maxPoint: 5, pointDescription: [],
                parents: [{ name: 'GlobalParent', minPoint: 1, recommended: false }],
                children: [{ name: 'NewChild', minPoint: 2, recommended: false }],
                trainings: []
            };

            await adminController.editSkill(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true });

            const updatedUser = await User.findOne({ username: 'testuser' });
            const childInUser = updatedUser.skills.find(s => s.name === 'NewChild');
            expect(childInUser).toBeDefined();
        });

        it('should handle tree skillNames push in editSkill when child tree lacks parent name (line 184)', async () => {
            await Skill.create({ name: 'ParentA' });
            await Skill.create({ name: 'ParentB' });
            await Skill.create({ name: 'ChildX', parents: ['ParentA'] });
            await Skill.create({ name: 'EditMeTree', parents: ['ParentA', 'ParentB'], children: [{ name: 'ChildX', minPoint: 1, recommended: false }], trainings: [], achievedPoint: 1, maxPoint: 5 });

            const user = await User.create({
                username: 'testuser',
                skills: [
                    { name: 'EditMeTree', parents: ['ParentA', 'ParentB'], children: [{ name: 'ChildX', minPoint: 1, recommended: false }], trainings: [], achievedPoint: 1 },
                    { name: 'ChildX', parents: ['EditMeTree'], children: [], trainings: [] }
                ],
                trees: [
                    { name: 'TreeOnlyHasChild', skillNames: ['ChildX'], focusArea: 'Dev', description: 'Tree' }
                ]
            });

            req.body = {
                name: 'EditMeTree', description: 'Updated', descriptionWikipediaURL: '', skillIcon: '',
                categoryName: 'General', maxPoint: 5, pointDescription: [],
                parents: [{ name: 'ParentA', minPoint: 1, recommended: false }, { name: 'ParentB', minPoint: 1, recommended: false }],
                children: [{ name: 'ChildX', minPoint: 2, recommended: false }],
                trainings: []
            };

            await adminController.editSkill(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('should handle server error', async () => {
            jest.spyOn(require('../../../src/utils/skillUtils'), 'findSkillByName').mockRejectedValue(new Error('DB error'));
            req.body = { name: 'AnySkill' };

            await adminController.editSkill(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });
    });

    describe('approveTree', () => {
        it('should approve and create global tree from approvable', async () => {
            await ApprovableTree.create({
                name: 'ApprTree',
                username: 'u1',
                focusArea: 'Dev',
                description: 'Desc',
                skillNames: ['A', 'B']
            });

            req.body = { name: 'ApprTree', username: 'u1' };

            await adminController.approveTree(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const globalTree = await Tree.findOne({ name: 'ApprTree' });
            expect(globalTree).not.toBeNull();
            const apprTrees = await ApprovableTree.find({ name: 'ApprTree' });
            expect(apprTrees.length).toBe(0);
        });

        it('should skip if global tree already exists', async () => {
            await Tree.create({ name: 'ExistingTree' });

            req.body = { name: 'ExistingTree', username: 'u1' };

            await adminController.approveTree(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('should handle server error', async () => {
            jest.spyOn(Tree, 'findOne').mockRejectedValue(new Error('DB error'));
            req.body = { name: 'AnyTree', username: 'u1' };

            await adminController.approveTree(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });

        it('should skip when no global tree and no approvable tree (line 219 falsy branch)', async () => {
            req.body = { name: 'BrandNewTree', username: 'u1' };

            await adminController.approveTree(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });
        });
    });

    describe('approveTraining', () => {
        it('should approve training and add to global skill', async () => {
            const skill = await Skill.create({ name: 'Skill1', trainings: [] });
            await ApprovableTraining.create({
                username: 'u1',
                skillName: 'Skill1',
                name: 'Course1',
                level: 1,
                shortDescription: 'Intro',
                URL: 'http://example.com',
                goal: 'Learn',
                length: 10,
                language: 'en'
            });

            req.body = { skillName: 'Skill1', username: 'u1', name: 'Course1' };

            await adminController.approveTraining(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const updatedSkill = await Skill.findOne({ name: 'Skill1' });
            expect(updatedSkill.trainings.length).toBe(1);
        });

        it('should skip if training already exists in skill', async () => {
            await Skill.create({ name: 'Skill1', trainings: [{ name: 'Existing', level: 1, shortDescription: 'S', URL: '', goal: '', length: '', language: '' }] });

            req.body = { skillName: 'Skill1', username: 'u1', name: 'Existing' };

            await adminController.approveTraining(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('should update users who have the skill when training approved', async () => {
            const skill = await Skill.create({ name: 'SharedSkill', trainings: [] });
            const user = await User.create({
                username: 'hasskill',
                skills: [{ name: 'SharedSkill', parents: [], children: [], trainings: [] }]
            });
            await ApprovableTraining.create({
                username: 'u1',
                skillName: 'SharedSkill',
                name: 'NewCourse',
                level: 2,
                shortDescription: 'Advanced',
                URL: 'http://example.com',
                goal: 'Master',
                length: 20,
                language: 'en'
            });

            req.body = { skillName: 'SharedSkill', username: 'u1', name: 'NewCourse' };

            await adminController.approveTraining(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const updatedUser = await User.findOne({ username: 'hasskill' });
            const userSkill = updatedUser.skills.find(s => s.name === 'SharedSkill');
            expect(userSkill.trainings.length).toBe(1);
            expect(userSkill.trainings[0].name).toBe('NewCourse');
        });

        it('should handle server error', async () => {
            jest.spyOn(require('../../../src/utils/skillUtils'), 'findSkillByName').mockRejectedValue(new Error('DB error'));
            req.body = { skillName: 'AnySkill', username: 'u1', name: 'Course' };

            await adminController.approveTraining(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });

        it('should skip when approvable training not found (line 249 falsy branch)', async () => {
            await Skill.create({ name: 'SkillNoApprTraining', trainings: [] });

            req.body = { skillName: 'SkillNoApprTraining', username: 'u1', name: 'NonExistent' };

            await adminController.approveTraining(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });
        });
    });

    describe('dropOffers', () => {
        it('should clear all offers from all skills', async () => {
            await Skill.create({ name: 'S1', offers: [{ username: 'u1', teachingDay: 'Mon', teachingTime: '10:00', location: 'NYC', achievedPoint: 3 }] });
            await Skill.create({ name: 'S2', offers: [{ username: 'u2', teachingDay: 'Tue', teachingTime: '11:00', location: 'LA', achievedPoint: 2 }] });

            await adminController.dropOffers(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const skills = await Skill.find({});
            skills.forEach(s => expect(s.offers.length).toBe(0));
        });

        it('should handle server error', async () => {
            jest.spyOn(Skill, 'find').mockRejectedValue(new Error('DB error'));

            await adminController.dropOffers(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });
    });

    describe('setAdmin', () => {
        it('should set admin status', async () => {
            await User.create({ username: 'targetuser', admin: false });
            req.body = { username: 'targetuser', give: true };

            await adminController.setAdmin(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'targetuser' });
            expect(user.admin).toBe(true);
        });

        it('should remove admin status', async () => {
            await User.create({ username: 'targetuser', admin: true });
            req.body = { username: 'targetuser', give: false };

            await adminController.setAdmin(req, res);

            const user = await User.findOne({ username: 'targetuser' });
            expect(user.admin).toBe(false);
        });

        it('should return error for non-existent user', async () => {
            req.body = { username: 'nonexistent', give: true };

            await adminController.setAdmin(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));
            req.body = { username: 'anyuser', give: true };

            await adminController.setAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });
    });

    describe('deleteUser', () => {
        it('should delete a user', async () => {
            await User.create({ username: 'todelete' });
            req.body = { username: 'todelete' };

            await adminController.deleteUser(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User deleted'
            });

            const user = await User.findOne({ username: 'todelete' });
            expect(user).toBeNull();
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'deleteOne').mockRejectedValue(new Error('DB error'));
            req.body = { username: 'anyuser' };

            await adminController.deleteUser(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });
    });

    describe('wikidataSearch', () => {
        it('should return empty results when no query', async () => {
            req.query = {};

            await adminController.wikidataSearch(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, results: [] });
        });

        it('should handle wikidata service error', async () => {
            req.query = { search: 'test' };
            jest.spyOn(require('../../../src/services/wikidataService'), 'search').mockRejectedValue(new Error('API error'));

            await adminController.wikidataSearch(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });
    });

    describe('wikidataImport', () => {
        it('should error when no QIDs provided', async () => {
            req.body = {};

            await adminController.wikidataImport(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'No QIDs provided'
            });
        });

        it('should handle wikidata service errors gracefully', async () => {
            req.body = { qids: ['Q1'], categoryName: 'General' };
            jest.spyOn(require('../../../src/services/wikidataService'), 'getEntityDetails').mockRejectedValue(new Error('API error'));

            await adminController.wikidataImport(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.stats.errors).toBe(1);
            jest.restoreAllMocks();
        });

        it('should skip null entity details', async () => {
            req.body = { qids: ['Q999'], categoryName: 'General' };
            jest.spyOn(require('../../../src/services/wikidataService'), 'getEntityDetails').mockResolvedValue(null);

            await adminController.wikidataImport(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.stats.skipped).toBe(1);
            jest.restoreAllMocks();
        });

        it('should use Uncategorized when no categoryName (line 358 fallback)', async () => {
            req.body = { qids: ['Q42'] };
            jest.spyOn(require('../../../src/services/wikidataService'), 'getEntityDetails').mockResolvedValue({
                qid: 'Q42', name: 'NoCatSkill', description: '', wikipediaURL: ''
            });

            await adminController.wikidataImport(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.stats.imported).toBe(1);
            const skill = await Skill.findOne({ name: 'NoCatSkill' });
            expect(skill.categoryName).toBe('Uncategorized');
            jest.restoreAllMocks();
        });
    });

    describe('exportData', () => {
        it('should export all data', async () => {
            await Skill.create({ name: 'ExportedSkill' });
            await Tree.create({ name: 'ExportedTree' });
            req.query = {};

            await adminController.exportData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.data.skills.length).toBe(1);
            expect(data.data.trees.length).toBe(1);
        });

        it('should export only skills when type=skills', async () => {
            await Skill.create({ name: 'JustSkill' });
            await Tree.create({ name: 'JustTree' });
            req.query = { type: 'skills' };

            await adminController.exportData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.data.skills.length).toBe(1);
            expect(data.data.trees).toBeUndefined();
        });

        it('should filter skills by category', async () => {
            await Skill.create({ name: 'FrontendSkill', categoryName: 'Frontend' });
            await Skill.create({ name: 'BackendSkill', categoryName: 'Backend' });
            req.query = { category: 'Frontend' };

            await adminController.exportData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.data.skills.length).toBe(1);
            expect(data.data.skills[0].name).toBe('FrontendSkill');
        });

        it('should handle server error', async () => {
            jest.spyOn(Skill, 'find').mockRejectedValue(new Error('DB error'));
            req.query = {};

            await adminController.exportData(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Export failed'
            });
            jest.restoreAllMocks();
        });
    });

    describe('importData', () => {
        it('should import new skills and trees', async () => {
            req.body = {
                skills: [{ name: 'ImportedSkill', categoryName: 'General', parents: [], children: [], trainings: [] }],
                trees: [{ name: 'ImportedTree', skillNames: ['ImportedSkill'] }]
            };

            await adminController.importData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.stats.skills.imported).toBe(1);
            expect(data.stats.trees.imported).toBe(1);
        });

        it('should skip existing skills and trees', async () => {
            await Skill.create({ name: 'ExistingSkill' });
            await Tree.create({ name: 'ExistingTree' });

            req.body = {
                skills: [{ name: 'ExistingSkill' }],
                trees: [{ name: 'ExistingTree' }]
            };

            await adminController.importData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.stats.skills.skipped).toBe(1);
            expect(data.stats.trees.skipped).toBe(1);
        });

        it('should handle missing name as error', async () => {
            req.body = {
                skills: [{ categoryName: 'General' }],
                trees: [{ description: 'No name' }]
            };

            await adminController.importData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.stats.skills.errors).toBe(1);
            expect(data.stats.trees.errors).toBe(1);
        });

        it('should handle empty arrays gracefully', async () => {
            req.body = {};

            await adminController.importData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.stats.skills.imported).toBe(0);
            expect(data.stats.trees.imported).toBe(0);
        });

        it('should import and handle skill errors by logging', async () => {
            const mockSave = jest.spyOn(mongoose.Model.prototype, 'save').mockRejectedValue(new Error('Save failed'));

            req.body = {
                skills: [{ name: 'FailSkill' }],
                trees: [{ name: 'FailTree' }]
            };

            await adminController.importData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.stats.skills.errors).toBe(1);
            expect(data.stats.trees.errors).toBe(1);
            mockSave.mockRestore();
        });

        it('should handle server error on outer try-catch', async () => {
            Object.defineProperty(req, 'body', {
                get: () => { throw new Error('Body access error'); }
            });

            await adminController.importData(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Import failed'
            });
        });
    });

    describe('wikidataSearch (additional)', () => {
        it('should return search results from wikidata', async () => {
            req.query = { search: 'javascript' };
            jest.spyOn(require('../../../src/services/wikidataService'), 'search').mockResolvedValue([{ id: 'Q1', label: 'JavaScript' }]);

            await adminController.wikidataSearch(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, results: [{ id: 'Q1', label: 'JavaScript' }] });
            jest.restoreAllMocks();
        });
    });

    describe('wikidataImport (additional)', () => {
        it('should successfully import new skill from wikidata', async () => {
            req.body = { qids: ['Q42'], categoryName: 'Science' };
            jest.spyOn(require('../../../src/services/wikidataService'), 'getEntityDetails').mockResolvedValue({
                qid: 'Q42', name: 'Physics', description: 'Study of matter', wikipediaURL: 'https://en.wikipedia.org/wiki/Physics'
            });

            await adminController.wikidataImport(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.stats.imported).toBe(1);

            const skill = await Skill.findOne({ name: 'Physics' });
            expect(skill).not.toBeNull();
            expect(skill.categoryName).toBe('Science');
            jest.restoreAllMocks();
        });

        it('should handle outer server error', async () => {
            Object.defineProperty(req, 'body', {
                get: () => { throw new Error('Body access error'); }
            });

            await adminController.wikidataImport(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Wikidata import failed'
            });
        });

        it('should skip already existing wikidata entities', async () => {
            await Skill.create({ name: 'Existing Wiki Skill' });
            req.body = { qids: ['Q99'], categoryName: 'General' };
            jest.spyOn(require('../../../src/services/wikidataService'), 'getEntityDetails').mockResolvedValue({
                qid: 'Q99', name: 'Existing Wiki Skill', description: '', wikipediaURL: ''
            });

            await adminController.wikidataImport(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.stats.skipped).toBe(1);
            jest.restoreAllMocks();
        });
    });

    describe('exportData (additional)', () => {
        it('should export only trees when type=trees', async () => {
            await Skill.create({ name: 'SomeSkill' });
            await Tree.create({ name: 'SomeTree' });
            req.query = { type: 'trees' };

            await adminController.exportData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.data.trees.length).toBe(1);
            expect(data.data.skills).toBeUndefined();
        });
    });
});
