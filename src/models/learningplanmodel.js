var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var targetAssessmentSchema = new Schema({
    autonomy: { type: Number, min: 1, max: 7 },
    complexity: { type: Number, min: 1, max: 7 },
    influence: { type: Number, min: 1, max: 7 },
    knowledge: { type: Number, min: 1, max: 7 },
    business_skills: { type: Number, min: 1, max: 7 }
}, { _id: false });

var horizonSkillSchema = new Schema({
    skillName: String,
    targetAssessment: targetAssessmentSchema,
    goalRef: { type: Schema.Types.ObjectId, ref: 'Goal' },
    notes: String
}, { _id: false });

var horizonSchema = new Schema({
    targetDate: Date,
    transitionType: { type: String, enum: ['deepen', 'broaden', 'pivot', 'shift', 'promote'] },
    skills: [horizonSkillSchema]
}, { _id: false });

module.exports = mongoose.model('LearningPlan', new Schema({
    username: { type: String, index: true },
    title: String,
    description: String,
    type: { type: String, enum: ['personal', 'relational'], default: 'personal' },
    participants: [String],
    inviteCode: { type: String, sparse: true, unique: true },
    wizardStep: { type: Number, default: 0, min: 0, max: 5 },
    horizons: {
        shortTerm: horizonSchema,
        midTerm: horizonSchema,
        longTerm: horizonSchema
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}));
