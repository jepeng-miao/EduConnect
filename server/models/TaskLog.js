const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./Student');
const Class = require('./Class');

const TaskLog = sequelize.define('TaskLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '任务ID，如typing-game, emotion-cards等'
  },
  taskType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '任务类型，如打字比赛、情绪卡片、二维码识别等'
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'studentId'
    },
    comment: '学生ID'
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Classes',
      key: 'id'
    },
    comment: '班级ID'
  },
  taskResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '任务结果，存储为JSON格式，可包含不同任务类型的特定结果数据'
  },
  taskStatus: {
    type: DataTypes.ENUM('completed', 'failed', 'in_progress'),
    defaultValue: 'completed',
    comment: '任务状态：已完成、失败、进行中'
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: '任务评分，可选'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '完成任务所用时间（毫秒）'
  },
  completedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '任务完成时间'
  },
  additionalData: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '额外数据，可存储不适合放在taskResult中的大文本内容'
  }
}, {
  tableName: 'TaskLogs'
});

// 设置与Student模型的关联关系
TaskLog.belongsTo(Student, { foreignKey: 'studentId' });

// 设置与Class模型的关联关系
TaskLog.belongsTo(Class, { foreignKey: 'classId' });

// 同步数据库模型
TaskLog.sync();

module.exports = TaskLog;