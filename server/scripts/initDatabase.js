const { sequelize } = require('../config/database');
const Teacher = require('../models/Teacher');

async function initDatabase() {
  try {
    // 同步所有模型到数据库
    await sequelize.sync({ force: true });
    console.log('数据库表创建成功');
  } catch (error) {
    console.error('数据库表创建失败:', error);
    process.exit(1);
  }
}

// 执行初始化
initDatabase();