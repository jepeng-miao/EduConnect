const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');

// 中间件：验证管理员身份
const authAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: '未登录' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teacher = await Teacher.findOne({ where: { id: decoded.id } });
    
    if (!teacher) {
      return res.status(401).json({ message: '用户不存在' });
    }

    // 这里可以添加管理员角色验证逻辑
    // 目前简化处理，所有教师都有管理权限

    req.admin = teacher;
    next();
  } catch (error) {
    res.status(401).json({ message: '会话已过期' });
  }
};

// 获取所有教师列表
router.get('/teachers', authAdmin, async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      attributes: { exclude: ['password'] }, // 排除密码字段
      order: [['createdAt', 'DESC']]
    });
    res.json({ teachers });
  } catch (error) {
    console.error('获取教师列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新教师
router.post('/teachers', authAdmin, async (req, res) => {
  try {
    const { username, password, name, email, department } = req.body;
    
    // 检查用户名是否已存在
    const existingTeacher = await Teacher.findOne({ where: { username } });
    if (existingTeacher) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 检查邮箱是否已存在
    const emailExists = await Teacher.findOne({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ message: '邮箱已被使用' });
    }
    
    const newTeacher = await Teacher.create({
      username,
      password,
      name,
      email,
      department
    });
    
    res.status(201).json({
      message: '教师添加成功',
      teacher: {
        id: newTeacher.id,
        username: newTeacher.username,
        name: newTeacher.name,
        email: newTeacher.email,
        department: newTeacher.department
      }
    });
  } catch (error) {
    console.error('创建教师错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取特定教师信息
router.get('/teachers/:id', authAdmin, async (req, res) => {
  try {
    const teacherId = req.params.id;
    const teacher = await Teacher.findOne({
      where: { id: teacherId },
      attributes: { exclude: ['password'] } // 排除密码字段
    });
    
    if (!teacher) {
      return res.status(404).json({ message: '教师不存在' });
    }
    
    res.json({ teacher });
  } catch (error) {
    console.error('获取教师信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新教师信息
router.put('/teachers/:id', authAdmin, async (req, res) => {
  try {
    const teacherId = req.params.id;
    const { username, password, name, email, department } = req.body;
    
    const teacher = await Teacher.findOne({ where: { id: teacherId } });
    
    if (!teacher) {
      return res.status(404).json({ message: '教师不存在' });
    }
    
    // 检查邮箱是否与其他教师冲突
    if (email !== teacher.email) {
      const emailExists = await Teacher.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ message: '邮箱已被使用' });
      }
    }
    
    // 更新字段
    const updateData = { name, email, department };
    
    // 如果提供了新密码，则更新密码
    if (password) {
      updateData.password = password;
    }
    
    await teacher.update(updateData);
    
    res.json({
      message: '教师信息更新成功',
      teacher: {
        id: teacher.id,
        username: teacher.username,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department
      }
    });
  } catch (error) {
    console.error('更新教师信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除教师
router.delete('/teachers/:id', authAdmin, async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    const teacher = await Teacher.findOne({ where: { id: teacherId } });
    
    if (!teacher) {
      return res.status(404).json({ message: '教师不存在' });
    }
    
    await teacher.destroy();
    
    res.json({ message: '教师删除成功' });
  } catch (error) {
    console.error('删除教师错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;