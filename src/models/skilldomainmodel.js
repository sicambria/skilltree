var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('SkillDomain', new Schema({
    name: { type: String, required: true },
    depth: { type: Number, required: true },
    parent: { type: String, default: null },
    description: String,
    skillNames: [String],
    icon: String
}));
