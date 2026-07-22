var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('SkillHistory', new Schema({
    username: String,
    skillName: String,
    achievedPoint: Number,
    maxPoint: Number,
    recordedAt: { type: Date, default: Date.now }
}));
