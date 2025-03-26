const express = require('express');
const { Op } = require('sequelize');
const TaskLog = require('../models/TaskLog');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');
const router = express.Router();

// 中间件：验证教师身份
const authTeacher = async (req, res, next) => {
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

    req.teacher = teacher;
    next();
  } catch (error) {
    res.status(401).json({ message: '会话已过期' });
  }
};

// 获取班级列表
router.get('/classes', authTeacher, async (req, res) => {
  try {
    const classes = await Class.findAll({
      where: { teacherId: req.teacher.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ classes });
  } catch (error) {
    console.error('获取班级列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取情绪卡片任务日志
router.get('/emotion-logs', async (req, res) => {
  try {
    const { classId, startDate, endDate, groupByDate } = req.query;
    
    // 构建查询条件
    const where = {
      taskId: 'emotion-cards',
      taskStatus: 'completed'
    };
    
    // 如果指定了班级ID，添加到查询条件
    if (classId) {
      where.classId = classId;
    }
    
    // 如果指定了日期范围，添加到查询条件
    if (startDate && endDate) {
      where.completedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // 查询任务日志
    const logs = await TaskLog.findAll({
      where,
      include: [
        {
          model: Student,
          attributes: ['studentId', 'name']
        },
        {
          model: Class,
          attributes: ['id', 'name', 'grade']
        }
      ],
      order: [['completedAt', 'DESC']]
    });
    
    // 如果需要按日期分组
    if (groupByDate === 'true') {
      // 按日期分组日志
      const batchesByDate = {};
      
      logs.forEach(log => {
        // 使用日期作为批次标识（不包含时间）
        const date = new Date(log.completedAt);
        // 使用日期的ISO字符串作为键
        const dateKey = date.toISOString();
        
        if (!batchesByDate[dateKey]) {
          batchesByDate[dateKey] = {
            date: dateKey,
            count: 0,
            logs: []
          };
        }
        
        batchesByDate[dateKey].logs.push(log);
        batchesByDate[dateKey].count++;
      });
      
      // 转换为数组并按日期降序排序
      const batches = Object.values(batchesByDate).sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      
      res.json({ batches });
    } else {
      res.json({ logs });
    }
  } catch (error) {
    console.error('获取情绪卡片日志失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取学生信息（用于学生登录验证）
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findOne({
      where: { studentId },
      include: [{
        model: Class,
        attributes: ['id', 'name', 'grade']
      }]
    });
    
    if (!student) {
      return res.status(404).json({ message: '学生不存在' });
    }
    
    res.json({
      student: {
        studentId: student.studentId,
        name: student.name,
        class: student.Class
      }
    });
  } catch (error) {
    console.error('获取学生信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;