const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const Skill = require('../../../src/models/skillmodel');
const User = require('../../../src/models/usermodel');
const treeUtils = require('../../../src/utils/treeUtils');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('treeUtils.js', () => {
    const createSkill = (data) => Skill.create(data);

    describe('getDependency', () => {
        it('should return empty dependency for skill with no parents', async () => {
            const skill = { name: 'A', parents: [] };
            const dependency = [];
            await treeUtils.getDependency([], skill, dependency);
            expect(dependency).toEqual([]);
        });

        it('should find parent from userSkills array', async () => {
            const parent = { name: 'P1' };
            const skill = { name: 'A', parents: ['P1'] };
            const dependency = [];
            await treeUtils.getDependency([parent], skill, dependency);
            expect(dependency).toEqual([parent]);
        });

        it('should find parent from database if not in userSkills', async () => {
            await createSkill({ name: 'P1' });
            const skill = { name: 'A', parents: ['P1'] };
            const dependency = [];
            await treeUtils.getDependency([], skill, dependency);
            expect(dependency.length).toBe(1);
            expect(dependency[0].name).toBe('P1');
        });

        it('should traverse multiple levels of parents', async () => {
            await createSkill({ name: 'Grandparent' });
            await createSkill({ name: 'Parent', parents: ['Grandparent'] });
            const skill = { name: 'Child', parents: ['Parent'] };
            const dependency = [];
            await treeUtils.getDependency([], skill, dependency);
            expect(dependency.length).toBe(2);
            expect(dependency[0].name).toBe('Parent');
            expect(dependency[1].name).toBe('Grandparent');
        });

        it('should handle mixed userSkills and DB parents', async () => {
            await createSkill({ name: 'DB_Parent' });
            const userSkill = { name: 'User_Parent' };
            const skill = { name: 'Child', parents: ['User_Parent', 'DB_Parent'] };
            const dependency = [];
            await treeUtils.getDependency([userSkill], skill, dependency);
            expect(dependency.length).toBe(2);
        });

        it('should skip undefined parents gracefully', async () => {
            const skill = { name: 'A', parents: ['NonExistent'] };
            const dependency = [];
            await treeUtils.getDependency([], skill, dependency);
            expect(dependency).toEqual([]);
        });

        it('should handle skills with undefined parents property', async () => {
            const skill = { name: 'A' };
            const dependency = [];
            await treeUtils.getDependency([], skill, dependency);
            expect(dependency).toEqual([]);
        });
    });

    describe('sortTree', () => {
        it('should return empty array for empty input', async () => {
            const result = await treeUtils.sortTree([]);
            expect(result).toEqual([]);
        });

        it('should sort single skill', async () => {
            const skills = [{ name: 'A', parents: [], children: [] }];
            const result = await treeUtils.sortTree(skills);
            expect(result).toEqual(['A']);
        });

        it('should place parent before child', async () => {
            const skills = [
                { name: 'Child', parents: ['Parent'], children: [] },
                { name: 'Parent', parents: [], children: [{ name: 'Child', minPoint: 1, recommended: true }] }
            ];
            const result = await treeUtils.sortTree(skills);
            expect(result.indexOf('Parent')).toBeLessThan(result.indexOf('Child'));
        });

        it('should handle linear chain', async () => {
            const skills = [
                { name: 'C', parents: ['B'], children: [] },
                { name: 'B', parents: ['A'], children: [{ name: 'C', minPoint: 1, recommended: false }] },
                { name: 'A', parents: [], children: [{ name: 'B', minPoint: 1, recommended: false }] }
            ];
            const result = await treeUtils.sortTree(skills);
            expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'));
            expect(result.indexOf('B')).toBeLessThan(result.indexOf('C'));
        });

        it('should handle multiple independent skills', async () => {
            const skills = [
                { name: 'B', parents: ['A'], children: [] },
                { name: 'A', parents: [], children: [{ name: 'B', minPoint: 1, recommended: false }] },
                { name: 'D', parents: ['C'], children: [] },
                { name: 'C', parents: [], children: [{ name: 'D', minPoint: 1, recommended: false }] }
            ];
            const result = await treeUtils.sortTree(skills);
            expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'));
            expect(result.indexOf('C')).toBeLessThan(result.indexOf('D'));
        });

        it('should handle skill with no parents and no children', async () => {
            const skills = [{ name: 'Alone', parents: [], children: [] }];
            const result = await treeUtils.sortTree(skills);
            expect(result).toEqual(['Alone']);
        });

        it('should insert skill above child when child is at row > 0', async () => {
            const skills = [
                { name: 'A', parents: [], children: [{ name: 'B', minPoint: 1, recommended: true }] },
                { name: 'B', parents: ['A'], children: [] },
                { name: 'C', parents: [], children: [{ name: 'B', minPoint: 1, recommended: true }] }
            ];
            const result = await treeUtils.sortTree(skills);
            expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'));
            expect(result.indexOf('C')).toBeLessThan(result.indexOf('B'));
        });
    });

    describe('sortAndAddTreeToUser', () => {
        it('should add sorted tree to user and save', async () => {
            await createSkill({ name: 'SkillA' });
            await createSkill({ name: 'SkillB', parents: ['SkillA'] });
            const user = await User.create({ username: 'testuser', skills: [] });

            const tree = {
                name: 'TestTree',
                focusArea: 'Development',
                description: 'A test tree',
                skillNames: ['SkillA', 'SkillB']
            };

            await treeUtils.sortAndAddTreeToUser(tree, user);

            const updatedUser = await User.findOne({ username: 'testuser' });
            expect(updatedUser.trees.length).toBe(1);
            expect(updatedUser.trees[0].name).toBe('TestTree');
            expect(updatedUser.trees[0].skillNames).toContain('SkillA');
            expect(updatedUser.skills.length).toBe(2);
        });

        it('should not duplicate skills already in user', async () => {
            await createSkill({ name: 'SkillA' });
            const user = await User.create({
                username: 'testuser',
                skills: [{ name: 'SkillA', achievedPoint: 3 }]
            });

            const tree = {
                name: 'TestTree',
                focusArea: 'Development',
                description: 'Test',
                skillNames: ['SkillA']
            };

            await treeUtils.sortAndAddTreeToUser(tree, user);
            const updatedUser = await User.findOne({ username: 'testuser' });
            const skillAcount = updatedUser.skills.filter(s => s.name === 'SkillA').length;
            expect(skillAcount).toBe(1);
        });

        it('should reset achievedPoint to 0 for added skills', async () => {
            await createSkill({ name: 'SkillX' });
            const user = await User.create({ username: 'testuser', skills: [] });
            const tree = {
                name: 'TreeX',
                focusArea: 'Area',
                description: 'Desc',
                skillNames: ['SkillX']
            };
            await treeUtils.sortAndAddTreeToUser(tree, user);
            const updatedUser = await User.findOne({ username: 'testuser' });
            const skill = updatedUser.skills.find(s => s.name === 'SkillX');
            expect(skill.achievedPoint).toBe(0);
        });
    });

    describe('extractNames (internal via sortTree)', () => {
        it('should return skill names from sorted array', async () => {
            const skills = [
                { name: 'B', parents: ['A'], children: [] },
                { name: 'A', parents: [], children: [{ name: 'B', minPoint: 1, recommended: false }] }
            ];
            const result = await treeUtils.sortTree(skills);
            expect(result).toEqual(['A', 'B']);
        });
    });

    describe('addRowToComponent (internal via sortTree)', () => {
        it('should handle inserting skill that creates new rows', async () => {
            const skills = [
                { name: 'Root', parents: [], children: [{ name: 'Child1', minPoint: 1, recommended: false }, { name: 'Child2', minPoint: 1, recommended: false }] },
                { name: 'Child1', parents: ['Root'], children: [] },
                { name: 'Child2', parents: ['Root'], children: [] }
            ];
            const result = await treeUtils.sortTree(skills);
            expect(result[0]).toBe('Root');
            expect(result).toContain('Child1');
            expect(result).toContain('Child2');
        });
    });
});
