import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, Divider, Paper, Chip, Alert, CircularProgress, Snackbar } from '@mui/material';
import { Psychology as PsychologyIcon, Mood as MoodIcon, MoodBad as MoodBadIcon, SentimentSatisfied as SatisfiedIcon, SentimentVeryDissatisfied as DissatisfiedIcon, SentimentVerySatisfied as VerySatisfiedIcon, Favorite as FavoriteIcon, ThumbUp as ThumbUpIcon, ArrowBack as ArrowBackIcon, Send as SendIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { socket } from '../main';

function StudentEmotionCards() {
  const navigate = useNavigate();
  const [selectedEmotionCard, setSelectedEmotionCard] = useState(null);
  const [isTaskActive, setIsTaskActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [studentId, setStudentId] = useState(() => localStorage.getItem('studentId') || '');
  
  // 情绪卡片数据
  const [emotionCards] = useState([
    {
      id: 'happy',
      title: '快乐',
      description: '表达积极、愉悦的情绪，帮助学生认识和表达快乐的感受',
      icon: <VerySatisfiedIcon sx={{ fontSize: 40, color: '#FFD700' }} />,
      color: '#FFF9C4'
    },
    {
      id: 'sad',
      title: '悲伤',
      description: '识别和理解悲伤情绪，学习健康地表达和处理悲伤',
      icon: <MoodBadIcon sx={{ fontSize: 40, color: '#42A5F5' }} />,
      color: '#BBDEFB'
    },
    {
      id: 'angry',
      title: '愤怒',
      description: '认识愤怒情绪的表现，学习控制和适当表达愤怒的方法',
      icon: <DissatisfiedIcon sx={{ fontSize: 40, color: '#EF5350' }} />,
      color: '#FFCDD2'
    },
    {
      id: 'fear',
      title: '恐惧',
      description: '了解恐惧情绪的来源，学习面对和克服恐惧的技巧',
      icon: <SatisfiedIcon sx={{ fontSize: 40, color: '#7E57C2' }} />,
      color: '#D1C4E9'
    },
    {
      id: 'surprise',
      title: '惊讶',
      description: '认识惊讶情绪的特点，理解突发事件对情绪的影响',
      icon: <MoodIcon sx={{ fontSize: 40, color: '#26A69A' }} />,
      color: '#B2DFDB'
    },
    {
      id: 'love',
      title: '爱',
      description: '探索爱的不同形式，培养学生表达关爱和感受爱的能力',
      icon: <FavoriteIcon sx={{ fontSize: 40, color: '#EC407A' }} />,
      color: '#F8BBD0'
    },
    {
      id: 'gratitude',
      title: '感恩',
      description: '培养感恩意识，学习表达感谢和欣赏他人的方式',
      icon: <ThumbUpIcon sx={{ fontSize: 40, color: '#66BB6A' }} />,
      color: '#C8E6C9'
    },
    {
      id: 'calm',
      title: '平静',
      description: '学习情绪调节技巧，培养保持平静和专注的能力',
      icon: <PsychologyIcon sx={{ fontSize: 40, color: '#78909C' }} />,
      color: '#CFD8DC'
    }
  ]);

  // 监听任务状态变化
  useEffect(() => {
    // 如果没有登录，重定向到登录页面
    if (!studentId) {
      navigate('/student/login');
      return;
    }
    
    // 检查任务初始状态
    socket.emit('check_task_status', { taskId: 'emotion-cards' });
    
    // 监听任务状态变化
    socket.on('task_status_update', (data) => {
      if (data.taskId === 'emotion-cards') {
        setIsTaskActive(data.active);
        if (!data.active) {
          // 如果任务被停止，重置选择和提交状态
          setSelectedEmotionCard(null);
          setSubmissionResult(null);
        }
      }
    });
    
    // 监听任务状态检查结果
    socket.on('task_status_result', (data) => {
      if (data.taskId === 'emotion-cards') {
        setIsTaskActive(data.active);
      }
    });
    
    // 监听情绪提交结果
    socket.on('emotion_submission_result', (data) => {
      setIsSubmitting(false);
      setSubmissionResult({
        success: data.success,
        message: data.message
      });
      
      setSnackbarMessage(data.message);
      setSnackbarSeverity(data.success ? 'success' : 'error');
      setSnackbarOpen(true);
    });
    
    return () => {
      socket.off('task_status_update');
      socket.off('task_status_result');
      socket.off('emotion_submission_result');
    };
  }, [navigate, studentId]);

  // 处理情绪卡片选择
  const handleEmotionCardClick = (cardId) => {
    if (isSubmitting || submissionResult) return;
    
    // 如果点击已选中的卡片，则取消选择
    if (selectedEmotionCard === cardId) {
      setSelectedEmotionCard(null);
    } else {
      setSelectedEmotionCard(cardId);
    }
  };

  // 处理情绪提交
  const handleSubmitEmotion = () => {
    if (!selectedEmotionCard || isSubmitting || submissionResult) return;
    
    setIsSubmitting(true);
    
    // 获取选中的情绪卡片信息
    const selectedCard = emotionCards.find(card => card.id === selectedEmotionCard);
    
    // 发送情绪选择到服务器
    socket.emit('submit_emotion', {
      studentId,
      emotionId: selectedEmotionCard,
      emotionName: selectedCard.title
    });
  };

  // 处理返回仪表盘
  const handleBackToDashboard = () => {
    navigate('/student/dashboard');
  };
  
  // 关闭提示框
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Box sx={{ textAlign: 'center', py: 3, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', position: 'relative' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToDashboard}
          sx={{ 
            position: 'absolute', 
            left: 16, 
            top: 16,
            borderRadius: 2,
            fontWeight: 'bold'
          }}
        >
          返回仪表盘
        </Button>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold', 
          color: '#1976d2',
          fontSize: { xs: '2rem', md: '2.5rem' },
          mb: 2
        }}>
          情绪卡片
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ 
          maxWidth: '800px', 
          mx: 'auto',
          fontSize: { xs: '1.1rem', md: '1.3rem' }
        }}>
          选择一张最能代表你当前情绪的卡片
        </Typography>
      </Box>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {!isTaskActive ? (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '2px solid #ffcdd2' }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              情绪卡片任务当前未激活，请等待教师发布任务。
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              当教师发布情绪卡片任务后，你将能够在这里选择和提交你的情绪。
            </Typography>
          </Paper>
        ) : submissionResult ? (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: `2px solid ${submissionResult.success ? '#c8e6c9' : '#ffcdd2'}` }}>
            <Alert severity={submissionResult.success ? "success" : "error"} sx={{ mb: 3 }}>
              {submissionResult.message}
            </Alert>
            <Typography variant="body1" sx={{ mb: 4 }}>
              {submissionResult.success ? 
                "谢谢你分享你的情绪！教师已收到你的选择。" : 
                "提交过程中出现问题，请稍后再试。"}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setSubmissionResult(null);
                setSelectedEmotionCard(null);
              }}
              sx={{ 
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 'bold'
              }}
            >
              重新选择
            </Button>
          </Paper>
        ) : (
          <>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
              请选择一张最能代表你当前情绪的卡片：
            </Typography>
            
            <Grid container spacing={3}>
              {emotionCards.map((card) => (
                <Grid item xs={12} sm={6} md={3} key={card.id}>
                  <Card 
                    elevation={selectedEmotionCard === card.id ? 6 : 2} 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: isSubmitting ? 'none' : 'translateY(-8px)',
                        boxShadow: isSubmitting ? 'inherit' : '0 8px 16px rgba(0,0,0,0.1)'
                      },
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: selectedEmotionCard === card.id ? `3px solid ${card.color}` : `2px solid ${card.color}`,
                      cursor: isSubmitting ? 'default' : 'pointer',
                      opacity: isSubmitting && selectedEmotionCard !== card.id ? 0.6 : 1
                    }}
                    onClick={() => handleEmotionCardClick(card.id)}
                  >
                    <Box sx={{ 
                      p: 2, 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: card.color,
                      opacity: 0.9
                    }}>
                      {card.icon}
                      <Typography variant="h6" component="h3" sx={{ mt: 1, fontWeight: 'bold', textAlign: 'center' }}>
                        {card.title}
                      </Typography>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography variant="body2">
                        {card.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0, justifyContent: 'center' }}>
                      <Chip 
                        label={selectedEmotionCard === card.id ? "已选择" : "选择"} 
                        color={selectedEmotionCard === card.id ? "primary" : "default"}
                        variant={selectedEmotionCard === card.id ? "filled" : "outlined"}
                      />
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                disabled={!selectedEmotionCard || isSubmitting}
                onClick={handleSubmitEmotion}
                sx={{ 
                  borderRadius: 2,
                  px: 6,
                  py: 2,
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
              >
                {isSubmitting ? "提交中..." : "提交我的情绪"}
              </Button>
            </Box>
          </>
        )}
        
        <Box sx={{ mt: 8, textAlign: 'center', p: 3, bgcolor: '#f5f5f5', borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            智联师生教学平台 - 情绪卡片工具
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} 智联师生教学平台. 保留所有权利.
          </Typography>
        </Box>
      </Container>
      
      {/* 提示信息 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  
  );
}

export default StudentEmotionCards;