import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, Divider, Paper, Chip, Avatar, List, ListItem, ListItemIcon, ListItemText, FormControl, InputLabel, Select, MenuItem, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { Psychology as PsychologyIcon, Mood as MoodIcon, MoodBad as MoodBadIcon, SentimentSatisfied as SatisfiedIcon, SentimentVeryDissatisfied as DissatisfiedIcon, SentimentVerySatisfied as VerySatisfiedIcon, Favorite as FavoriteIcon, ThumbUp as ThumbUpIcon, ArrowBack as ArrowBackIcon, Send as SendIcon, CheckCircle as CheckCircleIcon, FormatListBulleted as ListIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { socket } from '../main';
import { API_BASE_URL } from '../config';
import { format } from 'date-fns';
import zhCN from 'date-fns/locale/zh-CN';

function EmotionCards() {
  const navigate = useNavigate();
  const [selectedEmotionCard, setSelectedEmotionCard] = useState(null);
  const [isTaskActive, setIsTaskActive] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [emotionLogs, setEmotionLogs] = useState([]);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [taskBatches, setTaskBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  
  // 检查任务状态和监听班级选择
  useEffect(() => {
    // 检查情绪卡片任务初始状态
    socket.emit('check_task_status', { taskId: 'emotion-cards' });
    
    // 监听任务状态变化
    socket.on('task_status_update', (data) => {
      if (data.taskId === 'emotion-cards') {
        setIsTaskActive(data.active);
      }
    });
    
    // 监听任务状态检查结果
    socket.on('task_status_result', (data) => {
      if (data.taskId === 'emotion-cards') {
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
    // 使用当前选定的班级（从TeacherLayout获取）
    socket.emit('publish_task', { 
      taskId: 'emotion-cards',
      active: !isTaskActive,
      classId: selectedClass
    });
    
    setSnackbarMessage(isTaskActive ? '已停止情绪卡片任务' : '已发布情绪卡片任务');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };
  
  // 获取情绪卡片任务批次
  const fetchTaskBatches = async () => {
    if (!selectedClass) {
      setSnackbarMessage('请先选择班级');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/manage/emotion-logs?classId=${selectedClass}&groupByDate=true`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // 按日期分组的任务批次
        setTaskBatches(data.batches || []);
        
        if (data.batches && data.batches.length > 0) {
          // 默认选择最新的批次
          setSelectedBatch(data.batches[0].date);
          setEmotionLogs(data.batches[0].logs || []);
          setLogsDialogOpen(true);
        } else {
          setSnackbarMessage('暂无情绪卡片提交记录');
          setSnackbarSeverity('info');
          setSnackbarOpen(true);
        }
      } else {
        setSnackbarMessage('获取情绪提交记录失败');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('获取情绪提交记录失败:', err);
      setSnackbarMessage('获取情绪提交记录失败');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理批次选择变化
  const handleBatchChange = (event) => {
    const batchDate = event.target.value;
    setSelectedBatch(batchDate);
    
    // 查找对应批次的日志
    const selectedBatchData = taskBatches.find(batch => batch.date === batchDate);
    if (selectedBatchData) {
      setEmotionLogs(selectedBatchData.logs || []);
    } else {
      setEmotionLogs([]);
    }
  };
  
  // 关闭提示框
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // 关闭日志对话框
  const handleCloseLogsDialog = () => {
    setLogsDialogOpen(false);
  };
  
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

  // 情绪详情数据
  const [emotionDetails] = useState({
    'happy': {
      title: '快乐情绪详解',
      characteristics: [
        '面部表情放松，经常微笑',
        '精力充沛，行为活跃',
        '思维灵活，创造力增强',
        '社交意愿增强，乐于分享'
      ],
      triggers: [
        '成功完成任务或达成目标',
        '与亲友共度美好时光',
        '获得认可和赞赏',
        '参与喜爱的活动'
      ],
      management: [
        '记录快乐时刻，建立积极记忆库',
        '与他人分享快乐，增强社交联结',
        '培养感恩意识，珍视当下',
        '通过快乐情绪缓解压力'
      ],
      color: '#FFF9C4'
    },
    'sad': {
      title: '悲伤情绪详解',
      characteristics: [
        '精力下降，行动缓慢',
        '食欲和睡眠可能受到影响',
        '注意力难以集中，思维变慢',
        '社交意愿降低，倾向独处'
      ],
      triggers: [
        '失去重要的人或物',
        '经历失败或挫折',
        '人际关系冲突或断裂',
        '回忆伤心往事'
      ],
      management: [
        '允许自己感受悲伤，不压抑情绪',
        '寻求社会支持，分享感受',
        '保持基本自我照顾，如规律作息',
        '适当转移注意力，参与积极活动'
      ],
      color: '#BBDEFB'
    },
    'angry': {
      title: '愤怒情绪详解',
      characteristics: [
        '心跳加速，血压升高',
        '肌肉紧张，面部表情紧绷',
        '思维变得狭窄，专注于威胁',
        '行为冲动，言语可能激烈'
      ],
      triggers: [
        '感到被不公平对待',
        '权利或边界被侵犯',
        '期望落空或受到阻碍',
        '感到被误解或不被尊重'
      ],
      management: [
        '识别愤怒早期信号，及时调整',
        '使用冷静技巧如深呼吸和暂时离开',
        '寻找适当表达愤怒的方式',
        '练习换位思考，理解他人视角'
      ],
      color: '#FFCDD2'
    },
    'fear': {
      title: '恐惧情绪详解',
      characteristics: [
        '心跳加速，呼吸急促',
        '肌肉紧张，可能颤抖',
        '注意力高度集中于威胁',
        '产生逃避或僵住的反应'
      ],
      triggers: [
        '面对未知或不确定性',
        '过去创伤的触发',
        '担忧失败或负面评价',
        '感知到身体或心理威胁'
      ],
      management: [
        '使用放松技巧如深呼吸和渐进式肌肉放松',
        '面对而非逃避恐惧源（适度暴露）',
        '挑战非理性恐惧思维',
        '寻求专业帮助处理严重恐惧'
      ],
      color: '#D1C4E9'
    },
    'surprise': {
      title: '惊讶情绪详解',
      characteristics: [
        '眼睛睁大，嘴巴可能张开',
        '短暂的注意力中断和定向反应',
        '思维暂时空白，随后快速处理新信息',
        '生理上可能表现为惊跳反应'
      ],
      triggers: [
        '突发事件或意外情况',
        '与预期不符的结果',
        '新奇或不寻常的刺激',
        '突然的感官变化'
      ],
      management: [
        '接受惊讶是正常反应',
        '给自己时间处理意外情况',
        '保持开放心态面对变化',
        '从惊讶中学习，调整期望'
      ],
      color: '#B2DFDB'
    },
    'love': {
      title: '爱的情绪详解',
      characteristics: [
        '感到温暖、亲近和联结',
        '关注他人需求和福祉',
        '产生保护和支持的倾向',
        '体验到幸福和满足感'
      ],
      triggers: [
        '与亲密之人互动',
        '给予或接受关怀',
        '共情他人情感',
        '回忆美好关系时刻'
      ],
      management: [
        '表达爱意和感激',
        '培养同理心和倾听技巧',
        '设立健康的情感边界',
        '平衡自我关爱和关爱他人'
      ],
      color: '#F8BBD0'
    },
    'gratitude': {
      title: '感恩情绪详解',
      characteristics: [
        '感到温暖和满足',
        '注意到生活中的积极方面',
        '增强与他人的联结感',
        '减少负面情绪如嫉妒或不满'
      ],
      triggers: [
        '接受他人帮助或善意',
        '意识到自己拥有的资源和优势',
        '克服困难后的反思',
        '比较现状与过去的进步'
      ],
      management: [
        '保持感恩日记',
        '表达谢意给予帮助的人',
        '培养欣赏日常生活中的小事',
        '参与志愿服务，回馈社会'
      ],
      color: '#C8E6C9'
    },
    'calm': {
      title: '平静情绪详解',
      characteristics: [
        '呼吸平稳，肌肉放松',
        '思维清晰，注意力集中',
        '情绪稳定，不易受外界干扰',
        '决策更加理性和深思熟虑'
      ],
      triggers: [
        '有规律的生活和充足休息',
        '掌控感和确定性',
        '成功应对压力或解决问题',
        '正念练习或冥想'
      ],
      management: [
        '建立日常冥想或深呼吸习惯',
        '规律作息，保证充足睡眠',
        '减少刺激物如咖啡因和电子设备',
        '创造平静的环境和自我空间'
      ],
      color: '#CFD8DC'
    }
  });

  const handleEmotionCardClick = (cardId) => {
    // 如果点击已选中的卡片，则取消选择
    if (selectedEmotionCard === cardId) {
      setSelectedEmotionCard(null);
    } else {
      setSelectedEmotionCard(cardId);
      // 滚动到详情区域
      if (cardId) {
        setTimeout(() => {
          const detailsElement = document.getElementById('emotion-details');
          if (detailsElement) {
            detailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  };

  // 返回心理工具页面
  const handleBackToPsychTools = () => {
    navigate('/teacher/psychological-tools');
  };

  return (
    <>
      <Box sx={{ textAlign: 'center', py: 3, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', position: 'relative' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToPsychTools}
          sx={{ 
            position: 'absolute', 
            left: 16, 
            top: 16,
            borderRadius: 2,
            fontWeight: 'bold'
          }}
        >
          返回心理工具
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
          帮助学生识别、理解和表达不同的情绪，提高情绪管理能力和社交技能
        </Typography>
      </Box>
      
      {/* 任务发布控制面板 */}
      <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, border: '2px solid #bbdefb' }}>
          <Grid container spacing={2} alignItems="center" justifyContent="center">
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                color={isTaskActive ? "error" : "success"}
                startIcon={isTaskActive ? <CheckCircleIcon /> : <SendIcon />}
                onClick={handlePublishTask}
                disabled={!selectedClass}
                fullWidth
                sx={{ 
                  py: 1.5, 
                  borderRadius: 2,
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                {isTaskActive ? "停止情绪卡片任务" : "发布情绪卡片任务"}
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<ListIcon />}
                onClick={fetchTaskBatches}
                disabled={!selectedClass}
                fullWidth
                sx={{ 
                  py: 1.5, 
                  borderRadius: 2,
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                查看任务提交列表
              </Button>
            </Grid>
          </Grid>
          
          {isTaskActive && (
            <Alert severity="success" sx={{ mt: 2 }}>
              情绪卡片任务已发布！学生可以在任务列表中看到并参与此任务。
            </Alert>
          )}
        </Paper>
      </Container>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 情绪卡片部分 */}
        <Paper elevation={3} sx={{ p: 4, mb: 6, borderRadius: 3, border: '2px solid #bbdefb' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <MoodIcon sx={{ fontSize: 30, color: '#1976d2', mr: 2 }} />
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              情绪卡片库
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
            使用情绪卡片帮助学生识别、理解和表达不同的情绪，提高情绪管理能力和社交技能。点击卡片查看详细内容。
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
                      transform: 'translateY(-8px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    },
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: selectedEmotionCard === card.id ? `3px solid ${card.color}` : `2px solid ${card.color}`,
                    cursor: 'pointer'
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
          
          {/* 情绪详情展示区域 */}
          {selectedEmotionCard && (
            <Box id="emotion-details" sx={{ mt: 6, p: 3, borderRadius: 3, border: `2px solid ${emotionDetails[selectedEmotionCard].color}`, backgroundColor: `${emotionDetails[selectedEmotionCard].color}20` }}>
              <Typography variant="h4" component="h3" sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2', textAlign: 'center' }}>
                {emotionDetails[selectedEmotionCard].title}
              </Typography>
              
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
                      情绪特点
                    </Typography>
                    <List>
                      {emotionDetails[selectedEmotionCard].characteristics.map((item, index) => (
                        <ListItem key={index} sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Chip size="small" label={index + 1} color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
                      触发因素
                    </Typography>
                    <List>
                      {emotionDetails[selectedEmotionCard].triggers.map((item, index) => (
                        <ListItem key={index} sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Chip size="small" label={index + 1} color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper elevation={2} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
                      管理方法
                    </Typography>
                    <List>
                      {emotionDetails[selectedEmotionCard].management.map((item, index) => (
                        <ListItem key={index} sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Chip size="small" label={index + 1} color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => setSelectedEmotionCard(null)}
                  sx={{ borderRadius: 2, px: 4, py: 1.5, fontWeight: 'bold' }}
                >
                  关闭详情
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        <Box sx={{ mt: 8, textAlign: 'center', p: 3, bgcolor: '#f5f5f5', borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            智联师生教学平台 - 情绪卡片工具
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} 智联师生教学平台. 保留所有权利.
          </Typography>
        </Box>
        
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
        
        {/* 情绪提交记录弹窗 */}
        <Dialog
          open={logsDialogOpen}
          onClose={handleCloseLogsDialog}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" component="div">
                情绪卡片提交记录
              </Typography>
              
              {/* 批次选择下拉框 */}
              {taskBatches.length > 0 && (
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="batch-select-label">选择任务批次</InputLabel>
                  <Select
                    labelId="batch-select-label"
                    value={selectedBatch}
                    onChange={handleBatchChange}
                    label="选择任务批次"
                    startAdornment={<FilterListIcon sx={{ mr: 1, color: 'action.active' }} />}
                  >
                    {taskBatches.map((batch) => (
                      <MenuItem key={batch.date} value={batch.date}>
                        {format(new Date(batch.date), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                          ({batch.count}人提交)
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
            <Button onClick={handleCloseLogsDialog} color="primary">
              关闭
            </Button>
          </DialogTitle>
          <DialogContent>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : emotionLogs.length > 0 ? (
              <>
                {/* 情绪统计摘要 */}
                <Box sx={{ mb: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    情绪分布统计
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(emotionLogs.reduce((acc, log) => {
                      const emotion = log.taskResult?.emotionName || '未知';
                      acc[emotion] = (acc[emotion] || 0) + 1;
                      return acc;
                    }, {})).map(([emotion, count]) => (
                      <Grid item xs={6} sm={4} md={3} key={emotion}>
                        <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">{count}</Typography>
                          <Typography variant="body2" color="text.secondary">{emotion}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round((count / emotionLogs.length) * 100)}%
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                
                {/* 学生情绪提交网格视图 */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <MoodIcon sx={{ mr: 1 }} /> 学生情绪提交情况
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {emotionLogs.map((log) => {
                      // 查找对应的情绪卡片数据
                      const emotionId = log.taskResult?.emotionId || 'unknown';
                      const emotionName = log.taskResult?.emotionName || '未知';
                      
                      // 获取情绪对应的颜色和图标
                      let emotionColor = '#f5f5f5';
                      let EmotionIcon = MoodIcon;
                      
                      switch(emotionId) {
                        case 'happy':
                          emotionColor = '#FFF9C4';
                          EmotionIcon = VerySatisfiedIcon;
                          break;
                        case 'sad':
                          emotionColor = '#BBDEFB';
                          EmotionIcon = MoodBadIcon;
                          break;
                        case 'angry':
                          emotionColor = '#FFCDD2';
                          EmotionIcon = DissatisfiedIcon;
                          break;
                        case 'fear':
                          emotionColor = '#D1C4E9';
                          EmotionIcon = SatisfiedIcon;
                          break;
                        case 'surprise':
                          emotionColor = '#B2DFDB';
                          EmotionIcon = MoodIcon;
                          break;
                        case 'love':
                          emotionColor = '#F8BBD0';
                          EmotionIcon = FavoriteIcon;
                          break;
                        case 'gratitude':
                          emotionColor = '#C8E6C9';
                          EmotionIcon = ThumbUpIcon;
                          break;
                        case 'calm':
                          emotionColor = '#CFD8DC';
                          EmotionIcon = PsychologyIcon;
                          break;
                        default:
                          emotionColor = '#f5f5f5';
                          EmotionIcon = MoodIcon;
                      }
                      
                      return (
                        <Grid item xs={12} sm={6} md={4} lg={2} key={log.id}>
                          <Paper 
                            elevation={3} 
                            sx={{ 
                              p: 2, 
                              height: '100%', 
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              borderRadius: 2,
                              border: `2px solid ${emotionColor}`,
                              transition: 'transform 0.2s',
                              '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: 3
                              }
                            }}
                          >
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
                              {log.Student?.name || '未知学生'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                              {log.studentId}
                            </Typography>
                            
                            <Box sx={{ 
                              bgcolor: emotionColor, 
                              p: 1.5, 
                              borderRadius: '50%',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              mb: 1
                            }}>
                              <EmotionIcon sx={{ fontSize: 32 }} />
                            </Box>
                            
                            <Chip 
                              label={emotionName} 
                              size="small"
                              sx={{ 
                                bgcolor: emotionColor,
                                fontWeight: 'bold',
                                mb: 1
                              }} 
                            />
                            
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', fontSize: '0.7rem' }}>
                              {format(new Date(log.completedAt), 'MM-dd HH:mm', { locale: zhCN })}
                            </Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  暂无情绪卡片提交记录
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </>
  );
}

export default EmotionCards;