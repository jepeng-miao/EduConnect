const Teacher = require('../models/Teacher');

async function initDefaultTeacher() {
  try {
    // 检查默认教师账号是否已存在
    const existingTeacher = await Teacher.findOne({ where: { username: 'miao' } });
    
    if (!existingTeacher) {
      // 创建默认教师账号
      await Teacher.create({
        username: 'miao',
        password: 'Qsxx1234',
        name: '默认教师',
        email: 'miao@educonnect.com',
        department: '计算机科学系'
      });
      console.log('默认教师账号创建成功');
    } else {
      console.log('默认教师账号已存在');
    }

    // 检查admin教师账号是否已存在
    const existingAdminTeacher = await Teacher.findOne({ where: { username: 'admin' } });
    
    if (!existingAdminTeacher) {
      // 创建admin教师账号
      await Teacher.create({
        username: 'admin',
        password: 'admin',
        name: '管理员',
        email: 'admin@educonnect.com',
        department: '系统管理'
      });
      console.log('admin教师账号创建成功');
    } else {
      console.log('admin教师账号已存在');
    }
  } catch (error) {
    console.error('创建默认教师账号失败:', error);
  }
}

module.exports = initDefaultTeacher;