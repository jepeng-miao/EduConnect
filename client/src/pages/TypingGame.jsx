import { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Grid, Alert, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { socket } from '../main';
import { AccessTime as ClockIcon, History as HistoryIcon } from '@mui/icons-material';
import CompetitionResultsTable from '../components/CompetitionResultsTable';

function TypingGame() {
  const [competitionText, setCompetitionText] = useState('');
  const [duration, setDuration] = useState(60);
  const [isCompetitionActive, setIsCompetitionActive] = useState(false);
  const [isCompetitionStarted, setIsCompetitionStarted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedClassInfo, setSelectedClassInfo] = useState(null);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [historyResults, setHistoryResults] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filters, setFilters] = useState({
    searchText: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // 监听班级选择事件
    socket.on('class_selected', (data) => {
      setSelectedClassInfo({
        id: data.classId,
        name: data.className
      });
      setError('');
    });
    
    // 页面加载时检查是否已有选定的班级
    if (!selectedClassInfo) {
      // 发送请求获取当前选定的班级信息
      socket.emit('get_selected_class');
    }

    socket.on('progress_updated', (data) => {
      setParticipants(prev => {
        const newParticipants = [...prev];
        const index = newParticipants.findIndex(p => p.studentId === data.studentId);
        if (index !== -1) {
          newParticipants[index] = { ...newParticipants[index], ...data };
        } else {
          newParticipants.push(data);
        }
        return newParticipants;
      });
    });

    socket.on('competition_started', () => {
      setIsCompetitionStarted(true);
      setTimeLeft(duration);
      startTimer();
    });

    socket.on('competition_ended', ({ results }) => {
      setIsCompetitionActive(false);
      setIsCompetitionStarted(false);
      setTimeLeft(0);
      setParticipants(results.sort((a, b) => b.accuracy - a.accuracy));
      // 比赛结束后自动加载最新的历史记录
      if (selectedClassInfo && tabValue === 1) {
        // 不需要手动调用fetchCompetitionHistory，因为CompetitionResultsTable组件会自动加载
      }
    });

    return () => {
      socket.off('class_selected');
      socket.off('progress_updated');
      socket.off('competition_started');
      socket.off('competition_ended');
    };
  }, []);
  
  // 启动倒计时
  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const handleCreateCompetition = () => {
    if (!competitionText || duration <= 0) return;
    
    if (!selectedClassInfo) {
      setError('请先在顶部导航栏选择班级');
      return;
    }
    
    socket.emit('create_competition', { 
      text: competitionText, 
      duration, 
      classId: selectedClassInfo.id,
      className: selectedClassInfo.name
    });
    setIsCompetitionActive(true);
    setTimeLeft(duration);
    setError('');
  };

  const handleStartCompetition = () => {
    socket.emit('start_competition');
    setIsCompetitionStarted(true);
    startTimer();
  };
  
  const handleEndCompetition = () => {
    if (window.confirm('确定要结束当前比赛吗？')) {
      socket.emit('end_competition');
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 处理历史数据加载完成的回调
  const handleHistoryDataLoaded = (data) => {
    setHistoryResults(data);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
        打字比赛
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="比赛管理标签">
          <Tab label="比赛管理" />
          <Tab label="比赛回顾" />
        </Tabs>
      </Box>
      
      {tabValue === 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                比赛设置
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="比赛文本内容"
                value={competitionText}
                onChange={(e) => setCompetitionText(e.target.value)}
                disabled={isCompetitionActive}
                sx={{ mb: 2 }}
              />
              <TextField
                type="number"
                label="比赛时长（秒）"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                disabled={isCompetitionActive}
                sx={{ mb: 2, mr: 2 }}
              />
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                {!isCompetitionActive ? (
                  <Button
                    variant="contained"
                    onClick={handleCreateCompetition}
                    sx={{ mr: 2 }}
                  >
                    创建比赛
                  </Button>
                ) : !isCompetitionStarted ? (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleStartCompetition}
                    sx={{ mr: 2 }}
                  >
                    开始比赛
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleEndCompetition}
                    sx={{ mr: 2 }}
                  >
                    结束比赛
                  </Button>
                )}
                
                {isCompetitionActive && (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 2 }}>
                    <ClockIcon sx={{ mr: 1, color: timeLeft < 10 ? '#f44336' : '#1976d2' }} />
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      剩余时间: {timeLeft} 秒
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                实时排名
              </Typography>
              {participants.length > 0 ? (
                participants.map((participant, index) => (
                  <Box key={participant.studentId} sx={{ mb: 2, p: 1, bgcolor: index === 0 ? '#e3f2fd' : 'transparent', borderRadius: 1 }}>
                    <Typography variant="body1" fontWeight={index === 0 ? 'bold' : 'normal'}>
                      学号: {participant.studentId}
                    </Typography>
                    <Typography variant="body2">
                      进度: {participant.progress}%
                    </Typography>
                    <Typography variant="body2">
                      准确率: {participant.accuracy}%
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  暂无参赛学生
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // 使用可复用的比赛结果表格组件
        selectedClassInfo ? (
          <CompetitionResultsTable 
            apiUrl="/api/competition/results/class/"
            entityId={selectedClassInfo.id}
            title={`${selectedClassInfo.name} - 比赛历史记录`}
            showContent={true}
            onDataLoaded={handleHistoryDataLoaded}
          />
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            请先在顶部导航栏选择班级以查看比赛历史记录
          </Alert>
        )
      )}
    </Container>
  );
}

export default TypingGame;