var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var assessmentSchema = new Schema({
    autonomy: { type: Number, min: 1, max: 7 },
    complexity: { type: Number, min: 1, max: 7 },
    influence: { type: Number, min: 1, max: 7 },
    knowledge: { type: Number, min: 1, max: 7 },
    business_skills: { type: Number, min: 1, max: 7 },
    effectiveLevel: { type: Number, min: 1, max: 7 }
}, { _id: false });

module.exports = mongoose.model('User', new Schema({
    username: String,
    admin: Boolean,
    email: String,
    hashData: Buffer,
    focusArea: {
        name: String,
        treeNames: [String],
    },
    domainPath: [String],
    location: String,
    willingToTeach: Boolean,
    teachingDay: String,
    teachingTime: String,
    categories: [
        {
            name: String,
            achievedPoint: Number,
            maxPoint: Number
        }
    ],
    skills: [
        {
            name: String,
            categoryName: String,
            skillIcon: String,
            description: String,
            descriptionWikipediaURL: String,
            pointDescription: [String],
            achievedPoint: Number,
            maxPoint: Number,
            assessment: assessmentSchema,
            parents: [String],
            children: [
                {
                    name: String,
                    minPoint: Number,
                    recommended: Boolean
                }
            ],
            trainings: [
                {
                    name: String,
                    level: String,
                    shortDescription: String,
                    URL: String,
                    URLLastAccessed: String,
                    goal: String,
                    length: String,
                    language: String
                }
            ],
            endorsement: [String]
        }
    ],
    mainTree: String,
    trees: [
        {
            name: String,
            skillNames: [String],
            description: String,
            focusArea: String
        }
    ]
}));
