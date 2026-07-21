var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var relationshipSchema = new Schema({
    skillName: { type: String, required: true },
    type: { type: String, enum: ['prerequisite', 'complement', 'substitute', 'specializes', 'adjacent'], required: true }
}, { _id: false });

var crosswalkSchema = new Schema({
    esco: String,
    onet: String,
    sfia: String,
    lightcast: String
}, { _id: false });

var temporalSchema = new Schema({
    stage: { type: String, enum: ['emerging', 'growing', 'mature', 'declining'] },
    demand_score: Number,
    growth_rate: Number,
    emergence_date: String
}, { _id: false });

module.exports = mongoose.model('ApprovableSkill', new Schema({
    username: String,
    name: String,
    skillId: String,
    categoryName: String,
    skillIcon: String,
    description: String,
    descriptionWikipediaURL: String,
    pointDescription: [String],
    maxPoint: Number,
    reusability: { type: String, enum: ['transversal', 'cross-sectoral', 'sector-specific', 'occupation-specific'] },
    parents: [String],
    children: [
        {
            name: String,
            minPoint: Number,
            recommended: Boolean
        }
    ],
    relationships: [relationshipSchema],
    crosswalks: crosswalkSchema,
    temporal: temporalSchema,
    trainings: [
        {
            name: String,
            level: Number,
            shortDescription: String,
            URL: String,
            URLLastAccessed: String,
            goal: String,
            length: Number,
            language: String
        }
    ]
}));
