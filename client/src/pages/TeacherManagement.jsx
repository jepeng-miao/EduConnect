import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';

function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAddTeacher, setOpenAddTeacher] = useState(false);
  const [openEditTeacher, setOpenEditTeacher] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [teacherForm, setTeacherForm] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    department: ''
  });
  
  // 消息提示
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchTeachers();
  }, []);
  
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teachers`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers);
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.message || '获取教师列表失败', 'error');
      }
    } catch (err) {
      console.error('获取教师列表失败:', err);
      showSnackbar('获取教师列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddTeacher = () => {
    setTeacherForm({
      username: '',
      password: '',
      name: '',
      email: '',
      department: ''
    });
    setOpenAddTeacher(true);
  };

  const handleCloseAddTeacher = () => {
    setOpenAddTeacher(false);
  };

  const handleOpenEditTeacher = (teacher) => {
    setSelectedTeacherId(teacher.id);
    setTeacherForm({
      username: teacher.username,
      password: '', // 不显示密码
      name: teacher.name,
      email: teacher.email,
      department: teacher.department
    });
    setOpenEditTeacher(true);
  };

  const handleCloseEditTeacher = () => {
    setOpenEditTeacher(false);
    setSelectedTeacherId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTeacherForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const { username, name, email, department } = teacherForm;
    const password = openAddTeacher ? teacherForm.password : true; // 编辑时密码可以为空
    
    if (!username || !name || !email || !department || !password) {
      showSnackbar('请填写所有必填字段', 'error');
      return false;
    }
    
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showSnackbar('请输入有效的邮箱地址', 'error');
      return false;
    }
    
    return true;
  };

  const handleAddTeacher = async () => {
    if (!validateForm()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teachers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(teacherForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        showSnackbar(data.message || '教师添加成功', 'success');
        handleCloseAddTeacher();
        fetchTeachers();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.message || '添加教师失败', 'error');
      }
    } catch (err) {
      console.error('添加教师错误:', err);
      showSnackbar('添加教师失败', 'error');
    }
  };

  const handleUpdateTeacher = async () => {
    if (!validateForm()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teachers/${selectedTeacherId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(teacherForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        showSnackbar(data.message || '教师信息更新成功', 'success');
        handleCloseEditTeacher();
        fetchTeachers();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.message || '更新教师信息失败', 'error');
      }
    } catch (err) {
      console.error('更新教师信息错误:', err);
      showSnackbar('更新教师信息失败', 'error');
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm('确定要删除这个教师账号吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/teachers/${teacherId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        showSnackbar(data.message || '教师删除成功', 'success');
        fetchTeachers();
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.message || '删除教师失败', 'error');
      }
    } catch (err) {
      console.error('删除教师错误:', err);
      showSnackbar('删除教师失败', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          教师管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddTeacher}
        >
          添加教师
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : teachers.length === 0 ? (
          <Typography variant="body1" align="center" sx={{ p: 3 }}>
            暂无教师数据
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>用户名</TableCell>
                  <TableCell>姓名</TableCell>
                  <TableCell>邮箱</TableCell>
                  <TableCell>部门</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.username}</TableCell>
                    <TableCell>{teacher.name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.department}</TableCell>
                    <TableCell>{new Date(teacher.createdAt).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="编辑">
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleOpenEditTeacher(teacher)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          size="small"
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* 添加教师对话框 */}
      <Dialog open={openAddTeacher} onClose={handleCloseAddTeacher} maxWidth="sm" fullWidth>
        <DialogTitle>添加教师</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="username"
                label="用户名"
                value={teacherForm.username}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="password"
                label="密码"
                type="password"
                value={teacherForm.password}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="姓名"
                value={teacherForm.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="邮箱"
                type="email"
                value={teacherForm.email}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="department"
                label="部门"
                value={teacherForm.department}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddTeacher}>取消</Button>
          <Button onClick={handleAddTeacher} variant="contained" color="primary">
            添加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑教师对话框 */}
      <Dialog open={openEditTeacher} onClose={handleCloseEditTeacher} maxWidth="sm" fullWidth>
        <DialogTitle>编辑教师信息</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="username"
                label="用户名"
                value={teacherForm.username}
                onChange={handleInputChange}
                fullWidth
                required
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="password"
                label="密码 (留空则不修改)"
                type="password"
                value={teacherForm.password}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="姓名"
                value={teacherForm.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="邮箱"
                type="email"
                value={teacherForm.email}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="department"
                label="部门"
                value={teacherForm.department}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditTeacher}>取消</Button>
          <Button onClick={handleUpdateTeacher} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default TeacherManagement;