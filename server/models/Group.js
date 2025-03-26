const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Class = require('./Class');

const Group = sequelize.define('Group', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Classes',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 设置与Class模型的关联关系
Group.belongsTo(Class, { foreignKey: 'classId' });

// 同步数据库模型
Group.sync();

module.exports = Group;