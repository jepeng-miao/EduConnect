import { useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, Divider, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { MenuBook as MenuBookIcon, School as SchoolIcon, Quiz as QuizIcon, VideoLibrary as VideoIcon, Assignment as AssignmentIcon, EmojiObjects as IdeaIcon, QrCode as QrCodeIcon, Photo as PhotoIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function LearningTools() {
  const navigate = useNavigate();
  const [resources] = useState([  
    {
      id: 'qrcode-scanner',
      title: '二维码识别',
      description: '上传图片识别二维码内容，快速获取二维码信息',
      icon: <QrCodeIcon sx={{ fontSize: 40, color: '#009688' }} />,
      color: '#b2dfdb'
    },
    {
      id: 'image-filter',
      title: '图片滤镜',
      description: '上传图片并应用各种滤镜效果，调整图片的亮度、对比度和饱和度',
      icon: <PhotoIcon sx={{ fontSize: 40, color: '#673ab7' }} />,
      color: '#d1c4e9'
    }
  ]);

  // 处理资源卡片点击
  const handleResourceClick = (resourceId) => {
    if (resourceId === 'qrcode-scanner') {
      navigate('/teacher/qrcode-scanner');
    } else if (resourceId === 'image-filter') {
      navigate('/teacher/image-filter');
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
          学习工具平台
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ 
          maxWidth: '800px', 
          mx: 'auto',
          fontSize: { xs: '1.1rem', md: '1.3rem' }
        }}>
          为学生提供丰富的学习资源和工具，提高学习效率和学习成果
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
            智联师生教学平台 - 学习工具资源中心
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} 智联师生教学平台. 保留所有权利.
          </Typography>
        </Box>
      </Container>
    </>
  );
}

export default LearningTools;