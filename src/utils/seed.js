const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Models
const Category = require('../models/categorymodel');
const Skill = require('../models/skillmodel');
const Tree = require('../models/treemodel');
const User = require('../models/usermodel');
const SkillDomain = require('../models/skilldomainmodel');
const security = require('./security');

const seed = async () => {
    try {
        await mongoose.connect(config.database);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        const catDelete = await Category.deleteMany({});
        const skillDelete = await Skill.deleteMany({});
        const treeDelete = await Tree.deleteMany({});
        const userDelete = await User.deleteMany({});
        const domainDelete = await SkillDomain.deleteMany({});
        console.log(`   - Deleted ${catDelete.deletedCount} categories`);
        console.log(`   - Deleted ${skillDelete.deletedCount} skills`);
        console.log(`   - Deleted ${treeDelete.deletedCount} trees`);
        console.log(`   - Deleted ${userDelete.deletedCount} users`);
        console.log(`   - Deleted ${domainDelete.deletedCount} domains`);

        // Read files
        console.log('📂 Reading seed data from JSON files...');
        const categories = JSON.parse(fs.readFileSync(path.join(__dirname, '../../assets/json/categories.json'), 'utf8'));
        
        // Future-proof skills loading (all skills_*.json)
        const assetDir = path.join(__dirname, '../../assets/json');
        const skillFiles = fs.readdirSync(assetDir).filter(f => f.startsWith('skills_') && f.endsWith('.json'));
        console.log(`   - Found ${skillFiles.length} skill files: ${skillFiles.join(', ')}`);
        
        let skills = [];
        skillFiles.forEach(file => {
            const data = JSON.parse(fs.readFileSync(path.join(assetDir, file), 'utf8'));
            skills = skills.concat(data);
        });
        
        const trees = JSON.parse(fs.readFileSync(path.join(__dirname, '../../assets/json/trees.json'), 'utf8'));

        // Insert data
        console.log('🌱 Inserting new data...');
        const catInsert = await Category.insertMany(categories);
        const skillInsert = await Skill.insertMany(skills);
        const treeInsert = await Tree.insertMany(trees);
        console.log(`   + Inserted ${catInsert.length} categories`);
        console.log(`   + Inserted ${skillInsert.length} skills`);
        console.log(`   + Inserted ${treeInsert.length} trees`);

        // Seed skill domains (hierarchical taxonomy for depth-mapping onboarding)
        const domainPath = path.join(assetDir, 'domains.json');
        if (fs.existsSync(domainPath)) {
            const domains = JSON.parse(fs.readFileSync(domainPath, 'utf8'));
            await SkillDomain.insertMany(domains);
            console.log(`   + Inserted ${domains.length} skill domains`);
        }

        // Demo user
        const existingDemo = await User.findOne({ username: 'demo' });
        if (!existingDemo) {
            const demoHash = security.hashPassword('demo');
            const demoSkillNames = ['Active Listening', 'Critical Thinking', 'Coaching', 'Scrum', 'Python', 'Empathy', 'Public Speaking', 'Collaboration'];
            const demoTrees = await Tree.find({ name: { $in: ['Scrum Master'] } }, { _id: 0, __v: 0 });
            const demoTreesMap = demoTrees.map(t => t.toObject ? t.toObject() : t);
            const demoCategories = await Category.find({});

            const demoSkillsToPush = [];
            for (const sn of demoSkillNames) {
                const gs = skills.find(s => s.name === sn);
                if (gs) {
                    demoSkillsToPush.push({
                        ...gs,
                        achievedPoint: Math.ceil(Math.random() * 3) + 1
                    });
                }
            }

            const userTrees = demoTreesMap.map(t => ({
                name: t.name,
                skillNames: t.skillNames || [],
                description: t.description || '',
                focusArea: t.focusArea || ''
            }));

            await new User({
                username: 'demo',
                email: 'demo@skilltree.local',
                hashData: demoHash,
                admin: false,
                categories: demoCategories.map(c => ({ name: c.name, achievedPoint: 0, maxPoint: 5 })),
                skills: demoSkillsToPush,
                trees: userTrees,
                willingToTeach: false
            }).save();
            console.log('   + Created demo user (demo/demo)');
        } else {
            console.log('   ~ Demo user already exists, skipping');
        }

        console.log('--------------------------------------------------');
        console.log('✨ Seeding completed successfully!');
        console.log('--------------------------------------------------');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
