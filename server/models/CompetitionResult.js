const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./Student');

const CompetitionResult = sequelize.define('CompetitionResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'studentId'
    }
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Classes',
      key: 'id'
    }
  },
  competitionText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  accuracy: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  progress: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  completionTime: {
    type: DataTypes.INTEGER,  // 完成时间（毫秒）
    allowNull: true
  },
  competitionDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 设置与Student模型的关联关系
CompetitionResult.belongsTo(Student, { foreignKey: 'studentId' });

// 同步数据库模型
CompetitionResult.sync();

module.exports = CompetitionResult;