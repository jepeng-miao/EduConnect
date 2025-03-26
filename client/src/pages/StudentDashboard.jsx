import { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, LinearProgress, Alert, Divider, Chip, Grid, Card, CardContent, Tabs, Tab } from '@mui/material';
import { socket } from '../main';
import { School as SchoolIcon, EmojiEvents as TrophyIcon, Person as PersonIcon, Class as ClassIcon, History as HistoryIcon } from '@mui/icons-material';
import StudentTaskCards from '../components/StudentTaskCards';
import { useNavigate } from 'react-router-dom';
import CompetitionResultsTable from '../components/CompetitionResultsTable';
import { API_BASE_URL } from '../config';
import StudentQRCodeScanner from './StudentQRCodeScanner';

function StudentDashboard() {
  const [studentId, setStudentId] = useState(() => localStorage.getItem('studentId') || '');
  const [isJoined, setIsJoined] = useState(false);
  const [isCompetitionStarted, setIsCompetitionStarted] = useState(false);
  const [competitionText, setCompetitionText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [error, setError] = useState('');
  const [classInfo, setClassInfo] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 添加标签页状态
  const navigate = useNavigate();

  useEffect(() => {
    // 如果没有登录，重定向到登录页面
    if (!studentId) {
      navigate('/student/login');
      return;
    }
    
    // 如果有学号，自动尝试重新连接
    handleJoinCompetition();
    
    // 主动请求获取当前可用任务列表
    socket.emit('get_available_tasks', { studentId });
    
    // 设置心跳定时器，每5秒发送一次心跳
    const heartbeatInterval = setInterval(() => {
      if (studentId) {
        socket.emit('heartbeat', { studentId });
      }
    }, 5000);

    // 添加键盘事件监听，阻止复制快捷键
    const handleKeyDown = (e) => {
      // 阻止Ctrl+C, Ctrl+X, Ctrl+A等快捷键
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x' || e.key === 'a')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);

    // 监听班级选择事件
    socket.on('class_selected', (data) => {
      console.log('收到班级选择事件:', data);
      setClassInfo({
        id: data.classId,
        name: data.className
      });
      setError('');
    });
    
    // 处理登出逻辑
    const handleLogout = () => {
      // 清除本地存储
      localStorage.removeItem('studentId');
      
      // 重置所有状态
      setStudentId('');
      setIsJoined(false);
      setIsCompetitionStarted(false);
      setCompetitionText('');
      setTypedText('');
      setProgress(0);
      setAccuracy(0);
      setTimeLeft(0);
      setIsFinished(false);
      setStudentInfo(null);
      setClassInfo(null);
      setIsWaiting(false);
      setAvailableTasks([]);
      setActiveTasks([]);
      setSelectedTask(null);
      setTabValue(0); // 重置标签页状态
      setError('您已被登出系统');
      
      // 跳转到登录页面
      navigate('/student/login');
    };
    
    socket.on('competition_joined', (data) => {
      setCompetitionText(data.text);
      setTimeLeft(data.duration);
      setIsJoined(true);
      if (data.classInfo) {
        setClassInfo(data.classInfo);
      }
      if (data.isStarted) {
        setIsCompetitionStarted(true);
        startTimer();
      }
    });
    
    socket.on('waiting_for_competition', (data) => {
      if (data.classInfo) {
        setClassInfo(data.classInfo);
        setIsWaiting(true);
      }
    });
    
    socket.on('join_error', (data) => {
      setError(data.message);
      // 如果是因为重复登录或没有选定班级而失败，清除本地存储的学号
      if (data.message.includes('已登录') || data.noClass) {
        localStorage.removeItem('studentId');
        setStudentId('');
        setIsJoined(false);
        setClassInfo(null);
      }
    });

    // 监听被迫登出事件（当其他人使用相同学号登录时）
    socket.on('force_logout', () => {
      console.log('收到强制登出事件');
      handleLogout();
    });

    // 监听班级变更导致的登出事件
    socket.on('all_students_logged_out', () => {
      console.log('收到班级变更登出事件');
      handleLogout();
    });

    socket.on('competition_started', () => {
      setIsCompetitionStarted(true);
      startTimer();
    });

    socket.on('competition_ended', () => {
      setIsCompetitionStarted(false);
      setIsFinished(true);
      
      // 比赛结束3秒后自动返回任务页面
      setTimeout(() => {
        // 重置比赛相关状态
        setSelectedTask(null);
        setIsFinished(false);
        setTypedText('');
        setProgress(0);
        setAccuracy(0);
        setCompetitionText('');
      }, 3000);
    });
    
    // 监听可用任务列表
    socket.on('available_tasks', (data) => {
      setAvailableTasks(data.tasks || []);
      setActiveTasks(data.active || []);
      if (data.studentInfo) {
        setStudentInfo(data.studentInfo);
      }
      setIsJoined(true);
    });
    
    // 监听新任务可用
    socket.on('task_available', (data) => {
      if (data.active) {
        // 更新活动任务列表
        setActiveTasks(prev => {
          // 检查任务是否已存在
          const exists = prev.some(task => task.id === data.taskId);
          if (!exists) {
            // 从可用任务中找到对应任务并添加到活动任务列表
            const task = availableTasks.find(t => t.id === data.taskId);
            if (task) {
              return [...prev, {...task, active: true}];
            }
          }
          return prev;
        });
      }
    });

    // 监听任务加入结果
    socket.on('task_joined', (data) => {
      if (data.taskId === 'typing-game' && data.text) {
        // 设置比赛文本和时间
        setCompetitionText(data.text);
        setTimeLeft(data.duration);
        
        // 如果比赛已经开始，则启动计时器
        if (data.isStarted) {
          setIsCompetitionStarted(true);
          startTimer();
        }
      }
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // 清除心跳定时器
      clearInterval(heartbeatInterval);
      socket.off('class_selected');
      socket.off('competition_joined');
      socket.off('competition_started');
      socket.off('competition_ended');
      socket.off('waiting_for_competition');
      socket.off('join_error');
      socket.off('available_tasks');
      socket.off('task_available');
      socket.off('task_joined');
      socket.off('force_logout');
      socket.off('all_students_logged_out');
    };
  }, [navigate, studentId]);


  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleJoinCompetition = async () => {
    if (!studentId) return;
    
    // 保存学号到本地存储
    localStorage.setItem('studentId', studentId);
    
    try {
      // 先验证学生信息
      const response = await fetch(`${API_BASE_URL}/api/manage/student/${studentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setStudentInfo(data.student);
        // 验证成功后加入比赛或等待任务
        socket.emit('join_competition', { studentId });
        // 即使没有活动比赛，也设置为已加入状态，显示任务待发布界面
        setIsJoined(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '学号不存在');
      }
    } catch (err) {
      setError('服务器连接失败');
    }
  };

  const calculateProgress = (typed) => {
    const progress = (typed.length / competitionText.length) * 100;
    return Math.min(progress, 100);
  };

  const calculateAccuracy = (typed) => {
    if (!typed) return 0;
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === competitionText[i]) correct++;
    }
    return Math.round((correct / typed.length) * 100);
  };

  const handleTyping = (e) => {
    if (!isCompetitionStarted || isFinished) return;
    
    const newText = e.target.value;
    setTypedText(newText);
    
    const newProgress = calculateProgress(newText);
    const newAccuracy = calculateAccuracy(newText);
    
    setProgress(newProgress);
    setAccuracy(newAccuracy);
    
    socket.emit('update_progress', {
      progress: newProgress,
      accuracy: newAccuracy
    });
  };

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!isJoined) {
    return (
      <>
        {/* 将标题移至最顶部 */}
        <Box sx={{ textAlign: 'center', py: 3, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
          
          <Typography 
            variant="h5" 
            color="text.secondary" 
            sx={{ 
              maxWidth: '800px', 
              mx: 'auto',
              fontSize: { xs: '1.1rem', md: '1.3rem' }
            }}
          >
            <SchoolIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
            欢迎使用智联师生教学平台
          </Typography>
        </Box>
        
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
              正在连接...
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                {error}
              </Alert>
            )}
            <LinearProgress />
          </Paper>
        </Container>
      </>
    );
  }

  // 处理任务选择
  const handleTaskSelect = (taskId) => {
    setSelectedTask(taskId);
    
    // 如果选择的是打字比赛任务
    if (taskId === 'typing-game') {
    // 发送请求加入比赛
    socket.emit('join_task', { 
    taskId: 'typing-game',
    studentId: studentInfo.studentId 
    });
    }
    // 如果选择的是二维码识别任务
    else if (taskId === 'qrcode-scanner') {
    // 导航到二维码识别页面
    navigate('/student/qrcode-scanner');
    }
    // 如果选择的是情绪卡片任务
    else if (taskId === 'emotion-cards') {
    // 导航到情绪卡片页面
    navigate('/student/emotion-cards');
    }
    // 如果选择的是图片滤镜任务
    else if (taskId === 'image-filter') {
    // 导航到图片滤镜页面
    navigate('/student/image-filter');
    }
    };
  
  // 渲染任务选择界面
  const renderTaskSelection = () => {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 3, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '2px solid #bbdefb',
          overflow: 'hidden'
        }}
      >

        {/* 任务卡片系统 */}
        {availableTasks.length > 0 ? (
          <StudentTaskCards 
            tasks={availableTasks} 
            activeTasks={activeTasks} 
            onTaskSelect={handleTaskSelect}
            studentInfo={studentInfo}
          />
        ) : (
          <Box sx={{ 
            mt: 4, 
            p: 4, 
            textAlign: 'center', 
            bgcolor: '#f5f5f5', 
            borderRadius: 3,
            border: '1px dashed #bdbdbd'
          }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              暂无可用任务
            </Typography>
            <Typography variant="body1" color="text.secondary">
              请等待教师发布任务，任务发布后将自动显示在此处
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  // 渲染比赛界面
  const renderCompetitionInterface = () => {
    // 如果比赛未开始
    if (!isCompetitionStarted && !isFinished) {
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 3, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '2px solid #bbdefb',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              打字比赛
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => setSelectedTask(null)}
              sx={{ borderRadius: 2 }}
            >
              返回任务列表
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ 
            p: 3, 
            bgcolor: '#fff8e1', 
            borderRadius: 3, 
            border: '1px solid #ffe082',
            display: 'flex',
            alignItems: 'center',
            mb: 3
          }}>
            <TrophyIcon sx={{ color: '#ff9800', mr: 2, fontSize: 40 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e65100', mb: 0.5 }}>
                即将开始的活动
              </Typography>
              <Typography variant="body1">
                老师正在准备打字比赛，请耐心等待。比赛开始后，请认真阅读文本并尽可能准确地输入。
              </Typography>
            </Box>
          </Box>
        </Paper>
      );
    }

    // 比赛进行中或已结束
    return (
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50', fontSize: '1.8rem' }}>
            打字比赛
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => {
              setSelectedTask(null);
              setIsCompetitionStarted(false);
              setIsFinished(false);
              setTypedText('');
              setProgress(0);
              setAccuracy(0);
            }}
            sx={{ borderRadius: 2, height: 40 }}
          >
            返回任务列表
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 4 }}>
          {isCompetitionStarted ? (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2, fontSize: '1.2rem' }}>
              比赛正在进行中，剩余时间: {timeLeft} 秒
            </Alert>
          ) : isFinished ? (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontSize: '1.2rem' }}>
              比赛已结束！你的最终成绩: 进度 {progress.toFixed(1)}%, 准确率 {accuracy}%
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, fontSize: '1.2rem' }}>
              等待教师开始比赛...
            </Alert>
          )}
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#ff9800', fontSize: '1.5rem' }}>
            比赛文本
          </Typography>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              backgroundColor: '#fffde7',
              border: '2px solid #ffeb3b',
              fontSize: '1.3rem',
              lineHeight: 1.6,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              msUserSelect: 'none',
              cursor: 'default'
            }}
            onCopy={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {competitionText}
          </Paper>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2196f3', fontSize: '1.5rem' }}>
            你的输入
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={5}
            value={typedText}
            onChange={handleTyping}
            disabled={!isCompetitionStarted || isFinished}
            placeholder="比赛开始后在这里输入文本..."
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '1.3rem',
                backgroundColor: isCompetitionStarted && !isFinished ? '#fff' : '#f5f5f5'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
                borderColor: isCompetitionStarted && !isFinished ? '#2196f3' : '#bdbdbd'
              }
            }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1.4rem' }}>
            进度: {progress.toFixed(1)}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 15, 
              borderRadius: 2,
              mb: 3,
              '& .MuiLinearProgress-bar': {
                backgroundColor: progress < 30 ? '#f44336' : progress < 70 ? '#ff9800' : '#4caf50'
              }
            }} 
          />

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1.4rem' }}>
            准确率: {accuracy}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={accuracy} 
            color="secondary"
            sx={{ 
              height: 15, 
              borderRadius: 2,
              '& .MuiLinearProgress-bar': {
                backgroundColor: accuracy < 30 ? '#f44336' : accuracy < 70 ? '#ff9800' : '#4caf50'
              }
            }} 
          />
        </Box>
      </Paper>
    );
  };

  // 渲染比赛历史记录
  const renderCompetitionHistory = () => {
    return (
      <Box sx={{ mt: 3 }}>
        {studentId ? (
          <CompetitionResultsTable 
            apiUrl="/api/competition/results/student/"
            entityId={studentId}
            title="我的比赛记录"
            showContent={true}
          />
        ) : (
          <Alert severity="info">请先登录以查看您的比赛记录</Alert>
        )}
      </Box>
    );
  };

  // 渲染学生仪表板内容
  const renderDashboardContent = () => {
    if (tabValue === 0) {
      // 任务中心标签页
      if (selectedTask === 'typing-game') {
        return renderCompetitionInterface();
      } else {
        return renderTaskSelection();
      }
    } else if (tabValue === 1) {
      // 比赛记录标签页
      return renderCompetitionHistory();
    }
  };

  return (
    <>
      {/* 将欢迎信息移至最顶部 */}
      <Box sx={{ textAlign: 'center', py: 3, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold', 
            color: '#1976d2',
            fontSize: { xs: '2rem', md: '2.5rem' },
            mb: 2
          }}
        >
          <SchoolIcon sx={{ fontSize: 30, color: '#1976d2', mr: 1 }} /> 
          欢迎来到智联师生教学平台
        </Typography>
        <Typography 
          variant="h5" 
          color="text.secondary" 
          sx={{ 
            maxWidth: '800px', 
            mx: 'auto',
            fontSize: { xs: '1.1rem', md: '1.3rem' }
          }}
        >
        </Typography>
      </Box>
      
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* 学生信息卡片 */}
        {studentInfo && (
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ color: '#1976d2', mr: 1, fontSize: 30 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {studentInfo.name} - {studentInfo.studentId}
              </Typography>
              <Chip 
                label={studentInfo.class?.name || classInfo?.name || '未知班级'}
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
            </Box>
          </Paper>
        )}

        {/* 标签页切换 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="学生功能标签">
            <Tab label="任务中心" icon={<SchoolIcon />} iconPosition="start" />
            <Tab label="比赛记录" icon={<HistoryIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* 根据标签页显示不同内容 */}
        {renderDashboardContent()}
      </Container>
    </>
  );
}

export default StudentDashboard;