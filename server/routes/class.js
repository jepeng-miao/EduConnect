const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');

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

// 获取当前教师的所有班级
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

// 创建新班级
router.post('/classes', authTeacher, async (req, res) => {
  try {
    const { name, grade, description } = req.body;
    
    // 检查班级名称是否已存在
    const existingClass = await Class.findOne({ where: { name } });
    if (existingClass) {
      return res.status(400).json({ message: '班级名称已存在' });
    }
    
    const newClass = await Class.create({
      name,
      grade,
      description,
      teacherId: req.teacher.id
    });
    
    res.status(201).json({
      message: '班级创建成功',
      class: newClass
    });
  } catch (error) {
    console.error('创建班级错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取特定班级信息
router.get('/classes/:id', authTeacher, async (req, res) => {
  try {
    const classId = req.params.id;
    const classInfo = await Class.findOne({
      where: { 
        id: classId,
        teacherId: req.teacher.id
      }
    });
    
    if (!classInfo) {
      return res.status(404).json({ message: '班级不存在' });
    }
    
    res.json({ class: classInfo });
  } catch (error) {
    console.error('获取班级信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新班级信息
router.put('/classes/:id', authTeacher, async (req, res) => {
  try {
    const classId = req.params.id;
    const { name, grade, description } = req.body;
    
    const classInfo = await Class.findOne({
      where: { 
        id: classId,
        teacherId: req.teacher.id
      }
    });
    
    if (!classInfo) {
      return res.status(404).json({ message: '班级不存在' });
    }
    
    // 检查新名称是否与其他班级冲突
    if (name !== classInfo.name) {
      const existingClass = await Class.findOne({ where: { name } });
      if (existingClass) {
        return res.status(400).json({ message: '班级名称已存在' });
      }
    }
    
    await classInfo.update({ name, grade, description });
    
    res.json({
      message: '班级信息更新成功',
      class: classInfo
    });
  } catch (error) {
    console.error('更新班级信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除班级
router.delete('/classes/:id', authTeacher, async (req, res) => {
  try {
    const classId = req.params.id;
    
    const classInfo = await Class.findOne({
      where: { 
        id: classId,
        teacherId: req.teacher.id
      }
    });
    
    if (!classInfo) {
      return res.status(404).json({ message: '班级不存在' });
    }
    
    // 检查班级是否有学生
    const studentCount = await Student.count({ where: { classId } });
    if (studentCount > 0) {
      return res.status(400).json({ message: '班级中还有学生，无法删除' });
    }
    
    await classInfo.destroy();
    
    res.json({ message: '班级删除成功' });
  } catch (error) {
    console.error('删除班级错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取班级学生列表
router.get('/classes/:id/students', authTeacher, async (req, res) => {
  try {
    const classId = req.params.id;
    
    const classInfo = await Class.findOne({
      where: { 
        id: classId,
        teacherId: req.teacher.id
      }
    });
    
    if (!classInfo) {
      return res.status(404).json({ message: '班级不存在' });
    }
    
    const students = await Student.findAll({
      where: { classId }
    });
    
    // 自定义排序：先按学号长度排序，再按学号数值排序
    students.sort((a, b) => {
      // 检查是否为纯数字
      const aIsNum = /^\d+$/.test(a.studentId);
      const bIsNum = /^\d+$/.test(b.studentId);
      
      // 如果都是纯数字，先按长度排序，长度相同则按数值排序
      if (aIsNum && bIsNum) {
        if (a.studentId.length !== b.studentId.length) {
          return a.studentId.length - b.studentId.length;
        }
        return parseInt(a.studentId) - parseInt(b.studentId);
      }
      
      // 如果只有一个是纯数字，纯数字排前面
      if (aIsNum && !bIsNum) return -1;
      if (!aIsNum && bIsNum) return 1;
      
      // 都不是纯数字，按原始字符串排序
      return a.studentId.localeCompare(b.studentId);
    });
    
    res.json({ students });
  } catch (error) {
    console.error('获取班级学生列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加学生到班级
router.post('/classes/:id/students', authTeacher, async (req, res) => {
  try {
    const classId = req.params.id;
    const { students } = req.body; // 学生数组，包含studentId, name, email等信息
    
    const classInfo = await Class.findOne({
      where: { 
        id: classId,
        teacherId: req.teacher.id
      }
    });
    
    if (!classInfo) {
      return res.status(404).json({ message: '班级不存在' });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    // 批量处理学生信息
    for (const student of students) {
      try {
        // 检查学号是否已存在
        const existingStudent = await Student.findOne({
          where: { studentId: student.studentId }
        });
        
        if (existingStudent) {
          results.failed.push({
            studentId: student.studentId,
            reason: '学号已存在'
          });
          continue;
        }
        
        // 创建新学生
        const newStudent = await Student.create({
          studentId: student.studentId,
          name: student.name,
          email: student.email || null,
          classId
        });
        
        results.success.push({
          studentId: newStudent.studentId,
          name: newStudent.name
        });
      } catch (error) {
        results.failed.push({
          studentId: student.studentId,
          reason: '创建失败'
        });
      }
    }
    
    res.status(201).json({
      message: '学生添加处理完成',
      results
    });
  } catch (error) {
    console.error('添加学生错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 通过文本导入学生名单
router.post('/classes/:id/students/import-text', authTeacher, async (req, res) => {
  try {
    const classId = req.params.id;
    const { studentRecords } = req.body; // 包含学号和姓名的学生记录数组
    
    const classInfo = await Class.findOne({
      where: { 
        id: classId,
        teacherId: req.teacher.id
      }
    });
    
    if (!classInfo) {
      return res.status(404).json({ message: '班级不存在' });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    // 批量处理学生信息
    for (const record of studentRecords) {
      try {
        // 检查学号是否已存在
        const existingStudent = await Student.findOne({
          where: { studentId: record.studentId }
        });
        
        if (existingStudent) {
          results.failed.push({
            studentId: record.studentId,
            name: record.name,
            reason: '学号已存在'
          });
          continue;
        }
        
        // 创建新学生
        const newStudent = await Student.create({
          studentId: record.studentId,
          name: record.name,
          classId
        });
        
        results.success.push({
          studentId: newStudent.studentId,
          name: newStudent.name,
          status: '新增'
        });
      } catch (error) {
        results.failed.push({
          studentId: record.studentId || '未知',
          name: record.name || '未知',
          reason: '处理失败'
        });
      }
    }
    
    res.status(201).json({
      message: '学生导入处理完成',
      results
    });
  } catch (error) {
    console.error('导入学生错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 批量导入学生
router.post('/classes/:id/import-students', authTeacher, async (req, res) => {
  try {
    const classId = req.params.id;
    const { students } = req.body; // 学生数组，包含studentId, name, email等信息
    
    const classInfo = await Class.findOne({
      where: { 
        id: classId,
        teacherId: req.teacher.id
      }
    });
    
    if (!classInfo) {
      return res.status(404).json({ message: '班级不存在' });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    // 批量处理学生信息
    for (const student of students) {
      try {
        // 检查学号是否已存在
        const existingStudent = await Student.findOne({
          where: { studentId: student.studentId }
        });
        
        if (existingStudent) {
          // 如果学生已存在但不在当前班级，则更新班级
          if (existingStudent.classId !== parseInt(classId)) {
            await existingStudent.update({ classId });
            results.success.push({
              studentId: existingStudent.studentId,
              name: existingStudent.name,
              status: '已更新班级'
            });
          } else {
            results.failed.push({
              studentId: student.studentId,
              reason: '学生已在当前班级'
            });
          }
          continue;
        }
        
        // 创建新学生
        const newStudent = await Student.create({
          studentId: student.studentId,
          name: student.name,
          email: student.email || null,
          classId
        });
        
        results.success.push({
          studentId: newStudent.studentId,
          name: newStudent.name,
          status: '新增'
        });
      } catch (error) {
        results.failed.push({
          studentId: student.studentId,
          reason: '处理失败'
        });
      }
    }
    
    res.status(201).json({
      message: '学生导入处理完成',
      results
    });
  } catch (error) {
    console.error('导入学生错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除学生
router.delete('/students/:studentId', authTeacher, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findOne({
      where: { studentId }
    });
    
    if (!student) {
      return res.status(404).json({ message: '学生不存在' });
    }
    
    // 验证学生所在班级是否属于当前教师
    const classInfo = await Class.findOne({
      where: { 
        id: student.classId,
        teacherId: req.teacher.id
      }
    });
    
    if (!classInfo) {
      return res.status(403).json({ message: '无权操作此学生' });
    }
    
    await student.destroy();
    
    res.json({ message: '学生删除成功' });
  } catch (error) {
    console.error('删除学生错误:', error);
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