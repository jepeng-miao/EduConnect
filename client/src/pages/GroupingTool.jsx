import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Button, Box, Divider, TextField, Tab, Tabs, Alert, CircularProgress, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Checkbox, FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Group as GroupIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon, AssignmentInd as AssignmentIndIcon, Person as PersonIcon, Refresh as RefreshIcon, Class as ClassIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';
import { socket } from '../main';

function GroupingTool() {
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // 班级选择相关状态
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  // 新建分组表单状态
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  
  // 随机分组表单状态
  const [groupCount, setGroupCount] = useState(2);
  const [customGroupNames, setCustomGroupNames] = useState([]);
  const [useCustomNames, setUseCustomNames] = useState(false);
  const [isRandomOrder, setIsRandomOrder] = useState(false); // 添加是否随机排序的状态
  
  // 按人数分组表单状态
  const [studentsPerGroup, setStudentsPerGroup] = useState(4);
  const [groupPrefix, setGroupPrefix] = useState('分组');
  
  // 编辑分组对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  
  // 添加学生到分组对话框状态
  const [addStudentsDialogOpen, setAddStudentsDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  
  // 分组详情对话框状态
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupStudents, setGroupStudents] = useState([]);
  const [selectedGroupStudents, setSelectedGroupStudents] = useState([]);
  const [selectAllStudents, setSelectAllStudents] = useState(false);
  
  // 任务安排状态 - 修改为学生角色输入功能
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', assignee: '', status: '待完成' });
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({ title: '', assignee: '', status: '待完成' });
  const [taskSortOrder, setTaskSortOrder] = useState('studentId'); // 默认按学号排序
  const [studentCount, setStudentCount] = useState(6); // 学生数量状态
  const [studentRoles, setStudentRoles] = useState({});
  const [studentTaskInputs, setStudentTaskInputs] = useState({});
  
  // 生成学生角色输入框
  const generateStudentRoles = (count, reset = false) => {
    const newRoles = {};
    
    // 保留现有角色值，除非是重置
    for (let i = 1; i <= count; i++) {
      const key = `student${i}`;
      if (!reset) {
        newRoles[key] = studentRoles[key] || '';
      } else {
        newRoles[key] = '';
      }
    }
    
    setStudentRoles(newRoles);
  };
  
  // 生成学生任务输入框
  const generateStudentTaskInputs = (count, reset = false) => {
    const newInputs = {};
    
    // 保留现有输入值，除非是重置
    for (let i = 1; i <= count; i++) {
      const key = `student${i}`;
      if (!reset) {
        // 使用函数式更新确保我们总是获取最新的状态
        setStudentTaskInputs(prevInputs => {
          const updatedInputs = {...prevInputs};
          updatedInputs[key] = prevInputs[key] || '';
          return updatedInputs;
        });
      } else {
        newInputs[key] = '';
        setStudentTaskInputs(newInputs);
      }
    }
  };

  // 处理学生任务输入变化
  const handleStudentTaskInputChange = (studentId, value) => {
    setStudentTaskInputs(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  // 保存学生任务
  const handleSaveStudentTasks = () => {
    const newTasks = [];
    
    Object.entries(studentTaskInputs).forEach(([studentId, taskTitle]) => {
      if (taskTitle.trim()) {
        newTasks.push({
          id: Date.now().toString() + studentId,
          title: taskTitle,
          assignee: studentId,
          status: '待完成',
          createdAt: new Date().toISOString()
        });
      }
    });
    
    setTasks([...tasks, ...newTasks]);
    setSuccess('学生任务保存成功');
    
    // 清除成功消息
    setTimeout(() => setSuccess(''), 3000);
    
    // 重置输入
    const resetInputs = {};
    Object.keys(studentTaskInputs).forEach(key => {
      resetInputs[key] = '';
    });
    setStudentTaskInputs(resetInputs);
  };

  // 添加学生任务输入界面组件
  const renderStudentTaskInputs = () => {
    return (
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
          <AssignmentIndIcon sx={{ mr: 1 }} />
          学生任务分配
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <TextField
            label="学生数量"
            type="number"
            value={studentCount}
            onChange={(e) => {
              const count = Math.max(1, parseInt(e.target.value) || 1);
              setStudentCount(count);
              generateStudentTaskInputs(count);
            }}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
            sx={{ mb: 2, width: 150 }}
          />
        </Box>
        
        <Grid container spacing={2}>
          {Object.keys(studentTaskInputs).map((studentId) => (
            <Grid item xs={12} key={studentId}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ minWidth: 80, fontWeight: 'bold' }}>
                  {studentId.replace('student', '学生')}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="输入任务内容"
                  value={studentTaskInputs[studentId]}
                  onChange={(e) => handleStudentTaskInputChange(studentId, e.target.value)}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveStudentTasks}
            disabled={Object.values(studentTaskInputs).every(value => !value.trim())}
          >
            保存任务
          </Button>
        </Box>
      </Paper>
    );
  };

  // 处理标签页变化
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 创建新分组
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      setError('请输入分组名称');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // 模拟创建分组
    setTimeout(() => {
      const newGroup = {
        id: Date.now().toString(),
        name: newGroupName,
        description: newGroupDescription,
        students: []
      };
      
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setNewGroupDescription('');
      setSuccess('分组创建成功');
      setLoading(false);
      
      // 清除成功消息
      setTimeout(() => setSuccess(''), 3000);
    }, 500);
  };

  // 随机分组功能
  const handleRandomGrouping = () => {
    if (students.length === 0) {
      setError('没有可分配的学生');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // 模拟随机分组
    setTimeout(() => {
      // 根据isRandomOrder决定是否随机排序学生列表
      let studentsToAssign = [...students];
      if (isRandomOrder) {
        // 随机排序
        studentsToAssign.sort(() => Math.random() - 0.5);
      }
      // 否则保持原始顺序
      
      const newGroups = [];
      
      // 创建分组
      for (let i = 0; i < groupCount; i++) {
        const groupName = useCustomNames && customGroupNames[i] ? 
          customGroupNames[i] : `${groupPrefix}${i + 1}`;
          
        newGroups.push({
          id: Date.now().toString() + i,
          name: groupName,
          description: `${isRandomOrder ? '随机' : '顺序'}分组 - ${groupName}`,
          students: []
        });
      }
      
      // 分配学生到各个分组
      if (isRandomOrder) {
        // 随机分组：按照索引取模分配
        studentsToAssign.forEach((student, index) => {
          const groupIndex = index % groupCount;
          newGroups[groupIndex].students.push(student);
        });
      } else {
        // 顺序分组：按照连续的学号范围分配
        // 计算每组应有的学生数量（向上取整，确保每组至少有一个学生）
        const studentsPerGroup = Math.ceil(studentsToAssign.length / groupCount);
        
        // 按照连续范围分配学生
        studentsToAssign.forEach((student, index) => {
          // 计算学生应该分到哪个组（按照顺序分段）
          const groupIndex = Math.floor(index / studentsPerGroup);
          // 确保不超出组的数量
          if (groupIndex < groupCount) {
            newGroups[groupIndex].students.push(student);
          } else {
            // 如果超出了组的数量，将剩余学生添加到最后一个组
            newGroups[groupCount - 1].students.push(student);
          }
        });
      }
      
      setGroups(newGroups);
      setSuccess(`${isRandomOrder ? '随机' : '顺序'}分组完成`);
      setLoading(false);
      
      // 清除成功消息
      setTimeout(() => setSuccess(''), 3000);
    }, 800);
  };
  
  // 按人数批量分组功能
  const handleGroupingBySize = () => {
    if (students.length === 0) {
      setError('没有可分配的学生');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // 模拟按人数分组
    setTimeout(() => {
      // 计算需要创建的分组数量（向上取整）
      const totalGroups = Math.ceil(students.length / studentsPerGroup);
      const newGroups = [];
      
      // 创建分组
      for (let i = 0; i < totalGroups; i++) {
        newGroups.push({
          id: Date.now().toString() + i,
          name: `${groupPrefix}${i + 1}`,
          description: `按人数分组 - ${groupPrefix}${i + 1}`,
          students: []
        });
      }
      
      // 按顺序分配学生到各个小组
      students.forEach((student, index) => {
        const groupIndex = Math.floor(index / studentsPerGroup);
        newGroups[groupIndex].students.push(student);
      });
      
      setGroups(newGroups);
      setSuccess('按人数分组完成');
      setLoading(false);
      
      // 清除成功消息
      setTimeout(() => setSuccess(''), 3000);
    }, 800);
  };

  // 初始化数据
  useEffect(() => {
    // 获取班级列表
    fetchClasses();
    
    // 初始化学生任务输入框
    generateStudentTaskInputs(studentCount);
    
    // 监听班级选择事件
    socket.on('class_selected', (data) => {
      setSelectedClass(data.classId);
      // 当收到班级选择事件时，获取该班级的学生列表
      if (data.classId) {
        fetchStudents(data.classId);
      }
    });
    
    // 页面加载时检查是否已有选定的班级
    socket.emit('get_selected_class');
    
    return () => {
      socket.off('class_selected');
    };
  }, []);
  
  // 当选中班级变化时，获取该班级的学生列表
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass]);
  
  // 获取班级列表
  const fetchClasses = async () => {
    setLoading(true);
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
        }
      } else {
        console.error('获取班级列表失败，状态码:', response.status);
        setError('获取班级列表失败');
      }
    } catch (err) {
      console.error('获取班级列表失败:', err);
      setError('获取班级列表失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };
  
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
        console.log('获取到的学生数据:', data);
        
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
        
        console.log('排序后的学生列表:', sortedStudents);
        setStudents(sortedStudents);
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
  
  // 班级选择现在由顶部标题栏统一处理
  // 此组件只需监听班级选择事件并获取相应的学生列表

  // 渲染分组列表
  const renderGroupList = () => {
    if (groups.length === 0) {
      return (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">
            暂无分组，请创建新分组或使用随机分组功能
          </Typography>
        </Paper>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {groups.map((group) => (
          <Grid item xs={12} md={6} lg={4} key={group.id}>
            <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                  <GroupIcon sx={{ mr: 1 }} />
                  {group.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {group.description || '无描述'}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ mb: 1 }}>
                  学生数量: {group.students ? group.students.length : 0}
                </Typography>
                
                {/* 显示学生列表 */}
                {group.students && group.students.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      学生名单:
                    </Typography>
                    <Box sx={{ maxHeight: '150px', overflowY: 'auto', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                      {group.students.map((student, index) => (
                        <Box key={student.id || index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: '#757575' }} />
                          <Typography variant="body2">
                            {student.name} ({student.studentId})
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button size="small" startIcon={<EditIcon />}>
                  编辑
                </Button>
                <Button size="small" color="error" startIcon={<DeleteIcon />}>
                  删除
                </Button>
                <Button 
                  size="small" 
                  color="primary" 
                  onClick={() => handleViewGroupDetails(group)}
                  startIcon={<GroupIcon />}
                >
                  查看详情
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  

  // 渲染创建分组表单
  const renderCreateGroupForm = () => {
    return (
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
          <AddIcon sx={{ mr: 1 }} />
          创建新分组
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="分组名称"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="分组描述"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateGroup}
            disabled={loading}
          >
            创建分组
          </Button>
        </Box>
      </Paper>
    );
  };

  // 渲染随机分组表单
  const renderRandomGroupForm = () => {
    return (
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
          <RefreshIcon sx={{ mr: 1 }} />
          自动分组
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="分组数量"
              type="number"
              value={groupCount}
              onChange={(e) => setGroupCount(Math.max(2, parseInt(e.target.value) || 2))}
              InputProps={{ inputProps: { min: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="分组名称前缀"
              value={groupPrefix}
              onChange={(e) => setGroupPrefix(e.target.value)}
              disabled={useCustomNames}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={useCustomNames}
                  onChange={(e) => setUseCustomNames(e.target.checked)}
                />
              }
              label="使用自定义分组名称"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isRandomOrder}
                  onChange={(e) => setIsRandomOrder(e.target.checked)}
                />
              }
              label="随机排序学生（默认按顺序分组）"
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRandomGrouping}
            disabled={loading}
          >
            开始自动分组
          </Button>
        </Box>
      </Paper>
    );
  };

  // 处理查看分组详情
  const handleViewGroupDetails = (group) => {
    setSelectedGroup(group);
    setGroupStudents(group.students || []);
    setDetailsDialogOpen(true);
  };
  
  // 关闭分组详情对话框
  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedGroup(null);
    setGroupStudents([]);
    setSelectedGroupStudents([]);
    setSelectAllStudents(false);
  };
  
  // 组件的主要返回部分
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0 }}>
          班级分组工具
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="分组工具标签">
          <Tab label="分组管理" />
          <Tab label="学生任务" />
        </Tabs>
      </Box>
      
      {tabValue === 0 ? (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              {renderRandomGroupForm()}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderCreateGroupForm()}
            </Grid>
          </Grid>
          
          <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
            分组列表
          </Typography>
          
          {renderGroupList()}
        </>
      ) : (
        <>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
            学生任务分配
          </Typography>
          
          {renderStudentTaskInputs()}
          
          {tasks.length > 0 && (
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                <AssignmentIndIcon sx={{ mr: 1 }} />
                已分配任务
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List>
                {tasks.map((task) => (
                  <ListItem key={task.id} divider>
                    <ListItemText
                      primary={task.title}
                      secondary={`分配给: ${task.assignee.replace('student', '学生')} | 状态: ${task.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </>
      )}
      
      {/* 分组详情对话框 */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', display: 'flex', alignItems: 'center' }}>
          <GroupIcon sx={{ mr: 1 }} />
          {selectedGroup?.name} - 详细信息
        </DialogTitle>
        <DialogContent dividers>
          {selectedGroup && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                <strong>分组描述:</strong> {selectedGroup.description || '无描述'}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>学生数量:</strong> {groupStudents.length}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                学生名单
              </Typography>
              
              {groupStudents.length > 0 ? (
                <List sx={{ bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: '300px', overflow: 'auto' }}>
                  {groupStudents.map((student) => (
                    <ListItem key={student.id} divider>
                      <ListItemText
                        primary={student.name}
                        secondary={`学号: ${student.studentId}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  该分组暂无学生
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} color="primary">
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default GroupingTool;