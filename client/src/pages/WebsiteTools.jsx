import { useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, Divider, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Language as LanguageIcon, Link as LinkIcon, Web as WebIcon, Public as PublicIcon, Bookmark as BookmarkIcon, Search as SearchIcon, Timeline, Person as PersonIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function WebsiteTools() {
  const navigate = useNavigate();
  const [resources] = useState([    
    {
      id: 'student-picker',
      title: '抽取学生',
      description: '随机抽取学生回答问题或参与活动，提高课堂参与度，支持避免重复抽取',
      icon: <PersonIcon sx={{ fontSize: 40, color: '#FF9800' }} />,
      color: '#FFF3E0',
      url: ''
    },
    {
      id: 'baidu',
      title: '百度',
      description: '中文搜索引擎和人工智能公司，提供网页搜索、图片搜索、新闻搜索等服务',
      icon: <SearchIcon sx={{ fontSize: 40, color: '#4285F4' }} />,
      color: '#E1F5FE',
      url: 'https://www.baidu.com'
    },
    {
      id: 'google',
      title: 'Google',
      description: '全球最大的搜索引擎，提供网页搜索、图片搜索、地图等多种服务',
      icon: <PublicIcon sx={{ fontSize: 40, color: '#4285F4' }} />,
      color: '#E8F5E9',
      url: 'https://www.google.com'
    },
    {
      id: 'wikipedia',
      title: '维基百科',
      description: '自由的在线百科全书，包含各种学科的知识',
      icon: <BookmarkIcon sx={{ fontSize: 40, color: '#000000' }} />,
      color: '#F5F5F5',
      url: 'https://www.wikipedia.org'
    },
    {
      id: 'github',
      title: 'GitHub',
      description: '面向开源及私有软件项目的托管平台，是全球最大的代码托管网站',
      icon: <WebIcon sx={{ fontSize: 40, color: '#333333' }} />,
      color: '#FAFAFA',
      url: 'https://github.com'
    },
    {
      id: 'bilibili',
      title: '哔哩哔哩',
      description: '中国年轻人喜爱的视频弹幕网站，提供高质量的视频内容',
      icon: <LinkIcon sx={{ fontSize: 40, color: '#FB7299' }} />,
      color: '#FFF3E0',
      url: 'https://www.bilibili.com'
    },
    {
      id: 'zhihu',
      title: '知乎',
      description: '中文互联网高质量的问答社区和创作者聚集的原创内容平台',
      icon: <LanguageIcon sx={{ fontSize: 40, color: '#0084FF' }} />,
      color: '#E3F2FD',
      url: 'https://www.zhihu.com'
    },
    {
      id: 'numberflow',
      title: '数字流可视化',
      description: '数字流可视化工具，帮助教师创建直观的数据展示和教学演示，支持多种可视化模式',
      icon: <Timeline sx={{ fontSize: 40, color: '#673AB7' }} />,
      color: '#D1C4E9',
      url: ''
    }
  ]);

  // 处理网站点击
  const handleWebsiteClick = (resourceId, url) => {
    if (resourceId === 'numberflow') {
      navigate('/teacher/number-flow');
    } else if (resourceId === 'student-picker') {
      navigate('/teacher/student-picker');
    } else {
      window.open(url, '_blank');
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
          网站工具平台
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ 
          maxWidth: '800px', 
          mx: 'auto',
          fontSize: { xs: '1.1rem', md: '1.3rem' }
        }}>
          为教师提供常用网站快捷访问，提高工作效率
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
                    onClick={() => handleWebsiteClick(resource.id, resource.url)}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}
                  >
                    {resource.id === 'numberflow' || resource.id === 'student-picker' ? '使用' : '访问'}{resource.title}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 8, textAlign: 'center', p: 3, bgcolor: '#f5f5f5', borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            智联师生教学平台 - 网站工具资源中心
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} 智联师生教学平台. 保留所有权利.
          </Typography>
        </Box>
      </Container>
    </>
  );
}

export default WebsiteTools;