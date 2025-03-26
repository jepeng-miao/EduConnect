import { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Paper, Divider, Fade, Zoom, Snackbar, Alert } from '@mui/material';
import { Favorite as FavoriteIcon, Help as HelpIcon, Refresh as RefreshIcon, ArrowBack as ArrowBackIcon, Send as SendIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { socket } from '../main';
import { API_BASE_URL } from '../config';

function AnswerBook() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTaskActive, setIsTaskActive] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // 检查任务状态和监听班级选择
  useEffect(() => {
    // 检查答案之书任务初始状态
    socket.emit('check_task_status', { taskId: 'answer-book' });
    
    // 监听任务状态变化
    socket.on('task_status_update', (data) => {
      if (data.taskId === 'answer-book') {
        setIsTaskActive(data.active);
      }
    });
    
    // 监听任务状态检查结果
    socket.on('task_status_result', (data) => {
      if (data.taskId === 'answer-book') {
        setIsTaskActive(data.active);
      }
    });
    
    // 监听班级选择事件
    socket.on('class_selected', (data) => {
      setSelectedClass(data.classId);
    });
    
    // 页面加载时检查是否已有选定的班级
    socket.emit('get_selected_class');
    
    return () => {
      socket.off('task_status_update');
      socket.off('task_status_result');
      socket.off('class_selected');
    };
  }, []);
  
  // 处理发布任务
  const handlePublishTask = () => {
    if (!selectedClass) {
      setSnackbarMessage('请先选择班级');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    
    // 使用当前选定的班级
    socket.emit('publish_task', { 
      taskId: 'answer-book',
      active: !isTaskActive,
      classId: selectedClass
    });
    
    setSnackbarMessage(isTaskActive ? '已停止答案之书任务' : '已发布答案之书任务');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };
  
  // 关闭提示框
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // 预设的答案列表
  const answers = [
    '是的，毫无疑问。',
    '这是确定的。',
    '很可能。',
    '展望不错。',
    '迹象指向是。',
    '回答模糊，请再试一次。',
    '稍后再问。',
    '现在不能预测。',
    '专注后再问。',
    '不要指望它。',
    '我的回答是否定的。',
    '我的消息来源说不。',
    '展望不太好。',
    '非常值得怀疑。',
    '绝对如此！',
    '相信你的直觉。',
    '命运在你手中。',
    '机会渺茫。',
    '值得一试。',
    '耐心等待，时机会到来。',
    '现在行动！',
    '需要更多思考。',
    '这个问题的答案就在你心中。',
    '寻求他人的建议。',
    '不要犹豫，勇往直前。',
    '放下过去，向前看。',
    '改变你的方向可能会有帮助。',
    '保持乐观，一切都会好起来。',
    '相信自己的能力。',
    '这是一个学习的机会。'
  ];

  // 生成随机答案
  const generateAnswer = () => {
    if (!question.trim()) {
      alert('请先输入一个问题');
      return;
    }

    setIsLoading(true);
    setShowAnswer(false);
    setIsShaking(true);

    // 模拟思考过程
    setTimeout(() => {
      setIsShaking(false);
      const randomIndex = Math.floor(Math.random() * answers.length);
      setAnswer(answers[randomIndex]);
      
      // 短暂延迟后显示答案，增加神秘感
      setTimeout(() => {
        setShowAnswer(true);
        setIsLoading(false);
      }, 500);
    }, 1500);
  };

  // 重置问题和答案
  const resetBook = () => {
    setQuestion('');
    setAnswer('');
    setShowAnswer(false);
  };

  return (
    <>
      <Box sx={{ textAlign: 'center', py: 3, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', position: 'relative' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/psychological-tools')}
          sx={{ 
            position: 'absolute', 
            left: 16, 
            top: 16,
            borderRadius: 2,
            fontWeight: 'bold'
          }}
        >
          返回
        </Button>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold', 
          color: '#1976d2',
          fontSize: { xs: '2rem', md: '2.5rem' },
          mb: 2
        }}>
          答案之书
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ 
          maxWidth: '800px', 
          mx: 'auto',
          fontSize: { xs: '1.1rem', md: '1.3rem' }
        }}>
          向神奇的答案之书提出你的问题，获得命运的指引
        </Typography>
      </Box>
      
      <Container maxWidth="md" sx={{ py: 4 }}>


      <Paper 
        elevation={6} 
        sx={{ 
          p: 4, 
          borderRadius: 3, 
          backgroundColor: '#f9f4ff',
          border: '2px solid #E1BEE7',
          maxWidth: 600,
          mx: 'auto',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: -30, 
          right: -30, 
          width: 100, 
          height: 100, 
          borderRadius: '50%', 
          backgroundColor: '#E1BEE7',
          zIndex: 0
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FavoriteIcon sx={{ color: '#9C27B0', mr: 1, fontSize: 30 }} />
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
              提出你的问题
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            label="在此输入你的问题"
            variant="outlined"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            sx={{ mb: 3 }}
            placeholder="例如：我应该相信自己的直觉吗？"
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Button 
              variant="contained" 
              color="secondary"
              size="large"
              startIcon={<HelpIcon />}
              onClick={generateAnswer}
              disabled={isLoading}
              sx={{ 
                borderRadius: 2,
                py: 1.5,
                px: 3,
                fontWeight: 'bold'
              }}
            >
              获取答案
            </Button>
            
            <Button 
              variant="outlined" 
              color="secondary"
              startIcon={<RefreshIcon />}
              onClick={resetBook}
              sx={{ borderRadius: 2 }}
            >
              重置
            </Button>
          </Box>
          
          <Divider sx={{ mb: 4 }} />
          
          <Box 
            sx={{ 
              minHeight: 150, 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              animation: isShaking ? 'shake 0.5s infinite' : 'none',
              '@keyframes shake': {
                '0%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(5px)' },
                '50%': { transform: 'translateX(-5px)' },
                '75%': { transform: 'translateX(5px)' },
                '100%': { transform: 'translateX(0)' },
              },
            }}
          >
            {isLoading && !showAnswer && (
              <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                答案之书正在思考...
              </Typography>
            )}
            
            <Zoom in={showAnswer} timeout={500}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" component="div" sx={{ 
                  fontWeight: 'bold', 
                  color: '#9C27B0',
                  mb: 2
                }}>
                  答案之书的回应:
                </Typography>
                
                <Paper elevation={3} sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  backgroundColor: '#fff',
                  maxWidth: 400,
                  mx: 'auto'
                }}>
                  <Typography variant="h6" sx={{ 
                    fontStyle: 'italic',
                    fontWeight: 'medium',
                    lineHeight: 1.6
                  }}>
                    {answer}
                  </Typography>
                </Paper>
              </Box>
            </Zoom>
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 6, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          color={isTaskActive ? "secondary" : "primary"}
          startIcon={isTaskActive ? <CheckCircleIcon /> : <SendIcon />}
          onClick={handlePublishTask}
          sx={{ borderRadius: 2, fontWeight: 'bold' }}
        >
          {isTaskActive ? '停止任务' : '发布任务'}
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          注意：答案之书仅供娱乐，请不要将其作为重要决策的依据。
        </Typography>
      </Box>
      
      {/* 提示框 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
    </>
  );
}

export default AnswerBook;