const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Class = require('./Class');

const Student = sequelize.define('Student', {
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    primaryKey: true
  },
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
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 设置与Class模型的关联关系
Student.belongsTo(Class, { foreignKey: 'classId' });

// 同步数据库模型
Student.sync();

module.exports = Student;