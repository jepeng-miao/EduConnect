const { Sequelize } = require('sequelize');
const path = require('path');

// 创建SQLite数据库连接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功。');
  } catch (error) {
    console.error('无法连接到数据库:', error);
  }
};

// 导出数据库连接实例
module.exports = { sequelize, testConnection };

testConnection();