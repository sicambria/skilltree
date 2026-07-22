var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('FeedPost', new Schema({
    username: String,
    type: { type: String, enum: ['levelup', 'trainingoffer', 'trainingrequest', 'qa'] },
    body: String,
    skillName: String,
    skillLevel: Number,
    createdAt: { type: Date, default: Date.now },
    comments: [{
        username: String,
        body: String,
        createdAt: { type: Date, default: Date.now }
    }]
}));
