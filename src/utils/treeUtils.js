const Skill = require('../models/skillmodel');

/**
 * Recursive function for dependency determination
 */
const getDependency = async (userSkills, skill, dependency) => {
    const parents = [];
    for (let i = 0; skill.parents != undefined && i < skill.parents.length; ++i) {
        let parent = userSkills.find(obj => obj.name == skill.parents[i]);
        if (parent == undefined) {
            parent = await Skill.findOne({ name: skill.parents[i] });
        }

        if (parent) {
            parents.push(parent);
            dependency.push(parent);
        }
    }

    for (let i = 0; i < parents.length; ++i) {
        await getDependency(userSkills, parents[i], dependency);
    }
};

const addRowToComponent = async (skillMatrix, component) => {
    skillMatrix[component].push([]);
    for (let i = skillMatrix[component].length - 2; i >= 0; i--) {
        skillMatrix[component][i + 1] = skillMatrix[component][i];
    }
    skillMatrix[component][0] = [];
};

const insertSkill = async (skillToInsert, skillMatrix) => {
    for (let component = 0; component < skillMatrix.length; component++) {
        for (let child = 0; child < skillToInsert.children.length; child++) {
            for (let row = 0; row < skillMatrix[component].length; row++) {
                if ((skillMatrix[component][row].map(obj => obj.name)).includes(skillToInsert.children[child].name)) {
                    if (row == 0) {
                        await addRowToComponent(skillMatrix, component);
                        skillMatrix[component][0].push(skillToInsert);
                        return;
                    } else {
                        skillMatrix[component][row - 1].push(skillToInsert);
                        return;
                    }
                }
            }
        }
        for (let par = 0; par < skillToInsert.parents.length; par++) {
            for (let row = 0; row < skillMatrix[component].length; row++) {
                if ((skillMatrix[component][row].map(obj => obj.name)).includes(skillToInsert.parents[par])) {
                    if (skillMatrix[component][row + 1] == undefined) skillMatrix[component].push([]);
                    skillMatrix[component][row + 1].push(skillToInsert);
                    return;
                }
            }
        }
    }
    skillMatrix.push([[skillToInsert]]);
};

const assembleTree = async (skillMatrix) => {
    let assembledTree = [];
    let l = true;
    let j = 0;
    while (l) {
        l = false;
        for (let component = 0; component < skillMatrix.length; component++) {
            if (skillMatrix[component][j] != undefined) {
                l = true;
                assembledTree = assembledTree.concat(skillMatrix[component][j]);
            }
        }
        j++;
    }
    return assembledTree;
};

const extractNames = async (skillArray) => {
    return skillArray.map(obj => obj.name);
};

const sortTree = async (skillArray) => {
    let sortedArray = [];
    let skillMatrix = [];
    for (let i = 0; i < skillArray.length; i++) {
        await insertSkill(skillArray[i], skillMatrix);
    }
    sortedArray = await assembleTree(skillMatrix);
    return await extractNames(sortedArray);
};

const sortAndAddTreeToUser = async (treeToSort, user) => {
    const skills = await Skill.find({
        name: treeToSort.skillNames,
    });

    const sn = await sortTree(skills);
    user.trees.push({
        name: treeToSort.name,
        focusArea: treeToSort.focusArea,
        description: treeToSort.description,
        skillNames: sn
    });

    skills.forEach(skill => {
        skill.achievedPoint = 0;
        if (user.skills.find(obj => obj.name == skill.name) == undefined) {
            user.skills.push(skill);
        }
    });

    await user.save();
};

module.exports = {
    getDependency,
    sortTree,
    sortAndAddTreeToUser
};
