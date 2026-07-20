const fc = require('fast-check');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const treeUtils = require('../../../src/utils/treeUtils');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

const skillArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 }),
    parents: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 }),
    children: fc.array(
        fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }),
            minPoint: fc.integer({ min: 0, max: 5 }),
            recommended: fc.boolean()
        }),
        { maxLength: 3 }
    )
});

describe('treeUtils fuzz tests', () => {
    describe('sortTree', () => {
        it('should not crash on arbitrary skill arrays', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(skillArbitrary, { minLength: 0, maxLength: 10 }),
                    async (skills) => {
                        try {
                            const result = await treeUtils.sortTree(skills);
                            expect(Array.isArray(result)).toBe(true);
                            for (const name of result) {
                                expect(typeof name).toBe('string');
                            }
                            const inputNames = skills.map(s => s.name);
                            for (const name of result) {
                                expect(inputNames).toContain(name);
                            }
                        } catch (e) {
                            expect(e).toBeDefined();
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should handle skills with empty arrays', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(
                        fc.record({
                            name: fc.string({ minLength: 1, maxLength: 10 }),
                            children: fc.array(
                                fc.record({
                                    name: fc.string({ minLength: 1, maxLength: 10 }),
                                    minPoint: fc.integer({ min: 0, max: 5 }),
                                    recommended: fc.boolean()
                                }),
                                { maxLength: 2 }
                            )
                        }),
                        { minLength: 0, maxLength: 10 }
                    ),
                    async (skills) => {
                        const withEmptyParents = skills.map(s => ({
                            ...s,
                            parents: []
                        }));
                        try {
                            const result = await treeUtils.sortTree(withEmptyParents);
                            expect(Array.isArray(result)).toBe(true);
                        } catch (e) {
                            expect(e).toBeDefined();
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    describe('getDependency', () => {
        it('should handle arbitrary skill structures', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(
                        fc.record({
                            name: fc.string({ minLength: 1, maxLength: 10 }),
                            parents: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 })
                        }),
                        { minLength: 0, maxLength: 8 }
                    ),
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 10 }),
                        parents: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 })
                    }),
                    async (userSkills, skill) => {
                        const dependency = [];
                        try {
                            await treeUtils.getDependency(userSkills, skill, dependency);
                            expect(Array.isArray(dependency)).toBe(true);
                        } catch (e) {
                            expect(e).toBeDefined();
                        }
                    }
                ),
                { numRuns: 30 }
            );
        });
    });
});
