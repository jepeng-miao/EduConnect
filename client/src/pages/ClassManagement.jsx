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
  Input,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  InputAdornment,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Class as ClassIcon, 
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Save as SaveIcon
} from '@mui/icons-material';

function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAddClass, setOpenAddClass] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [studentNameList, setStudentNameList] = useState('');
  const [classForm, setClassForm] = useState({
    name: '',
    grade: '',
    description: ''
  });
  
  // 学生列表相关状态
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalStudents, setTotalStudents] = useState(0);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // 学生编辑相关状态
  const [openAddStudent, setOpenAddStudent] = useState(false);
  const [openEditStudent, setOpenEditStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    studentId: '',
    name: ''
  });
  const [editingStudentId, setEditingStudentId] = useState(null);
  
  // 消息提示
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchClasses();
  }, []);
  
  // 当选中班级ID变化时，获取该班级的学生列表
  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
    } else {
      setStudents([]);
      setFilteredStudents([]);
    }
  }, [selectedClassId]);
  
  // 当搜索词或页码变化时，过滤学生列表
  useEffect(() => {
    filterStudents();
  }, [searchTerm, page, students]);

  const fetchClasses = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleClassFormChange = (e) => {
    const { name, value } = e.target;
    setClassForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddClass = async () => {
    if (!classForm.name || !classForm.grade) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/manage/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classForm),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setClasses(prev => [data.class, ...prev]);
        setOpenAddClass(false);
        setClassForm({ name: '', grade: '', description: '' });
      }
    } catch (err) {
      console.error('创建班级失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportStudents = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedClassId) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/manage/classes/${selectedClassId}/students/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        alert('学生信息导入成功');
        setOpenImportDialog(false);
      } else {
        const error = await response.json();
        alert(error.message || '导入失败');
      }
    } catch (err) {
      console.error('导入学生信息失败:', err);
      alert('导入失败，请检查文件格式');
    }
  };

  const handleImportStudentsByText = async () => {
    if (!studentNameList.trim() || !selectedClassId) return;
    
    setLoading(true);
    try {
      // 将文本按行分割，每行包含学号和姓名（用空格分隔）
      const studentRecords = studentNameList.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            // 第一部分作为学号，其余部分合并作为姓名
            const studentId = parts[0];
            const name = parts.slice(1).join(' ');
            return { studentId, name };
          }
          return null;
        })
        .filter(record => record !== null);
      
      const response = await fetch(`${API_BASE_URL}/api/manage/classes/${selectedClassId}/students/import-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentRecords }),
        credentials: 'include'
      });

      if (response.ok) {
        showSnackbar('学生信息导入成功', 'success');
        setOpenImportDialog(false);
        setStudentNameList('');
        fetchStudents(); // 重新获取学生列表
      } else {
        const error = await response.json();
        showSnackbar(error.message || '导入失败', 'error');
      }
    } catch (err) {
      console.error('导入学生信息失败:', err);
      showSnackbar('导入失败，请检查输入格式', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 获取班级学生列表
  const fetchStudents = async () => {
    if (!selectedClassId) return;
    
    setLoadingStudents(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/class/classes/${selectedClassId}/students`, {
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
        setTotalStudents(sortedStudents.length);
      }
    } catch (err) {
      console.error('获取学生列表失败:', err);
      showSnackbar('获取学生列表失败', 'error');
    } finally {
      setLoadingStudents(false);
    }
  };
  
  // 过滤学生列表
  const filterStudents = () => {
    let filtered = students;
    
    // 应用搜索过滤
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.studentId.toLowerCase().includes(term) || 
        student.name.toLowerCase().includes(term)
      );
    }
    
    // 设置总数
    setTotalStudents(filtered.length);
    
    // 应用分页
    const startIndex = (page - 1) * rowsPerPage;
    filtered = filtered.slice(startIndex, startIndex + rowsPerPage);
    
    setFilteredStudents(filtered);
  };
  
  // 处理学生表单变化
  const handleStudentFormChange = (e) => {
    const { name, value } = e.target;
    setStudentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 添加学生
  const handleAddStudent = async () => {
    if (!studentForm.studentId || !studentForm.name || !selectedClassId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/manage/classes/${selectedClassId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentRecords: [studentForm]
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        showSnackbar('添加学生成功', 'success');
        setOpenAddStudent(false);
        setStudentForm({ studentId: '', name: '' });
        fetchStudents(); // 重新获取学生列表
      } else {
        const error = await response.json();
        showSnackbar(error.message || '添加学生失败', 'error');
      }
    } catch (err) {
      console.error('添加学生失败:', err);
      showSnackbar('添加学生失败', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 编辑学生
  const handleEditStudent = async () => {
    if (!studentForm.studentId || !studentForm.name || !selectedClassId || !editingStudentId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/manage/classes/${selectedClassId}/students/${editingStudentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentForm),
        credentials: 'include'
      });
      
      if (response.ok) {
        showSnackbar('更新学生信息成功', 'success');
        setOpenEditStudent(false);
        setStudentForm({ studentId: '', name: '' });
        setEditingStudentId(null);
        fetchStudents(); // 重新获取学生列表
      } else {
        const error = await response.json();
        showSnackbar(error.message || '更新学生信息失败', 'error');
      }
    } catch (err) {
      console.error('更新学生信息失败:', err);
      showSnackbar('更新学生信息失败', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 删除学生
  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('确定要删除该学生吗？')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/manage/classes/${selectedClassId}/students/${studentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        showSnackbar('删除学生成功', 'success');
        fetchStudents(); // 重新获取学生列表
      } else {
        const error = await response.json();
        showSnackbar(error.message || '删除学生失败', 'error');
      }
    } catch (err) {
      console.error('删除学生失败:', err);
      showSnackbar('删除学生失败', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 打开编辑学生对话框
  const handleOpenEditStudent = (student) => {
    setStudentForm({
      studentId: student.studentId,
      name: student.name
    });
    setEditingStudentId(student.id);
    setOpenEditStudent(true);
  };
  
  // 处理分页变化
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  // 显示消息提示
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // 关闭消息提示
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
        班级管理
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <ClassIcon sx={{ mr: 1 }} />
                班级列表
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddClass(true)}
              >
                添加班级
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {classes.length > 0 ? (
                  classes.map((classItem) => (
                    <ListItem 
                      key={classItem.id} 
                      button 
                      selected={selectedClassId === classItem.id}
                      onClick={() => {
                        setSelectedClassId(classItem.id);
                        setSelectedClassName(classItem.name);
                      }}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&.Mui-selected': {
                          backgroundColor: '#e3f2fd',
                          '&:hover': {
                            backgroundColor: '#bbdefb'
                          }
                        }
                      }}
                    >
                      <ListItemText
                        primary={classItem.name}
                        secondary={`年级：${classItem.grade}`}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="导入学生">
                          <IconButton 
                            edge="end" 
                            sx={{ mr: 1, color: '#4caf50' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClassId(classItem.id);
                              setSelectedClassName(classItem.name);
                              setOpenImportDialog(true);
                            }}
                          >
                            <CloudUploadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除班级">
                          <IconButton 
                            edge="end" 
                            sx={{ color: '#f44336' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // 这里可以添加删除班级的逻辑
                              if (window.confirm(`确定要删除 ${classItem.name} 班级吗？`)) {
                                // 删除班级的API调用
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      暂无班级，请点击"添加班级""
                    </Typography>
                  </Box>
                )}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* 右侧学生列表区域 */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                {selectedClassId ? `${selectedClassName} - 学生列表` : '请选择班级查看学生'}
              </Typography>
              {selectedClassId && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddStudent(true)}
                  sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
                >
                  添加学生
                </Button>
              )}
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {selectedClassId && (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="搜索学生（学号或姓名）"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                
                {loadingStudents ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <TableContainer component={Paper} sx={{ mb: 2, boxShadow: 'none' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>学号</TableCell>
                            <TableCell>姓名</TableCell>
                            <TableCell align="right">操作</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell>{student.studentId}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell align="right">
                                  <Tooltip title="编辑">
                                    <IconButton 
                                      size="small" 
                                      sx={{ color: '#1976d2', mr: 1 }}
                                      onClick={() => handleOpenEditStudent(student)}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="删除">
                                    <IconButton 
                                      size="small" 
                                      sx={{ color: '#f44336' }}
                                      onClick={() => handleDeleteStudent(student.id)}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} align="center">
                                {searchTerm ? '没有找到匹配的学生' : '暂无学生信息'}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {totalStudents > rowsPerPage && (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Pagination 
                          count={Math.ceil(totalStudents / rowsPerPage)} 
                          page={page} 
                          onChange={handlePageChange} 
                          color="primary" 
                        />
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
            
            {!selectedClassId && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography variant="body1" color="text.secondary">
                  请在左侧选择一个班级以查看学生列表
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 添加班级对话框 */}
      <Dialog open={openAddClass} onClose={() => setOpenAddClass(false)}>
        <DialogTitle>添加班级</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="班级名称"
            fullWidth
            value={classForm.name}
            onChange={handleClassFormChange}
            required
          />
          <TextField
            margin="dense"
            name="grade"
            label="年级"
            fullWidth
            value={classForm.grade}
            onChange={handleClassFormChange}
            required
          />
          <TextField
            margin="dense"
            name="description"
            label="描述"
            fullWidth
            multiline
            rows={3}
            value={classForm.description}
            onChange={handleClassFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddClass(false)}>取消</Button>
          <Button onClick={handleAddClass} variant="contained" color="primary">
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* 导入学生对话框 */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)}>
        <DialogTitle>导入学生信息</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            请直接粘贴学生名单，每行一条记录，格式为：学号 姓名（用空格分隔）
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={8}
            placeholder="例如：\n2023001 张三\n2023002 李四\n2023003 王五"
            value={studentNameList}
            onChange={(e) => setStudentNameList(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)}>取消</Button>
          <Button 
            onClick={handleImportStudentsByText} 
            variant="contained" 
            color="primary"
            disabled={!studentNameList.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : '导入'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 添加学生对话框 */}
      <Dialog open={openAddStudent} onClose={() => setOpenAddStudent(false)}>
        <DialogTitle>添加学生</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="studentId"
            label="学号"
            fullWidth
            value={studentForm.studentId}
            onChange={handleStudentFormChange}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="name"
            label="姓名"
            fullWidth
            value={studentForm.name}
            onChange={handleStudentFormChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddStudent(false)}>取消</Button>
          <Button 
            onClick={handleAddStudent} 
            variant="contained" 
            color="primary"
            disabled={!studentForm.studentId || !studentForm.name || loading}
          >
            {loading ? <CircularProgress size={24} /> : '添加'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 编辑学生对话框 */}
      <Dialog open={openEditStudent} onClose={() => setOpenEditStudent(false)}>
        <DialogTitle>编辑学生信息</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="studentId"
            label="学号"
            fullWidth
            value={studentForm.studentId}
            onChange={handleStudentFormChange}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="name"
            label="姓名"
            fullWidth
            value={studentForm.name}
            onChange={handleStudentFormChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditStudent(false)}>取消</Button>
          <Button 
            onClick={handleEditStudent} 
            variant="contained" 
            color="primary"
            disabled={!studentForm.studentId || !studentForm.name || loading}
          >
            {loading ? <CircularProgress size={24} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 消息提示 */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ClassManagement;