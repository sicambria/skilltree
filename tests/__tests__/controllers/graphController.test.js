const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const Skill = require('../../../src/models/skillmodel');
const Tree = require('../../../src/models/treemodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('graphController', () => {
    let graphController;
    let req, res;

    beforeEach(() => {
        graphController = require('../../../src/controllers/graphController');
        req = {};
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('getGraphData', () => {
        it('should return nodes and links for skills and trees', async () => {
            const skill = await Skill.create({ name: 'JS', categoryName: 'Programming', parents: [], children: [] });
            const tree = await Tree.create({ name: 'Web Dev', focusArea: 'Frontend', skillNames: ['JS'] });

            await graphController.getGraphData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.nodes).toBeDefined();
            expect(data.links).toBeDefined();

            const treeNode = data.nodes.find(n => n.id === 'tree-Web Dev');
            expect(treeNode).toBeDefined();
            expect(treeNode.type).toBe('tree');

            const skillNode = data.nodes.find(n => n.id === 'skill-JS');
            expect(skillNode).toBeDefined();
            expect(skillNode.type).toBe('skill');

            const link = data.links.find(l => l.source === 'tree-Web Dev' && l.target === 'skill-JS');
            expect(link).toBeDefined();
        });

        it('should create parent-child links for skills with parents', async () => {
            await Skill.create({ name: 'ChildSkill', parents: ['ParentSkill'], children: [] });
            await Skill.create({ name: 'ParentSkill', parents: [], children: [{ name: 'ChildSkill', minPoint: 1, recommended: false }] });

            await graphController.getGraphData(req, res);

            const data = res.json.mock.calls[0][0];
            const parentChildLink = data.links.find(l => l.type === 'parent-child');
            expect(parentChildLink).toBeDefined();
            expect(parentChildLink.source).toBe('skill-ParentSkill');
            expect(parentChildLink.target).toBe('skill-ChildSkill');
        });

        it('should not duplicate nodes', async () => {
            await Skill.create({ name: 'Unique', parents: [], children: [] });

            await graphController.getGraphData(req, res);

            const data = res.json.mock.calls[0][0];
            const uniqueNodes = data.nodes.filter(n => n.id === 'skill-Unique');
            expect(uniqueNodes.length).toBe(1);
        });

        it('should return empty arrays when no data exists', async () => {
            await graphController.getGraphData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.nodes).toEqual([]);
            expect(data.links).toEqual([]);
        });

        it('should handle server error', async () => {
            jest.spyOn(Skill, 'find').mockRejectedValue(new Error('DB error'));

            await graphController.getGraphData(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to fetch graph data'
            });
            jest.restoreAllMocks();
        });
    });
});
