const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 登录路由
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找教师用户
    const teacher = await Teacher.findOne({ where: { username } });
    if (!teacher) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isMatch = await teacher.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 创建JWT令牌
    const token = jwt.sign(
      { id: teacher.id, username: teacher.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 设置cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24小时
    });

    // 返回成功响应
    res.json({
      message: '登录成功',
      teacher: {
        id: teacher.id,
        username: teacher.username,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 验证当前用户是否登录
router.get('/verify', async (req, res) => {
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

    res.json({
      teacher: {
        id: teacher.id,
        username: teacher.username,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department
      }
    });
  } catch (error) {
    res.status(401).json({ message: '会话已过期' });
  }
});

// 退出登录
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: '已退出登录' });
});

module.exports = router;