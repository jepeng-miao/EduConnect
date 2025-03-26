import { useState, useEffect, useRef } from 'react';
import { Container, Typography, Grid, Paper, Button, Box, Divider, Avatar, IconButton, Tooltip, Card, CardContent, CircularProgress, FormControlLabel, Switch, List, ListItem, ListItemAvatar, ListItemText, Chip, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Shuffle as ShuffleIcon, ArrowBack as ArrowBackIcon, Refresh as RefreshIcon, Person as PersonIcon, History as HistoryIcon, Settings as SettingsIcon, Class as ClassIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { socket } from '../main';
import { API_BASE_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';

function StudentPicker() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickedHistory, setPickedHistory] = useState([]);
  const [remainingStudents, setRemainingStudents] = useState([]);
  const [avoidRepeat, setAvoidRepeat] = useState(true);
  
  // 动画参考
  const animationRef = useRef(null);
  const animationDuration = 2000; // 动画持续时间（毫秒）

  // 添加班级列表状态
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // 获取班级列表
  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/class/classes`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
        
        // 如果有班级且没有选中的班级，默认选择第一个
        if (data.classes.length > 0 && !selectedClass) {
          setSelectedClass(data.classes[0].id);
          fetchStudents(data.classes[0].id);
        }
      } else {
        console.error('获取班级列表失败，状态码:', response.status);
        setError('获取班级列表失败');
      }
    } catch (err) {
      console.error('获取班级列表失败:', err);
      setError('获取班级列表失败，请检查网络连接');
    } finally {
      setLoadingClasses(false);
    }
  };

  // 处理班级选择变化
  const handleClassChange = (event) => {
    const classId = event.target.value;
    setSelectedClass(classId);
    fetchStudents(classId);
    
    // 保存选择的班级信息到localStorage
    const selectedClassInfo = classes.find(c => c.id === classId);
    if (selectedClassInfo) {
      localStorage.setItem('selectedClassInfo', JSON.stringify(selectedClassInfo));
      
      // 触发班级选择事件，通知其他组件
      socket.emit('select_class', { 
        classId,
        className: selectedClassInfo.name
      });
    }
  };

  useEffect(() => {
    // 获取班级列表
    fetchClasses();
    
    // 从localStorage获取当前选择的班级
    const classInfo = localStorage.getItem('selectedClassInfo');
    if (classInfo) {
      try {
        const parsedInfo = JSON.parse(classInfo);
        console.log('从localStorage获取的班级信息:', parsedInfo);
        setSelectedClass(parsedInfo.id);
        fetchStudents(parsedInfo.id);
      } catch (err) {
        console.error('解析班级信息失败:', err);
        setError('班级信息格式错误');
      }
    }
    
    // 监听班级选择变化 - 使用socket事件
    socket.on('class_selected', (data) => {
      console.log('收到班级选择事件:', data);
      if (data && data.classId) {
        setSelectedClass(data.classId);
        fetchStudents(data.classId);
      }
    });
    
    // 页面加载时主动请求获取当前选定的班级信息
    socket.emit('get_selected_class');
    
    return () => {
      socket.off('class_selected');
    };
  }, []);

  // 获取学生列表
  const fetchStudents = async (classId) => {
    if (!classId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/class/classes/${classId}/students`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('获取到的学生数据:', data); // 添加日志，查看返回的数据结构
        
        // 检查数据结构，确保data.students存在
        const studentsList = data.students || data || [];
        
        // 对学生列表进行排序，优先按数字学号排序，非数字学号按字符串排序
        const sortedStudents = studentsList.sort((a, b) => {
          const numA = parseInt(a.studentId);
          const numB = parseInt(b.studentId);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return a.studentId.localeCompare(b.studentId);
        });
        
        console.log('排序后的学生列表:', sortedStudents); // 添加日志，查看排序后的学生列表
        setStudents(sortedStudents);
        setRemainingStudents(sortedStudents);
      } else {
        console.error('获取学生列表失败，状态码:', response.status);
        setError('获取学生列表失败');
      }
    } catch (err) {
      console.error('获取学生列表失败:', err);
      setError('获取学生列表失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 随机抽取学生
  const pickRandomStudent = () => {
    if (students.length === 0) {
      setError('没有可用的学生');
      return;
    }
    
    // 如果启用了避免重复且剩余学生为0，显示提示信息并返回
    if (avoidRepeat && remainingStudents.length === 0) {
      setError('所有学生已抽取完毕，请点击"重置历史"按钮开始新一轮抽取');
      setTimeout(() => setError(''), 5000); // 5秒后清除提示
      return;
    }
    
    setIsSelecting(true);
    setError('');
    
    // 创建动画效果，快速切换不同学生
    let startTime = Date.now();
    let interval = 100; // 初始切换间隔（毫秒）
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      // 随着时间推移，减慢切换速度
      interval = 100 + Math.floor(elapsedTime / 500) * 50;
      
      // 从可用学生中随机选择一个
      const pool = avoidRepeat ? remainingStudents : students;
      const randomIndex = Math.floor(Math.random() * pool.length);
      const randomStudent = pool[randomIndex];
      
      setSelectedStudent(randomStudent);
      
      if (elapsedTime < animationDuration) {
        // 继续动画
        animationRef.current = setTimeout(animate, interval);
      } else {
        // 动画结束，确定最终选中的学生
        setIsSelecting(false);
        
        // 更新历史记录和剩余学生列表
        if (avoidRepeat && randomStudent) {
          setPickedHistory(prev => [randomStudent, ...prev]);
          // 添加日志，查看过滤前的剩余学生数量
          console.log('过滤前剩余学生数量:', remainingStudents.length);
          console.log('当前选中学生:', randomStudent);
          
          // 修改过滤条件，确保只过滤掉当前选中的学生
          console.log('当前选中学生:', randomStudent);
          
          setRemainingStudents(prev => {
            // 确保prev是一个数组
            if (!Array.isArray(prev)) {
              console.error('remainingStudents不是数组:', prev);
              return [];
            }
            
            // 添加日志，查看当前学生对象的结构
            console.log('当前学生对象结构:', prev[0]);
            console.log('随机选中学生对象结构:', randomStudent);
            
            // 确保只过滤掉当前选中的学生
            const filtered = prev.filter(s => {
              // 确保s是一个有效的对象
              if (!s) {
                console.warn('发现无效的学生对象');
                return false;
              }
              
              // 尝试所有可能的ID字段进行比较
              // 首先检查是否有相同的studentId字段（学号）
              if (s.studentId && randomStudent.studentId && s.studentId === randomStudent.studentId) {
                return false;
              }
              
              // 然后检查id或_id字段
              if (s.id && randomStudent.id && s.id === randomStudent.id) {
                return false;
              }
              
              if (s._id && randomStudent._id && s._id === randomStudent._id) {
                return false;
              }
              
              // 如果所有ID字段都不匹配，则保留该学生
              return true;
            });
            
            console.log('过滤后剩余学生数量:', filtered.length);
            return filtered;
          });
        } else if (randomStudent) {
          setPickedHistory(prev => [randomStudent, ...prev]);
        }
      }
    };
    
    // 开始动画
    animationRef.current = setTimeout(animate, interval);
  };

  // 重置抽取历史
  const resetHistory = () => {
    setPickedHistory([]);
    setRemainingStudents([...students]);
    setSelectedStudent(null);
  };

  // 清除动画定时器
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  return (
    <>
      <Box sx={{ textAlign: 'center', py: 3, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', position: 'relative' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/website-tools')}
          sx={{ 
            position: 'absolute', 
            left: 16, 
            top: 16,
            borderRadius: 2,
            fontWeight: 'bold'
          }}
        >
          返回工具平台
        </Button>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold', 
          color: '#1976d2',
          fontSize: { xs: '2rem', md: '2.5rem' },
          mb: 2
        }}>
          随机抽取学生
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ 
          maxWidth: '800px', 
          mx: 'auto',
          fontSize: { xs: '1.1rem', md: '1.3rem' }
        }}>
          公平随机抽取学生回答问题或参与活动，提高课堂参与度
        </Typography>
      </Box>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 刷新学生列表 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // 手动触发获取学生列表
              if (selectedClass) {
                fetchStudents(selectedClass);
              } else {
                setError('请先选择班级');
              }
            }}
            startIcon={<RefreshIcon />}
            disabled={loading || !selectedClass}
          >
            刷新学生列表
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2, width: '100%' }}>{error}</Alert>
        )}
        
        <Grid container spacing={4}>
          {/* 左侧 - 学生列表 */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 3,
                border: '2px solid #bbdefb'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  学生列表
                </Typography>
                <Tooltip title="刷新学生列表">
                  <IconButton 
                    color="primary" 
                    onClick={() => fetchStudents(selectedClass)}
                    disabled={loading || !selectedClass}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error" sx={{ my: 2 }}>{error}</Typography>
              ) : students.length === 0 ? (
                <Typography color="text.secondary" sx={{ my: 2 }}>
                  暂无学生信息，请先选择班级
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                  <Grid container spacing={1}>
                    {students.map((student) => (
                      <Grid item xs={12} key={student.id}>
                        <Paper 
                          elevation={1}
                          sx={{ 
                            p: 1, 
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: remainingStudents.some(s => 
                              (s.id && student.id && s.id === student.id) || 
                              (s._id && student._id && s._id === student._id) || 
                              (s.studentId && student.studentId && s.studentId === student.studentId)
                            ) ? '#fff' : '#f5f5f5',
                            opacity: remainingStudents.some(s => 
                              (s.id && student.id && s.id === student.id) || 
                              (s._id && student._id && s._id === student._id) || 
                              (s.studentId && student.studentId && s.studentId === student.studentId)
                            ) ? 1 : 0.6,
                            borderLeft: (selectedStudent?.id === student.id || 
                                        selectedStudent?._id === student._id || 
                                        selectedStudent?.studentId === student.studentId) 
                                        ? '4px solid #4caf50' : 'none',
                          }}
                        >
                          <Avatar sx={{ bgcolor: remainingStudents.some(s => s.id === student.id) ? '#1976d2' : '#bdbdbd', mr: 2 }}>
                            {student.name[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              {student.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              学号: {student.studentId}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* 中间 - 抽取区域 */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 3,
                border: '2px solid #c8e6c9',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50', mb: 2, textAlign: 'center' }}>
                <ShuffleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                随机抽取
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center'
              }}>
                <AnimatePresence mode="wait">
                  {selectedStudent ? (
                    <motion.div
                      key={selectedStudent.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: '100%', textAlign: 'center' }}
                    >
                      <Avatar 
                        sx={{ 
                          width: 120, 
                          height: 120, 
                          mx: 'auto', 
                          mb: 2,
                          bgcolor: '#4caf50',
                          fontSize: '3rem',
                          boxShadow: 3
                        }}
                      >
                        {selectedStudent.name[0]}
                      </Avatar>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {selectedStudent.name}
                      </Typography>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                        学号: {selectedStudent.studentId}
                      </Typography>
                    </motion.div>
                  ) : (
                    <Box sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar 
                        sx={{ 
                          width: 120, 
                          height: 120, 
                          mx: 'auto', 
                          mb: 2,
                          bgcolor: '#e0e0e0',
                          fontSize: '3rem'
                        }}
                      >
                        ?
                      </Avatar>
                      <Typography variant="h6" color="text.secondary">
                        点击下方按钮开始抽取学生
                      </Typography>
                    </Box>
                  )}
                </AnimatePresence>
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<ShuffleIcon />}
                  onClick={pickRandomStudent}
                  disabled={isSelecting || students.length === 0 || (avoidRepeat && remainingStudents.length === 0)}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }}
                >
                  {isSelecting ? '抽取中...' : 
                   (avoidRepeat && remainingStudents.length === 0 && pickedHistory.length > 0) ? '已抽取完毕' : 
                   `随机抽取${avoidRepeat ? `(剩余${remainingStudents.length}名)` : ''}`}
                </Button>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={resetHistory}
                    disabled={isSelecting || pickedHistory.length === 0}
                    startIcon={<RefreshIcon />}
                  >
                    重置历史
                  </Button>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={avoidRepeat}
                        onChange={(e) => setAvoidRepeat(e.target.checked)}
                        color="primary"
                        disabled={isSelecting}
                      />
                    }
                    label="避免重复"
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          {/* 右侧 - 抽取历史 */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 3,
                border: '2px solid #ffcc80'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800', mb: 2, textAlign: 'center' }}>
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                抽取历史
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              {pickedHistory.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    暂无抽取历史记录
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                  {pickedHistory.map((student, index) => (
                    <motion.div
                      key={`${student.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ListItem 
                        sx={{ 
                          mb: 1, 
                          bgcolor: '#fff8e1', 
                          borderRadius: 2,
                          border: '1px solid #ffe0b2'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#ff9800' }}>
                            {student.name[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={student.name}
                          secondary={`学号: ${student.studentId} | 抽取序号: ${pickedHistory.length - index}`}
                        />
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              )}
              
              {pickedHistory.length > 0 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    已抽取 {pickedHistory.length} 名学生
                    {avoidRepeat && students.length > 0 && (
                      <>, 剩余 {remainingStudents.length} 名学生</>
                    )}
                  </Typography>
                </Box>
              )}
            </Paper>
            
            <Button
              variant="contained"
              color="primary"
              disabled={students.length === 0}
              startIcon={<RefreshIcon />}
              onClick={() => {
                resetHistory();
                fetchStudents(selectedClass);
              }}
              sx={{ mt: 2, width: '100%' }}
            >
              重新抽取所有学生
            </Button>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default StudentPicker;