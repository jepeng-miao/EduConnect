const express = require('express');
const router = express.Router();
const CompetitionResult = require('../models/CompetitionResult');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { Op } = require('sequelize');

// 获取所有比赛结果
router.get('/results', async (req, res) => {
  try {
    const results = await CompetitionResult.findAll({
      include: [
        {
          model: Student,
          attributes: ['name', 'studentId'],
        }
      ],
      order: [['competitionDate', 'DESC']]
    });
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('获取比赛结果失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取特定班级的比赛结果，支持按内容和时间筛选
router.get('/results/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { text, startDate, endDate } = req.query;
    
    // 构建查询条件
    const whereCondition = { classId };
    
    // 如果有文本搜索参数，添加到查询条件
    if (text) {
      whereCondition.competitionText = {
        [Op.like]: `%${text}%`
      };
    }
    
    // 如果有日期范围参数，添加到查询条件
    if (startDate || endDate) {
      whereCondition.competitionDate = {};
      
      if (startDate) {
        whereCondition.competitionDate[Op.gte] = new Date(startDate);
      }
      
      if (endDate) {
        // 将结束日期设置为当天的23:59:59，以包含整天
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereCondition.competitionDate[Op.lte] = endDateTime;
      }
    }
    
    const results = await CompetitionResult.findAll({
      where: whereCondition,
      include: [
        {
          model: Student,
          attributes: ['name', 'studentId'],
        }
      ],
      order: [['competitionDate', 'DESC']]
    });
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('获取班级比赛结果失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取特定学生的比赛结果
router.get('/results/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { text, startDate, endDate } = req.query;
    
    // 构建查询条件
    const whereCondition = { studentId };
    
    // 如果有文本搜索参数，添加到查询条件
    if (text) {
      whereCondition.competitionText = {
        [Op.like]: `%${text}%`
      };
    }
    
    // 如果有日期范围参数，添加到查询条件
    if (startDate || endDate) {
      whereCondition.competitionDate = {};
      
      if (startDate) {
        whereCondition.competitionDate[Op.gte] = new Date(startDate);
      }
      
      if (endDate) {
        // 将结束日期设置为当天的23:59:59，以包含整天
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereCondition.competitionDate[Op.lte] = endDateTime;
      }
    }
    
    const results = await CompetitionResult.findAll({
      where: whereCondition,
      include: [
        {
          model: Student,
          attributes: ['name', 'studentId'],
        }
      ],
      order: [['competitionDate', 'DESC']]
    });
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('获取学生比赛结果失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 保存比赛结果
router.post('/results', async (req, res) => {
  try {
    const { results, competitionText, classId } = req.body;
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ success: false, message: '无效的比赛结果数据' });
    }
    
    // 批量创建比赛结果记录
    const savedResults = await Promise.all(
      results.map(result => 
        CompetitionResult.create({
          studentId: result.studentId,
          classId,
          competitionText,
          accuracy: result.accuracy,
          progress: result.progress || 100,
          completionTime: result.completionTime
        })
      )
    );
    
    res.json({ success: true, message: '比赛结果保存成功', count: savedResults.length });
  } catch (error) {
    console.error('保存比赛结果失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;