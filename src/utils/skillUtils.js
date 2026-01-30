const Skill = require('../models/skillmodel');

const findSkillByName = async (name) => {
    return await Skill.findOne({ name });
};

module.exports = {
    findSkillByName
};
