import { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Grid, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Divider, Chip, Avatar, Stack } from '@mui/material';
import { socket } from '../main';
import { API_BASE_URL } from '../config';

function TeacherDashboard() {
  const [competitionText, setCompetitionText] = useState('');
  const [duration, setDuration] = useState(60);
  const [isCompetitionActive, setIsCompetitionActive] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    // 获取班级列表
    const fetchClasses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/manage/classes`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setClasses(data.classes);
        }
      } catch (err) {
        console.error('获取班级列表失败:', err);
      }
    };
    
    fetchClasses();
    
    // 监听班级选择事件
    socket.on('class_selected', (data) => {
      setSelectedClass(data.classId);
    });
    
    // 页面加载时检查是否已有选定的班级
    socket.emit('get_selected_class');
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

    socket.on('competition_ended', ({ results }) => {
      setIsCompetitionActive(false);
      setParticipants(results.sort((a, b) => b.accuracy - a.accuracy));
    });

    return () => {
      socket.off('progress_updated');
      socket.off('competition_ended');
    };
  }, []);

  const handleCreateCompetition = () => {
    if (!competitionText || duration <= 0 || !selectedClass) return;
    socket.emit('create_competition', { 
      text: competitionText, 
      duration, 
      classId: selectedClass,
      className: classes.find(c => c.id === selectedClass)?.name || ''
    });
    setIsCompetitionActive(true);
  };

  const handleStartCompetition = () => {
    socket.emit('start_competition');
  };

  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2', fontSize: '2rem' }}>
        智联师生 - 打字比赛
      </Typography>
    
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3,
              backgroundColor: '#fff',
              border: '2px solid #bbdefb'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'medium', color: '#1565c0', fontSize: '1.5rem' }}>
              比赛设置
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 1, fontWeight: 'medium', color: '#0d47a1', fontSize: '1.2rem' }}>
              比赛文本内容
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="请输入学生需要打字的文本内容..."
              value={competitionText}
              onChange={(e) => setCompetitionText(e.target.value)}
              disabled={isCompetitionActive}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1.1rem'
                }
              }}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 1, fontWeight: 'medium', color: '#0d47a1', fontSize: '1.2rem' }}>
                  比赛时长
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  placeholder="请输入比赛时长（秒）"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  disabled={isCompetitionActive}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 1, fontWeight: 'medium', color: '#0d47a1', fontSize: '1.2rem' }}>
                  选择班级
                </Typography>
                <FormControl 
                  fullWidth 
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    }
                  }}
                >
                  <InputLabel>班级</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={handleClassChange}
                    disabled={isCompetitionActive}
                    label="班级"
                  >
                    {classes.map((classItem) => (
                      <MenuItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleCreateCompetition}
                disabled={isCompetitionActive || !selectedClass || !competitionText}
                sx={{ 
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  backgroundColor: '#4caf50',
                  '&:hover': {
                    backgroundColor: '#388e3c'
                  }
                }}
              >
                创建比赛
              </Button>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={handleStartCompetition}
                disabled={!isCompetitionActive}
                sx={{ 
                  borderRadius: 3,
                  px: 3,
                  py: 1,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  backgroundColor: '#ff9800',
                  '&:hover': {
                    backgroundColor: '#f57c00'
                  }
                }}
              >
                开始比赛
              </Button>
            </Box>
          </Paper>
        </Grid>
    
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              backgroundColor: '#fff',
              border: '2px solid #c8e6c9'
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'medium', color: '#2e7d32', fontSize: '1.5rem' }}>
              参赛学生
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {participants.length > 0 ? (
              <List sx={{ p: 0 }}>
                {participants.map((student, index) => (
                  <Card key={student.studentId} sx={{ mb: 2, borderRadius: 2, border: index < 3 ? `2px solid ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32'}` : 'none' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item xs={2}>
                          <Avatar 
                            sx={{ 
                              bgcolor: index < 3 ? 
                                (index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32') : 
                                '#bbdefb',
                              color: index < 3 ? '#000' : '#0d47a1',
                              fontWeight: 'bold',
                              fontSize: '1.2rem'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </Grid>
                        <Grid item xs={10}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {student.name} ({student.studentId})
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip 
                              label={`进度: ${student.progress?.toFixed(1) || 0}%`} 
                              size="small" 
                              sx={{ 
                                bgcolor: '#e3f2fd', 
                                color: '#0d47a1',
                                fontWeight: 'medium',
                                fontSize: '0.9rem'
                              }} 
                            />
                            <Chip 
                              label={`准确率: ${student.accuracy || 0}%`} 
                              size="small" 
                              sx={{ 
                                bgcolor: '#e8f5e9', 
                                color: '#2e7d32',
                                fontWeight: 'medium',
                                fontSize: '0.9rem'
                              }} 
                            />
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4, fontSize: '1.1rem' }}>
                暂无学生参加比赛
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default TeacherDashboard;