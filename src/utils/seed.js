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
        
        // Split skills files
        const skillFiles = ['skills_part1.json', 'skills_part2.json', 'skills_part3.json'];
        let skills = [];
        skillFiles.forEach(file => {
            const data = JSON.parse(fs.readFileSync(path.join(__dirname, `../../assets/json/${file}`), 'utf8'));
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

        // Create default admin user
        console.log('👤 Creating default admin user...');
        const adminUser = new User({
            username: 'admin',
            admin: true,
            email: 'admin@skilltree.local',
            hashData: security.hashPassword('admin'),
            categories: categories
        });
        await adminUser.save();
        console.log('   + Created user: admin / admin');

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
