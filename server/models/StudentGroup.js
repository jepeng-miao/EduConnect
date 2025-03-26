const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./Student');
const Group = require('./Group');

const StudentGroup = sequelize.define('StudentGroup', {
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'studentId'
    }
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Groups',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 设置与Student和Group模型的关联关系
StudentGroup.belongsTo(Student, { foreignKey: 'studentId' });
StudentGroup.belongsTo(Group, { foreignKey: 'groupId' });

// 同步数据库模型
StudentGroup.sync();

module.exports = StudentGroup;