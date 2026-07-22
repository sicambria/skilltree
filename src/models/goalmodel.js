var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Goal', new Schema({
    username: String,
    title: String,
    skillName: String,
    targetLevel: Number,
    targetDate: Date,
    collaborators: [String],
    createdAt: { type: Date, default: Date.now },
    notes: String
}));
