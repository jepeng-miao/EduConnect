import { useState, useEffect } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon, ListItemText, IconButton, FormControl, InputLabel, Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, Paper, Avatar, Grid, Chip } from '@mui/material';
import { Menu as MenuIcon, SportsEsports as GameIcon, Class as ClassIcon, People as PeopleIcon, School as SchoolIcon, Book as BookIcon, MenuBook as MenuBookIcon, QrCode as QrCodeIcon, Psychology as PsychologyIcon, Language as LanguageIcon } from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import { socket } from '../main';
import { API_BASE_URL } from '../config';

const drawerWidth = 240;

function TeacherLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [openStudentDialog, setOpenStudentDialog] = useState(false);
  const [students, setStudents] = useState([]);
  const [loggedInStudents, setLoggedInStudents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();

    socket.on('student_logged_in', (data) => {
      setLoggedInStudents(prev => [...prev, data.studentId]);
    });

    socket.on('student_logged_out', (data) => {
      setLoggedInStudents(prev => prev.filter(id => id !== data.studentId));
    });
    
    // 监听学生离线事件（心跳超时）
    socket.on('student_offline', (data) => {
      setLoggedInStudents(prev => prev.filter(id => id !== data.studentId));
    });

    return () => {
      socket.off('student_logged_in');
      socket.off('student_logged_out');
      socket.off('student_offline');
    };
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchStudents = async (classId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/class/classes/${classId}/students`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // 对学生列表进行排序，优先按数字学号排序，非数字学号按字符串排序
        const sortedStudents = data.students.sort((a, b) => {
          const numA = parseInt(a.studentId);
          const numB = parseInt(b.studentId);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return a.studentId.localeCompare(b.studentId);
        });
        setStudents(sortedStudents);
      }
    } catch (err) {
      console.error('获取学生列表失败:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/class/classes`, {
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleClassChange = (event) => {
    const classId = event.target.value;
    setSelectedClass(classId);
    const selectedClassInfo = classes.find(c => c.id === classId);
    if (selectedClassInfo) {
      socket.emit('select_class', { 
        classId,
        className: selectedClassInfo.name
      });
    }
  };

  const menuItems = [
    {
      text: '教学工具',
      icon: <BookIcon />,
      path: '/teacher/teaching-tools'
    },
    {
      text: '学习工具',
      icon: <MenuBookIcon />,
      path: '/teacher/learning-tools'
    },
    {
      text: '心理工具',
      icon: <PsychologyIcon />,
      path: '/teacher/psychological-tools'
    },
    {
      text: '网站工具',
      icon: <LanguageIcon />,
      path: '/teacher/website-tools'
    },
    {
      text: '班级管理',
      icon: <ClassIcon />,
      path: '/teacher/class-management'
    },
    {
      text: '教师管理',
      icon: <SchoolIcon />,
      path: '/teacher/teacher-management'
    }
  ];

  const drawer = (
    <div>
      <Toolbar />
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.text} onClick={() => navigate(item.path)} sx={{
            '&:hover': {
              backgroundColor: '#e3f2fd',
            },
            borderRadius: 2,
            my: 1.5,
            mx: 2
          }}>
            <ListItemIcon sx={{ color: '#1976d2', minWidth: '40px' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: '1.1rem',
                  fontWeight: 'medium'
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#2196f3',
        boxShadow: 3
      }}>
        <Toolbar sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            onClick={() => navigate('/teacher')}
            sx={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
              flexGrow: 1,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
          >
            智联师生
          </Typography>
          <FormControl 
            sx={{ 
              minWidth: 200,
              mr: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                color: '#fff'
              },
              '& .MuiInputLabel-root': {
                color: '#fff'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)'
              },
              '& .MuiSelect-icon': {
                color: '#fff'
              }
            }}
          >
            <InputLabel>选择班级</InputLabel>
            <Select
              value={selectedClass}
              onChange={handleClassChange}
              label="选择班级"
              size="small"
            >
              {classes.map((classItem) => (
                <MenuItem key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<PeopleIcon />}
            onClick={() => setOpenStudentDialog(true)}
            disabled={!selectedClass}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              },
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            查看学生
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            backgroundColor: '#fff',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
          },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            backgroundColor: '#fff',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)'
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          mt: '64px'
        }}
      >
        <Outlet />
      </Box>

      <Dialog 
        open={openStudentDialog} 
        onClose={() => setOpenStudentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>学生列表</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {students.map((student) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={student.studentId}>
                  <Paper 
                    elevation={1}
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: loggedInStudents.includes(student.studentId) ? '#e8f5e9' : '#fff',
                      border: loggedInStudents.includes(student.studentId) ? '1px solid #4caf50' : 'none',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3
                      }
                    }}
                  >
                    <Avatar sx={{ mb: 1, width: 56, height: 56, bgcolor: loggedInStudents.includes(student.studentId) ? '#4caf50' : '#bdbdbd' }}>
                      {student.name[0]}
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium', textAlign: 'center' }}>
                      {student.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      学号: {student.studentId}
                    </Typography>
                    {loggedInStudents.includes(student.studentId) && (
                      <Chip
                        label="在线"
                        size="small"
                        sx={{ 
                          mt: 1,
                          bgcolor: '#4caf50',
                          color: 'white',
                          fontWeight: 'medium'
                        }}
                      />
                    )}
                  </Paper>
                </Grid>
              ))}
              {students.length === 0 && (
                <Grid item xs={12}>
                  <Typography color="text.secondary" align="center">
                    暂无学生信息
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default TeacherLayout;