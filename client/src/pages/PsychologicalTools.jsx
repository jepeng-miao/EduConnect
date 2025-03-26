import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, Divider, Paper, Chip, Avatar, List, ListItem, ListItemIcon, ListItemText, Snackbar, Alert, IconButton, Tooltip } from '@mui/material';
import { Psychology as PsychologyIcon, Mood as MoodIcon, MoodBad as MoodBadIcon, SentimentSatisfied as SatisfiedIcon, SentimentVeryDissatisfied as DissatisfiedIcon, SentimentVerySatisfied as VerySatisfiedIcon, Favorite as FavoriteIcon, ThumbUp as ThumbUpIcon, ArrowBack as ArrowBackIcon, Send as SendIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { socket } from '../main';

function PsychologicalTools() {
  const navigate = useNavigate();

  // 心理工具数据
  const [psychTools] = useState([
    {
      id: 'emotion-cards',
      title: '情绪卡片',
      description: '帮助学生识别、理解和表达不同的情绪，提高情绪管理能力和社交技能',
      icon: <MoodIcon sx={{ fontSize: 40, color: '#EC407A' }} />,
      color: '#F8BBD0'
    },
    {
      id: 'answer-book',
      title: '答案之书',
      description: '一本神奇的书，能够为你的问题提供随机答案，帮助学生缓解压力，培养积极思考',
      icon: <FavoriteIcon sx={{ fontSize: 40, color: '#9C27B0' }} />,
      color: '#E1BEE7'
    }
  ]);
  // 处理工具点击事件
  const handleToolClick = (toolId) => {
    if (toolId === 'emotion-cards') {
      navigate('/teacher/emotion-cards');
    } else if (toolId === 'whiteboard') {
      navigate('/teacher/whiteboard');
    } else if (toolId === 'answer-book') {
      navigate('/teacher/answer-book');
    }
    // 其他工具的处理逻辑可以在这里添加
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
          心理工具平台
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ 
          maxWidth: '800px', 
          mx: 'auto',
          fontSize: { xs: '1.1rem', md: '1.3rem' }
        }}>
          为教师提供心理教育资源和工具，促进学生心理健康发展
        </Typography>
      </Box>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 心理工具部分 */}
        <Grid container spacing={4}>
          {psychTools.map((tool) => (
            <Grid item xs={12} md={4} key={tool.id}>
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
                  border: `2px solid ${tool.color}`,
                  cursor: 'pointer'
                }}
                onClick={() => handleToolClick(tool.id)}
              >
                <Box sx={{ 
                  p: 3, 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: tool.color,
                  opacity: 0.8
                }}>
                  {tool.icon}
                  <Typography variant="h5" component="h2" sx={{ ml: 2, fontWeight: 'bold' }}>
                    {tool.title}
                  </Typography>
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 2 }}>
                    {tool.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    onClick={() => handleToolClick(tool.id)}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}
                  >
                    {tool.id === 'emotion-cards' ? '查看情绪卡片' : `使用${tool.title}`}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 8, textAlign: 'center', p: 3, bgcolor: '#f5f5f5', borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            智联师生教学平台 - 心理工具资源中心
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} 智联师生教学平台. 保留所有权利.
          </Typography>
        </Box>
      </Container>
    </>
  );
}

export default PsychologicalTools;