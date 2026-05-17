import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

/**
 * SkillTag Component - Display skills as tags
 */
const SkillTag = ({ skill, proficiency = 'intermediate', onRemove }) => {
  const proficiencyColor = {
    beginner: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    intermediate: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    expert: 'bg-green-500/10 text-green-400 border-green-500/20',
  }[proficiency];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${proficiencyColor} text-sm font-medium`}
    >
      <span>{skill}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-2 hover:opacity-70 transition-opacity"
        >
          ×
        </button>
      )}
    </motion.div>
  );
};

/**
 * SkillsList Component - Display multiple skills
 */
const SkillsList = ({ skills = [] }) => {
  return (
    <div className="space-y-4">
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, idx) => (
            <SkillTag
              key={idx}
              skill={skill.name}
              proficiency={skill.proficiency}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No skills added yet</p>
      )}
    </div>
  );
};

export { SkillTag, SkillsList };
export default SkillsList;
