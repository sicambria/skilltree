const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Models
const Category = require('../models/categorymodel');
const Skill = require('../models/skillmodel');
const Tree = require('../models/treemodel');
const User = require('../models/usermodel');
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
        console.log(`   - Deleted ${catDelete.deletedCount} categories`);
        console.log(`   - Deleted ${skillDelete.deletedCount} skills`);
        console.log(`   - Deleted ${treeDelete.deletedCount} trees`);
        console.log(`   - Deleted ${userDelete.deletedCount} users`);

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

        // Admin user creation removed — use registration + manual promotion via /admin/setadmin
        console.log('   ~ Default admin user not created. Register first user, then promote via admin/setadmin.');
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
