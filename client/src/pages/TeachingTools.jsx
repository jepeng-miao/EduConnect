import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, Divider, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Book as BookIcon, Assignment as AssignmentIcon, Quiz as QuizIcon, VideoLibrary as VideoIcon, InsertDriveFile as FileIcon, Link as LinkIcon, QrCode as QrCodeIcon, Edit as EditIcon, Group as GroupIcon, Person as PersonIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { socket } from '../main';

function TeachingTools() {
  const navigate = useNavigate();
  const [activeTasks, setActiveTasks] = useState([]);
  const [resources] = useState([
    {
      id: 'whiteboard',
      title: '互动白板',
      description: '在线互动白板工具，支持实时绘图、文字标注和图形插入，提升课堂互动效果',
      icon: <EditIcon sx={{ fontSize: 40, color: '#5c6bc0' }} />,
      color: '#c5cae9'
    },
    {
      id: 'grouping-tool',
      title: '班级分组',
      description: '创建和管理学生分组，支持随机分组和手动分组，提高小组协作学习效率',
      icon: <GroupIcon sx={{ fontSize: 40, color: '#4caf50' }} />,
      color: '#c8e6c9'
    },
    {
      id: 'student-picker',
      title: '抽取学生',
      description: '随机抽取学生回答问题或参与活动，提高课堂参与度，支持避免重复抽取',
      icon: <PersonIcon sx={{ fontSize: 40, color: '#FF9800' }} />,
      color: '#FFF3E0'
    }
  ]);

  useEffect(() => {
    // 检查任务初始状态
    socket.emit('check_task_status', { taskId: 'qrcode-scanner' });
    
    // 监听任务状态变化
    socket.on('task_status_update', (data) => {
      if (data.taskId === 'qrcode-scanner') {
        setActiveTasks(prev => {
          if (data.active && !prev.includes(data.taskId)) {
            return [...prev, data.taskId];
          } else if (!data.active) {
            return prev.filter(id => id !== data.taskId);
          }
          return prev;
        });
      }
    });
    
    // 监听任务状态检查结果
    socket.on('task_status_result', (data) => {
      if (data.taskId === 'qrcode-scanner' && data.active) {
        setActiveTasks(prev => {
          if (!prev.includes(data.taskId)) {
            return [...prev, data.taskId];
          }
          return prev;
        });
      }
    });
    
    return () => {
      socket.off('task_status_update');
      socket.off('task_status_result');
    };
  }, []);

  const handleResourceClick = (resourceId) => {
    if (resourceId === 'qrcode-scanner') {
      navigate('/teacher/qrcode-scanner');
    } else if (resourceId === 'whiteboard') {
      navigate('/teacher/whiteboard');
    } else if (resourceId === 'grouping-tool') {
      navigate('/teacher/grouping-tool');
    } else if (resourceId === 'student-picker') {
      navigate('/teacher/student-picker');
    }
  };

  return (
    <>
      <Box sx={{ textAlign: 'center', py: 3, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold', 
          color: '#1976d2',
          fontSize: { xs: '2rem', md: '2.5rem' },
          mb: 2
        }}>
          教学工具平台
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ 
          maxWidth: '800px', 
          mx: 'auto',
          fontSize: { xs: '1.1rem', md: '1.3rem' }
        }}>
          为教师提供丰富的教学资源和工具，提升教学效率和质量
        </Typography>
      </Box>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {resources.map((resource) => (
            <Grid item xs={12} md={6} lg={4} key={resource.id}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                  },
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: `2px solid ${resource.color}`
                }}
              >
                <Box sx={{ 
                  p: 3, 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: resource.color,
                  opacity: 0.8
                }}>
                  {resource.icon}
                  <Typography variant="h5" component="h2" sx={{ ml: 2, fontWeight: 'bold' }}>
                    {resource.title}
                  </Typography>
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 2 }}>
                    {resource.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    onClick={() => handleResourceClick(resource.id)}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}
                  >
                    使用{resource.title}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 8, textAlign: 'center', p: 3, bgcolor: '#f5f5f5', borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            智联师生教学平台 - 教学工具资源中心
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} 智联师生教学平台. 保留所有权利.
          </Typography>
        </Box>
      </Container>
    </>
  );
}

export default TeachingTools;