const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Student = require('../models/Student');
const StudentGroup = require('../models/StudentGroup');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

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

// 获取班级的所有分组
router.get('/classes/:classId/groups', authTeacher, async (req, res) => {
  try {
    const classId = req.params.classId;
    
    // 验证班级是否属于当前教师
    const classInfo = await Class.findOne({
      where: { 
        id: classId,
        teacherId: req.teacher.id
      }
    });
    
    if (!classInfo) {
      return res.status(404).json({ message: '班级不存在或无权访问' });
    }
    
    // 获取班级的所有分组
    const groups = await Group.findAll({
      where: { classId },
      order: [['createdAt', 'DESC']]
    });
    
    // 获取每个分组的学生数量
    const groupsWithStudentCount = await Promise.all(groups.map(async (group) => {
      const studentCount = await StudentGroup.count({
        where: { groupId: group.id }
      });
      
      return {
        ...group.toJSON(),
        studentCount
      };
    }));
    
    res.json({ groups: groupsWithStudentCount });
  } catch (error) {
    console.error('获取分组列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建新分组
router.post('/classes/:classId/groups', authTeacher, async (req, res) => {
  try {
    const classId = req.params.classId;
    const { name, description } = req.body;
    
    // 验证班级是否属于当前教师
    const classInfo = await Class.findOne({
      where: { 
        id: classId,
        teacherId: req.teacher.id
      }
    });
    
    if (!classInfo) {
      return res.status(404).json({ message: '班级不存在或无权访问' });
    }
    
    // 检查分组名称是否已存在于该班级
    const existingGroup = await Group.findOne({ 
      where: { 
        name,
        classId 
      } 
    });
    
    if (existingGroup) {
      return res.status(400).json({ message: '分组名称已存在' });
    }
    
    // 创建新分组
    const newGroup = await Group.create({
      name,
      description,
      classId
    });
    
    res.status(201).json({
      message: '分组创建成功',
      group: newGroup
    });
  } catch (error) {
    console.error('创建分组错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取分组详情及其学生
router.get('/groups/:groupId', authTeacher, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // 获取分组信息
    const group = await Group.findByPk(groupId, {
      include: [{
        model: Class,
        attributes: ['id', 'name', 'teacherId']
      }]
    });
    
    if (!group) {
      return res.status(404).json({ message: '分组不存在' });
    }
    
    // 验证班级是否属于当前教师
    if (group.Class.teacherId !== req.teacher.id) {
      return res.status(403).json({ message: '无权访问此分组' });
    }
    
    // 获取分组中的学生
    const studentGroups = await StudentGroup.findAll({
      where: { groupId },
      include: [{
        model: Student,
        attributes: ['studentId', 'name']
      }]
    });
    
    const students = studentGroups.map(sg => sg.Student);
    
    res.json({
      group,
      students
    });
  } catch (error) {
    console.error('获取分组详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新分组信息
router.put('/groups/:groupId', authTeacher, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { name, description } = req.body;
    
    // 获取分组信息
    const group = await Group.findByPk(groupId, {
      include: [{
        model: Class,
        attributes: ['id', 'name', 'teacherId']
      }]
    });
    
    if (!group) {
      return res.status(404).json({ message: '分组不存在' });
    }
    
    // 验证班级是否属于当前教师
    if (group.Class.teacherId !== req.teacher.id) {
      return res.status(403).json({ message: '无权访问此分组' });
    }
    
    // 检查新名称是否与其他分组冲突
    if (name !== group.name) {
      const existingGroup = await Group.findOne({ 
        where: { 
          name,
          classId: group.classId,
          id: { [Op.ne]: groupId }
        } 
      });
      
      if (existingGroup) {
        return res.status(400).json({ message: '分组名称已存在' });
      }
    }
    
    // 更新分组信息
    await group.update({ name, description });
    
    res.json({
      message: '分组信息更新成功',
      group
    });
  } catch (error) {
    console.error('更新分组信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除分组
router.delete('/groups/:groupId', authTeacher, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // 获取分组信息
    const group = await Group.findByPk(groupId, {
      include: [{
        model: Class,
        attributes: ['id', 'name', 'teacherId']
      }]
    });
    
    if (!group) {
      return res.status(404).json({ message: '分组不存在' });
    }
    
    // 验证班级是否属于当前教师
    if (group.Class.teacherId !== req.teacher.id) {
      return res.status(403).json({ message: '无权访问此分组' });
    }
    
    // 删除分组中的所有学生关联
    await StudentGroup.destroy({ where: { groupId } });
    
    // 删除分组
    await group.destroy();
    
    res.json({ message: '分组删除成功' });
  } catch (error) {
    console.error('删除分组错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 将学生添加到分组
router.post('/groups/:groupId/students', authTeacher, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { studentIds } = req.body;
    
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: '请提供有效的学生ID列表' });
    }
    
    // 获取分组信息
    const group = await Group.findByPk(groupId, {
      include: [{
        model: Class,
        attributes: ['id', 'name', 'teacherId']
      }]
    });
    
    if (!group) {
      return res.status(404).json({ message: '分组不存在' });
    }
    
    // 验证班级是否属于当前教师
    if (group.Class.teacherId !== req.teacher.id) {
      return res.status(403).json({ message: '无权访问此分组' });
    }
    
    // 验证所有学生是否存在且属于同一班级
    const students = await Student.findAll({
      where: {
        studentId: { [Op.in]: studentIds },
        classId: group.classId
      }
    });
    
    if (students.length !== studentIds.length) {
      return res.status(400).json({ message: '部分学生不存在或不属于该班级' });
    }
    
    // 检查学生是否已在分组中
    const existingStudents = await StudentGroup.findAll({
      where: {
        groupId,
        studentId: { [Op.in]: studentIds }
      }
    });
    
    // 过滤出尚未在分组中的学生
    const existingStudentIds = existingStudents.map(es => es.studentId);
    const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id));
    
    if (newStudentIds.length === 0) {
      return res.status(400).json({ message: '所有学生已在分组中' });
    }
    
    // 创建学生与分组的关联
    const studentGroups = newStudentIds.map(studentId => ({
      studentId,
      groupId
    }));
    
    await StudentGroup.bulkCreate(studentGroups);
    
    res.json({
      message: '学生已成功添加到分组',
      count: newStudentIds.length
    });
  } catch (error) {
    console.error('添加学生到分组错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 从分组中移除学生
router.delete('/groups/:groupId/students/:studentId', authTeacher, async (req, res) => {
  try {
    const { groupId, studentId } = req.params;
    
    // 获取分组信息
    const group = await Group.findByPk(groupId, {
      include: [{
        model: Class,
        attributes: ['id', 'name', 'teacherId']
      }]
    });
    
    if (!group) {
      return res.status(404).json({ message: '分组不存在' });
    }
    
    // 验证班级是否属于当前教师
    if (group.Class.teacherId !== req.teacher.id) {
      return res.status(403).json({ message: '无权访问此分组' });
    }
    
    // 验证学生是否在分组中
    const studentGroup = await StudentGroup.findOne({
      where: { 
        groupId,
        studentId 
      }
    });
    
    if (!studentGroup) {
      return res.status(404).json({ message: '该学生不在此分组中' });
    }
    
    // 从分组中移除学生
    await studentGroup.destroy();
    
    res.json({ message: '学生已从分组中移除' });
  } catch (error) {
    console.error('从分组移除学生错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 批量从分组中移除学生
router.delete('/groups/:groupId/students/batch', authTeacher, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { studentIds } = req.body;
    
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: '请提供有效的学生ID列表' });
    }
    
    // 获取分组信息
    const group = await Group.findByPk(groupId, {
      include: [{
        model: Class,
        attributes: ['id', 'name', 'teacherId']
      }]
    });
    
    if (!group) {
      return res.status(404).json({ message: '分组不存在' });
    }
    
    // 验证班级是否属于当前教师
    if (group.Class.teacherId !== req.teacher.id) {
      return res.status(403).json({ message: '无权访问此分组' });
    }
    
    // 批量删除学生与分组的关联
    const deletedCount = await StudentGroup.destroy({
      where: { 
        groupId,
        studentId: studentIds
      }
    });
    
    res.json({ 
      message: `已从分组中移除 ${deletedCount} 名学生`,
      deletedCount
    });
  } catch (error) {
    console.error('批量从分组移除学生错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 按人数自动分组
router.post('/classes/:classId/auto-group', authTeacher, async (req, res) => {
  try {
    const classId = req.params.classId;
    const { studentsPerGroup, groupPrefix } = req.body;
    
    // 验证参数
    if (!studentsPerGroup || studentsPerGroup < 1) {
      return res.status(400).json({ message: '每组人数必须大于0' });
    }
    
    // 验证班级是否属于当前教师
    const classInfo = await Class.findOne({
      where: { 
        id: classId,
        teacherId: req.teacher.id
      }
    });
    
    if (!classInfo) {
      return res.status(404).json({ message: '班级不存在或无权访问' });
    }
    
    // 获取班级所有学生
    const students = await Student.findAll({
      where: { classId },
      order: [['studentId', 'ASC']] // 按学号排序
    });
    
    if (students.length === 0) {
      return res.status(400).json({ message: '班级中没有学生' });
    }
    
    // 计算需要创建的分组数量
    const groupCount = Math.ceil(students.length / studentsPerGroup);
    const prefix = groupPrefix || '分组';
    
    // 创建分组并分配学生
    const createdGroups = [];
    
    for (let i = 0; i < groupCount; i++) {
      // 创建分组
      const groupName = `${prefix}${i + 1}`;
      
      const newGroup = await Group.create({
        name: groupName,
        description: `按每组${studentsPerGroup}人自动分配的分组`,
        classId
      });
      
      // 计算当前分组的学生范围
      const startIndex = i * studentsPerGroup;
      const endIndex = Math.min((i + 1) * studentsPerGroup, students.length);
      const groupStudents = students.slice(startIndex, endIndex);
      
      // 将学生添加到分组
      if (groupStudents.length > 0) {
        const studentIds = groupStudents.map(student => student.studentId);
        
        // 创建学生与分组的关联
        const studentGroups = studentIds.map(studentId => ({
          studentId,
          groupId: newGroup.id
        }));
        
        await StudentGroup.bulkCreate(studentGroups);
      }
      
      createdGroups.push({
        ...newGroup.toJSON(),
        studentCount: groupStudents.length
      });
    }
    
    res.status(201).json({
      message: `成功创建${groupCount}个分组，按每组${studentsPerGroup}人分配`,
      groups: createdGroups
    });
  } catch (error) {
    console.error('自动分组错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;