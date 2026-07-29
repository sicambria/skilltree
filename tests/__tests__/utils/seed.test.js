describe('seed.js', () => {
    it('should be a valid Node.js module file', () => {
        const fs = require('fs');
        const path = require('path');
        const seedPath = path.join(__dirname, '../../../src/utils/seed.js');
        expect(fs.existsSync(seedPath)).toBe(true);

        const content = fs.readFileSync(seedPath, 'utf8');
        expect(content).toContain('seed');
        expect(content).toContain('async');
        expect(content).toContain('mongoose.connect');
    });

    it('should contain all expected seeding operations', () => {
        const fs = require('fs');
        const path = require('path');
        const content = fs.readFileSync(path.join(__dirname, '../../../src/utils/seed.js'), 'utf8');

        expect(content).toContain('Category.deleteMany');
        expect(content).toContain('Skill.deleteMany');
        expect(content).toContain('Tree.deleteMany');
        expect(content).toContain('User.deleteMany');
        expect(content).toContain('insertMany');
        expect(content).toContain('SkillDomain.deleteMany');
        expect(content).toContain('process.exit(0)');
        expect(content).toContain('process.exit(1)');
    });
});
