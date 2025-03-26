import { useState } from 'react';
import { Container, Typography, Grid, Paper, Box, Button, Card, CardContent, CardActions, CardMedia } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SportsEsports as GameIcon, Class as ClassIcon } from '@mui/icons-material';

function TeacherHome() {
  const navigate = useNavigate();

  // 功能卡片数据
  const features = [
    {
      id: 'typing-game',
      title: '打字比赛',
      description: '创建并管理实时打字比赛，查看学生的打字速度和准确率排名',
      icon: <GameIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
      path: '/teacher/typing-game',
      color: '#bbdefb'
    },
    {
      id: 'class-management',
      title: '班级管理',
      description: '管理班级信息，添加、编辑或删除班级，查看班级学生名单',
      icon: <ClassIcon sx={{ fontSize: 40, color: '#388e3c' }} />,
      path: '/teacher/class-management',
      color: '#c8e6c9'
    }
  ];

  return (
    <>
      {/* 将标题移至最顶部 */}
      <Box sx={{ textAlign: 'center', py: 3, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold', 
          color: '#1976d2',
          fontSize: { xs: '2rem', md: '2.5rem' },
          mb: 2
        }}>
          智联师生教学平台
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ 
          maxWidth: '800px', 
          mx: 'auto',
          fontSize: { xs: '1.1rem', md: '1.3rem' }
        }}>
          欢迎使用智联师生教学平台，请选择以下功能开始您的教学活动
        </Typography>
      </Box>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid item xs={12} md={6} key={feature.id}>
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
                  border: `2px solid ${feature.color}`
                }}
              >
                <Box sx={{ 
                  p: 3, 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: feature.color,
                  opacity: 0.8
                }}>
                  {feature.icon}
                  <Typography variant="h5" component="h2" sx={{ ml: 2, fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 2 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    onClick={() => navigate(feature.path)}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      backgroundColor: feature.id === 'typing-game' ? '#1976d2' : '#388e3c',
                      '&:hover': {
                        backgroundColor: feature.id === 'typing-game' ? '#1565c0' : '#2e7d32'
                      }
                    }}
                  >
                    进入{feature.title}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 8, textAlign: 'center', p: 3, bgcolor: '#f5f5f5', borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            智联师生教学平台 - 提升教学效率的得力助手
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} 智联师生教学平台. 保留所有权利.
          </Typography>
        </Box>
      </Container>
    </>
  );
}

export default TeacherHome;