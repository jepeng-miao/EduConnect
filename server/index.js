const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const initDefaultTeacher = require('./scripts/initDefaultTeacher');

// 加载环境变量
dotenv.config();

const app = express();

// 中间件配置
app.use(cors({
  origin: true, // 允许所有来源访问
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 路由配置
app.use('/api/auth', require('./routes/auth'));
app.use('/api/manage', require('./routes/manage'));
app.use('/api/class', require('./routes/class'));
app.use('/api/competition', require('./routes/competition'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/group', require('./routes/group'));

// 初始化默认教师账号
initDefaultTeacher().catch(console.error);

const PORT = process.env.PORT || 5002;

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true, // 允许所有来源访问
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 存储当前活动的比赛信息
let activeCompetition = null;
// 存储当前选定的班级信息
let selectedClass = null;
// 存储已登录的学生列表及其socket连接
let loggedInStudents = new Map(); // 存储格式: studentId -> socketId
// 存储学生最后心跳时间
let lastHeartbeats = new Map(); // 存储格式: studentId -> timestamp
// 存储可用的任务类型
const availableTasks = [
  {
    id: 'typing-game',
    title: '打字比赛',
    description: '参与实时打字比赛，提高打字速度和准确率',
    icon: 'SportsEsports',
    color: '#bbdefb'
  },
  {
    id: 'qrcode-scanner',
    title: '二维码识别',
    description: '上传图片识别二维码内容，快速获取二维码信息',
    icon: 'QrCode',
    color: '#b2dfdb'
  },
  {
    id: 'emotion-cards',
    title: '情绪卡片',
    description: '选择当前情绪状态，帮助教师了解学生心理健康',
    icon: 'Psychology',
    color: '#e1bee7'
  },
  {
    id: 'image-filter',
    title: '图片滤镜',
    description: '上传图片并应用各种滤镜效果，调整图片的亮度、对比度和饱和度',
    icon: 'FilterAlt',
    color: '#ffccbc'
  }
];
// 存储当前活动的任务
let activeTasks = [];

// WebSocket事件处理
io.on('connection', (socket) => {
  console.log('用户已连接:', socket.id);
  
  // 如果已经有选定的班级，立即发送给新连接的客户端
  if (selectedClass) {
    socket.emit('class_selected', { 
      classId: selectedClass.id,
      className: selectedClass.name 
    });
  }
  
  // 客户端请求获取当前选定的班级信息
  socket.on('get_selected_class', () => {
    if (selectedClass) {
      socket.emit('class_selected', { 
        classId: selectedClass.id,
        className: selectedClass.name 
      });
    }
  });

  // 教师选择班级
  socket.on('select_class', (data) => {
    const previousClassId = selectedClass?.id;
    
    console.log(`教师选择班级: ${data.className}(ID: ${data.classId})，之前班级ID: ${previousClassId || '无'}`);
    
    selectedClass = {
      id: data.classId,
      name: data.className
    };
    
    // 广播班级选择信息给所有连接的客户端
    console.log(`广播班级选择事件: classId=${data.classId}, className=${data.className}`);
    io.emit('class_selected', { 
      classId: data.classId,
      className: data.className 
    });
    
    // 发送可用任务列表给学生
    socket.broadcast.emit('available_tasks', {
      tasks: availableTasks,
      active: activeTasks
    });
    
    // 如果班级变更，强制登出之前班级的所有学生
    if (previousClassId && previousClassId !== data.classId) {
      console.log(`班级已变更: 从 ${previousClassId} 到 ${data.classId}，强制登出所有学生`);
      // 获取所有已登录的学生
      for (const [studentId, socketId] of loggedInStudents.entries()) {
        // 获取学生的socket连接
        const studentSocket = io.sockets.sockets.get(socketId);
        if (studentSocket) {
          // 通知学生被强制登出
          studentSocket.emit('force_logout');
          console.log(`已强制登出学生: ${studentId}`);
        }
      }
      // 清空已登录学生列表
      loggedInStudents.clear();
      // 广播所有学生已登出
      io.emit('all_students_logged_out');
    }
  });

  // 教师创建新比赛
  socket.on('create_competition', (data) => {
    activeCompetition = {
      text: data.text,
      duration: data.duration,
      startTime: null,
      participants: new Map(),
      results: [],
      classId: data.classId,
      className: data.className
    };
    selectedClass = {
      id: data.classId,
      name: data.className
    };
    
    // 添加到活动任务列表
    const typingGameTask = availableTasks.find(task => task.id === 'typing-game');
    if (typingGameTask && !activeTasks.some(task => task.id === 'typing-game')) {
      activeTasks.push({
        ...typingGameTask,
        active: true,
        data: {
          duration: data.duration,
          classId: data.classId,
          className: data.className
        }
      });
    }
    
    io.emit('competition_created', { 
      duration: data.duration,
      classId: data.classId,
      className: data.className
    });
    
    // 通知学生有新任务可用
    io.emit('task_available', {
      taskId: 'typing-game',
      taskName: '打字比赛',
      active: true
    });
    
    // 向所有已连接的学生发送更新的任务列表
    io.emit('available_tasks', {
      tasks: availableTasks,
      active: activeTasks
    });
  });
  

  // 学生加入任务
  socket.on('join_task', async (data) => {
    if (data.taskId === 'typing-game') {
      // 如果有活动比赛，则让学生加入比赛
      if (activeCompetition) {
        const elapsedTime = activeCompetition.startTime ? Math.floor((Date.now() - activeCompetition.startTime) / 1000) : 0;
        const remainingTime = activeCompetition.startTime ? Math.max(0, activeCompetition.duration - elapsedTime) : activeCompetition.duration;
        
        // 将学生添加到参与者列表
        activeCompetition.participants.set(socket.id, {
          studentId: data.studentId,
          progress: 0,
          accuracy: 0,
          completed: false
        });
        
        // 发送比赛信息给学生
        socket.emit('task_joined', {
          taskId: 'typing-game',
          text: activeCompetition.text,
          duration: remainingTime,
          isStarted: !!activeCompetition.startTime
        });
      } else {
        // 如果没有活动比赛，通知学生等待
        socket.emit('task_joined', {
          taskId: 'typing-game',
          waiting: true,
          message: '请等待教师开始比赛'
        });
      }
    } else if (data.taskId === 'qrcode-scanner') {
      // 学生加入二维码扫描任务
      socket.emit('task_joined', {
        taskId: 'qrcode-scanner',
        message: '二维码扫描任务已准备就绪'
      });
    }
  });

  
  // 学生加入比赛
  socket.on('join_competition', async (data) => {
    // 首先检查是否有选定的班级
    if (!selectedClass) {
      socket.emit('join_error', { message: '教师尚未选择班级，请稍后再试', noClass: true });
      return;
    }
    
    // 如果学生已经登录，先处理之前的登录状态
    if (loggedInStudents.has(data.studentId)) {
      // 获取之前登录的socket ID
      const previousSocketId = loggedInStudents.get(data.studentId);
      // 如果不是同一个socket连接，则强制之前的连接登出
      if (previousSocketId !== socket.id) {
        const previousSocket = io.sockets.sockets.get(previousSocketId);
        if (previousSocket) {
          previousSocket.emit('force_logout');
        }
        io.emit('student_logged_out', { studentId: data.studentId });
      } else {
        // 如果是同一个socket连接，可能是页面刷新，直接继续处理
      }
    }
    try {
      // 验证学生信息 - 直接使用应用程序的路由处理程序
      const Student = require('./models/Student');
      const Class = require('./models/Class');
      
      const student = await Student.findOne({
        where: { studentId: data.studentId },
        include: [{
          model: Class,
          attributes: ['id', 'name', 'grade']
        }]
      });
      
      if (!student) {
        socket.emit('join_error', { message: '学号不存在' });
        return;
      }
      
      const studentClass = student.Class;
      const studentData = {
        student: {
          studentId: student.studentId,
          name: student.name,
          class: studentClass
        }
      };
      
      // 首先验证学生是否属于当前选定的班级
      if (studentClass && studentClass.id !== selectedClass.id) {
        socket.emit('join_error', { message: '您不属于当前选定的班级' });
        return;
      }
      
      // 如果有活动比赛且学生属于比赛班级
      if (activeCompetition && studentClass && studentClass.id === activeCompetition.classId) {
        activeCompetition.participants.set(socket.id, {
          studentId: data.studentId,
          progress: 0,
          accuracy: 0,
          completed: false
        });
        
        const elapsedTime = activeCompetition.startTime ? Math.floor((Date.now() - activeCompetition.startTime) / 1000) : 0;
        const remainingTime = activeCompetition.startTime ? Math.max(0, activeCompetition.duration - elapsedTime) : activeCompetition.duration;
        
        socket.emit('competition_joined', {
          text: activeCompetition.text,
          duration: remainingTime,
          isStarted: !!activeCompetition.startTime,
          classInfo: {
            id: activeCompetition.classId,
            name: activeCompetition.className
          }
        });
        
        // 添加到已登录学生列表并广播学生登录事件
        loggedInStudents.set(data.studentId, socket.id);
        // 初始化学生心跳时间
        lastHeartbeats.set(data.studentId, Date.now());
        io.emit('student_logged_in', { studentId: data.studentId });
      } 
      // 如果有选定班级且学生属于该班级
      else if (studentClass && studentClass.id === selectedClass.id) {
        // 告知学生等待比赛创建
        socket.emit('waiting_for_competition', { 
          classInfo: {
            id: selectedClass.id,
            name: selectedClass.name
          }
        });
        
        // 发送可用任务列表给学生
        socket.emit('available_tasks', {
          tasks: availableTasks,
          active: activeTasks,
          studentInfo: studentData.student
        });
        
        // 添加到已登录学生列表并广播学生登录事件
        loggedInStudents.set(data.studentId, socket.id);
        // 初始化学生心跳时间
        lastHeartbeats.set(data.studentId, Date.now());
        io.emit('student_logged_in', { studentId: data.studentId });
      } 
      // 如果学生不属于当前选定的班级
      else {
        socket.emit('join_error', { message: '您不属于当前选定的班级' });
      }
    } catch (error) {
      console.error('验证学生班级失败:', error);
      socket.emit('join_error', { message: '验证学生信息失败' });
    }
  });


  // 开始比赛
  socket.on('start_competition', () => {
    if (activeCompetition) {
      activeCompetition.startTime = Date.now();
      io.emit('competition_started');

      // 设置比赛结束定时器
      activeCompetition.timer = setTimeout(async () => {
        if (activeCompetition) {
          // 保存比赛结果到数据库
          try {
            const response = await fetch('http://localhost:5002/api/competition/results', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                results: activeCompetition.results,
                competitionText: activeCompetition.text,
                classId: activeCompetition.classId
              })
            });

            if (!response.ok) {
              console.error('保存比赛结果失败');
            }
          } catch (error) {
            console.error('保存比赛结果失败:', error);
          }

          io.emit('competition_ended', { results: Array.from(activeCompetition.results) });
          activeCompetition = null;
          
          // 从活动任务列表中移除打字比赛
          activeTasks = activeTasks.filter(task => task.id !== 'typing-game');
          
          // 通知所有客户端任务列表更新
          io.emit('available_tasks', {
            tasks: availableTasks,
            active: activeTasks
          });
        }
      }, activeCompetition.duration * 1000);
    }
  });
  
  // 手动结束比赛
  socket.on('end_competition', async () => {
    if (activeCompetition) {
      // 清除自动结束定时器
      if (activeCompetition.timer) {
        clearTimeout(activeCompetition.timer);
      }
      
      // 保存比赛结果到数据库
      try {
        const response = await fetch('http://localhost:5002/api/competition/results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            results: activeCompetition.results,
            competitionText: activeCompetition.text,
            classId: activeCompetition.classId
          })
        });

        if (!response.ok) {
          console.error('保存比赛结果失败');
        }
      } catch (error) {
        console.error('保存比赛结果失败:', error);
      }

      io.emit('competition_ended', { results: Array.from(activeCompetition.results) });
      activeCompetition = null;
      
      // 从活动任务列表中移除打字比赛
      activeTasks = activeTasks.filter(task => task.id !== 'typing-game');
      
      // 通知所有客户端任务列表更新
      io.emit('available_tasks', {
        tasks: availableTasks,
        active: activeTasks
      });
    }
  });

  // 处理发布任务（从教师端发送）
  socket.on('publish_task', (data) => {
    console.log(`收到发布任务请求:`, data);
    // 将publish_task事件映射到toggle_task的处理逻辑
    const { taskId, active, classId, className } = data;
    
    // 查找任务是否已在活动任务列表中
    const existingTaskIndex = activeTasks.findIndex(task => task.id === taskId);
    const taskDefinition = availableTasks.find(task => task.id === taskId);
    
    if (!taskDefinition) {
      console.error(`未找到任务定义: ${taskId}`);
      return;
    }
    
    if (active) {
      // 如果要激活任务，且任务不在活动列表中，则添加
      if (existingTaskIndex === -1) {
        activeTasks.push({
          ...taskDefinition,
          active: true
        });
        console.log(`任务 ${taskId} 已添加到活动任务列表`);
      } else {
        // 如果任务已在列表中，更新其状态
        activeTasks[existingTaskIndex].active = true;
        console.log(`任务 ${taskId} 状态已更新为活动`);
      }
    } else {
      // 如果要停用任务，且任务在活动列表中，则移除
      if (existingTaskIndex !== -1) {
        activeTasks.splice(existingTaskIndex, 1);
        console.log(`任务 ${taskId} 已从活动任务列表中移除`);
      }
    }
    
    // 广播任务状态更新给所有客户端
    io.emit('task_status_update', {
      taskId,
      active
    });
    
    // 更新可用任务列表
    io.emit('available_tasks', {
      tasks: availableTasks,
      active: activeTasks
    });
  });
  
  // 处理任务状态切换
  socket.on('toggle_task', (data) => {
    console.log(`收到任务状态切换请求:`, data);
    const { taskId, active, showInTaskbar } = data;
    
    // 查找任务是否已在活动任务列表中
    const existingTaskIndex = activeTasks.findIndex(task => task.id === taskId);
    const taskDefinition = availableTasks.find(task => task.id === taskId);
    
    if (!taskDefinition) {
      console.error(`未找到任务定义: ${taskId}`);
      return;
    }
    
    if (active) {
      // 如果要激活任务，且任务不在活动列表中，则添加
      if (existingTaskIndex === -1) {
        activeTasks.push({
          ...taskDefinition,
          active: true
        });
        console.log(`任务 ${taskId} 已添加到活动任务列表`);
      } else {
        // 如果任务已在列表中，更新其状态
        activeTasks[existingTaskIndex].active = true;
        console.log(`任务 ${taskId} 状态已更新为活动`);
      }
    } else {
      // 如果要停用任务，且任务在活动列表中，则移除
      if (existingTaskIndex !== -1) {
        activeTasks.splice(existingTaskIndex, 1);
        console.log(`任务 ${taskId} 已从活动任务列表中移除`);
      }
    }
    
    // 广播任务状态更新给所有客户端
    io.emit('task_status_update', {
      taskId,
      active,
      showInTaskbar
    });
    
    // 更新可用任务列表
    io.emit('available_tasks', {
      tasks: availableTasks,
      active: activeTasks
    });
  });
  
  // 处理任务状态检查
  socket.on('check_task_status', (data) => {
    console.log(`收到任务状态检查请求:`, data);
    const { taskId } = data;
    
    // 检查任务是否在活动任务列表中
    const isActive = activeTasks.some(task => task.id === taskId && task.active);
    
    // 发送任务状态给请求的客户端
    socket.emit('task_status_result', {
      taskId,
      active: isActive
    });
  });

  // 处理学生提交情绪
  socket.on('submit_emotion', async (data) => {
    const { studentId, emotionId, emotionName } = data;
    
    try {
      // 检查任务是否处于活动状态
      const isTaskActive = activeTasks.some(task => task.id === 'emotion-cards' && task.active);
      if (!isTaskActive) {
        socket.emit('emotion_submission_result', {
          success: false,
          message: '情绪卡片任务当前未激活'
        });
        return;
      }

      // 检查是否有选定的班级
      if (!selectedClass) {
        socket.emit('emotion_submission_result', {
          success: false,
          message: '教师尚未选择班级，请稍后再试'
        });
        return;
      }

      // 获取学生所在班级信息
      const Student = require('./models/Student');
      const student = await Student.findOne({
        where: { studentId },
        attributes: ['classId']
      });

      if (!student) {
        socket.emit('emotion_submission_result', {
          success: false,
          message: '未找到学生信息'
        });
        return;
      }

      // 验证学生是否属于当前选定的班级
      if (student.classId !== selectedClass.id) {
        socket.emit('emotion_submission_result', {
          success: false,
          message: '您不属于当前选定的班级'
        });
        return;
      }

      // 保存情绪选择到任务日志
      const TaskLog = require('./models/TaskLog');
      try {
        await TaskLog.create({
          taskId: 'emotion-cards',
          taskType: '情绪卡片',
          studentId,
          classId: student.classId,
          taskResult: {
            emotionId,
            emotionName
          },
          taskStatus: 'completed',
          completedAt: new Date()
        });

        // 发送提交成功响应
        socket.emit('emotion_submission_result', {
          success: true,
          message: '情绪提交成功'
        });
        
        console.log(`学生 ${studentId} 成功提交情绪: ${emotionName}`);
      } catch (dbError) {
        console.error('保存情绪选择到数据库失败:', dbError);
        socket.emit('emotion_submission_result', {
          success: false,
          message: '提交失败，数据库操作错误'
        });
      }

    } catch (error) {
      console.error('保存情绪选择失败:', error);
      let errorMessage = '提交失败，请稍后重试';
      
      // 提供更具体的错误信息
      if (error.name === 'SequelizeValidationError') {
        errorMessage = '数据验证失败，请检查提交的信息';
      } else if (error.name === 'SequelizeConnectionError') {
        errorMessage = '数据库连接错误，请稍后重试';
      } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        errorMessage = '关联数据错误，请确认学生信息正确';
      }
      
      socket.emit('emotion_submission_result', {
        success: false,
        message: errorMessage
      });
    }
  });

  // 更新学生进度
  socket.on('update_progress', (data) => {
    if (activeCompetition && activeCompetition.participants.has(socket.id)) {
      const participant = activeCompetition.participants.get(socket.id);
      participant.progress = data.progress;
      participant.accuracy = data.accuracy;

      if (data.progress === 100 && !participant.completed) {
        participant.completed = true;
        activeCompetition.results.push({
          studentId: participant.studentId,
          accuracy: participant.accuracy,
          completionTime: Date.now() - activeCompetition.startTime
        });
      }

      io.emit('progress_updated', {
        studentId: participant.studentId,
        progress: data.progress,
        accuracy: data.accuracy
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('用户已断开连接:', socket.id);
    if (activeCompetition) {
      const participant = activeCompetition.participants.get(socket.id);
      if (participant) {
        // 不立即删除学生登录状态，允许重连
        // 广播学生暂时离线
        io.emit('student_temporarily_offline', { studentId: participant.studentId });
        activeCompetition.participants.delete(socket.id);
      }
    }
    
    // 查找是否有学生使用此socket连接
    for (const [studentId, socketId] of loggedInStudents.entries()) {
      if (socketId === socket.id) {
        // 不立即删除学生登录状态，允许重连
        // 广播学生暂时离线
        io.emit('student_temporarily_offline', { studentId });
        break;
      }
    }
  });
  
  // 学生主动登出
  socket.on('logout', (data) => {
    if (data.studentId && loggedInStudents.has(data.studentId)) {
      loggedInStudents.delete(data.studentId);
      lastHeartbeats.delete(data.studentId);
      io.emit('student_logged_out', { studentId: data.studentId });
    }
  });
  
  // 处理学生心跳
  socket.on('heartbeat', (data) => {
    if (data.studentId && loggedInStudents.has(data.studentId)) {
      // 更新学生最后心跳时间
      lastHeartbeats.set(data.studentId, Date.now());
    }
  });
});

// 添加心跳检测定时器，每5秒检查一次
setInterval(() => {
  const now = Date.now();
  // 检查所有已登录学生的心跳状态
  for (const [studentId, socketId] of loggedInStudents.entries()) {
    const lastHeartbeat = lastHeartbeats.get(studentId) || 0;
    // 如果超过10秒未收到心跳，则认为学生离线
    if (now - lastHeartbeat > 10000) {
      // 获取学生的socket连接
      const studentSocket = io.sockets.sockets.get(socketId);
      if (studentSocket) {
        // 通知教师端学生离线
        io.emit('student_offline', { studentId });
        console.log(`学生 ${studentId} 超过10秒未发送心跳，标记为离线`);
      }
    }
  }
}, 5000);

const startServer = () => {
  return new Promise((resolve, reject) => {
    try {
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`服务器运行在端口 ${PORT}`);
        resolve();
      });

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`端口 ${PORT} 已被占用，请关闭占用该端口的程序后重试。`);
        } else {
          console.error('服务器启动失败:', error);
        }
        reject(error);
      });
    } catch (error) {
      console.error('服务器启动失败:', error);
      reject(error);
    }
  });
};

// 启动服务器
startServer().catch(err => {
  console.error('无法启动服务器:', err);
  process.exit(1);
});