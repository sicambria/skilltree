const fs = require('fs');
const path = require('path');

const files = ['skills_a_g.json', 'skills_h_m.json', 'skills_n_p.json', 'skills_q_z.json'];
const assetsDir = path.join(__dirname, '..', 'assets', 'json');

const reusabilityMap = {
  'Soft skills (& civic competence)': 'transversal',
  'Language': 'transversal',
  'Culture': 'transversal',
  'Learning': 'transversal',
  'Entrepreneurship (Business)': 'cross-sectoral',
  'Digital': 'cross-sectoral',
  'Maths, science and engineering': 'cross-sectoral',
  'Other': 'cross-sectoral',
};

for (const file of files) {
  const filePath = path.join(assetsDir, file);
  let skills = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = 0;

  skills = skills.map(skill => {
    const reusability = reusabilityMap[skill.categoryName] || 'cross-sectoral';
    if (!skill.reusability) {
      skill.reusability = reusability;
      changed++;
    }
    if (!skill.relationships) {
      skill.relationships = [];
      changed++;
    }
    if (!skill.crosswalks) {
      skill.crosswalks = {};
      changed++;
    }
    if (!skill.temporal) {
      skill.temporal = { stage: 'mature' };
      changed++;
    }
    if (!skill.skillId) {
      const slug = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      skill.skillId = `skilltree:skill:${slug}`;
      changed++;
    }
    return skill;
  });

  fs.writeFileSync(filePath, JSON.stringify(skills, null, 2) + '\n', 'utf8');
  console.log(`${file}: ${changed} entries updated`);
}

const schemaPath = path.join(assetsDir, 'skills-schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

schema.items.required.push('reusability');
schema.items.properties.reusability = {
  type: 'string',
  title: 'The Reusability Schema',
  enum: ['transversal', 'cross-sectoral', 'sector-specific', 'occupation-specific']
};
schema.items.properties.skillId = {
  type: 'string',
  title: 'The SkillId Schema'
};
schema.items.properties.relationships = {
  type: 'array',
  title: 'The Relationships Schema',
  items: {
    type: 'object',
    properties: {
      skillName: { type: 'string' },
      type: { type: 'string', enum: ['prerequisite', 'complement', 'substitute', 'specializes', 'adjacent'] }
    }
  }
};
schema.items.properties.crosswalks = {
  type: 'object',
  title: 'The Crosswalks Schema',
  properties: {
    esco: { type: 'string' },
    onet: { type: 'string' },
    sfia: { type: 'string' },
    lightcast: { type: 'string' }
  }
};
schema.items.properties.temporal = {
  type: 'object',
  title: 'The Temporal Schema',
  properties: {
    stage: { type: 'string', enum: ['emerging', 'growing', 'mature', 'declining'] },
    demand_score: { type: 'number' },
    growth_rate: { type: 'number' },
    emergence_date: { type: 'string' }
  }
};

fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2) + '\n', 'utf8');
console.log('skills-schema.json updated');
