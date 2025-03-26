import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { socket } from '../main';
import { API_BASE_URL } from '../config';

function StudentLogin() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [classInfo, setClassInfo] = useState(null);

  useEffect(() => {
    // 监听班级选择事件
    socket.on('class_selected', (data) => {
      setClassInfo({
        id: data.classId,
        name: data.className
      });
      setError('');
    });

    // 页面加载时主动请求获取当前选定的班级信息
    socket.emit('get_selected_class');

    return () => {
      socket.off('class_selected');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) {
      setError('请输入学号');
      return;
    }

    if (!classInfo) {
      setError('请等待教师选择班级');
      return;
    }

    // 先验证学生信息是否存在
    try {
      const response = await fetch(`${API_BASE_URL}/api/manage/student/${studentId}`);
      
      if (response.ok) {
        const data = await response.json();
        // 保存学生信息到本地存储
        localStorage.setItem('studentId', studentId);
        localStorage.setItem('studentInfo', JSON.stringify(data.student));
        
        // 通过socket发送学生登录请求
        socket.emit('join_competition', { studentId });
        
        // 监听登录结果
        socket.once('join_error', (data) => {
          setError(data.message);
        });

        socket.once('competition_joined', (data) => {
          // 登录成功，更新学生信息（如果有）
          if (data.studentInfo) {
            localStorage.setItem('studentInfo', JSON.stringify(data.studentInfo));
          }
          // 跳转到学生仪表板
          navigate('/student/dashboard');
        });

        socket.once('waiting_for_competition', (data) => {
          // 登录成功但需要等待，更新学生信息（如果有）
          if (data.studentInfo) {
            localStorage.setItem('studentInfo', JSON.stringify(data.studentInfo));
          }
          // 跳转到学生仪表板
          navigate('/student/dashboard');
        });

        socket.once('available_tasks', (data) => {
          if (data.studentInfo) {
            localStorage.setItem('studentInfo', JSON.stringify(data.studentInfo));
          }
          // 跳转到学生仪表板
          navigate('/student/dashboard');
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || '学号不存在');
      }
    } catch (err) {
      console.error('验证学生信息失败:', err);
      setError('服务器连接失败，请稍后再试');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, border: '2px solid #bbdefb', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: '2rem', mb: 3 }}>
          学生登录
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '1.1rem' }}>
            {error}
          </Alert>
        )}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          {classInfo ? (
            <Chip
              label={`当前班级：${classInfo.name}`}
              color="primary"
              sx={{ fontSize: '1.1rem', py: 2 }}
            />
          ) : (
            <Chip
              label="等待教师选择班级..."
              color="default"
              sx={{ fontSize: '1.1rem', py: 2 }}
            />
          )}
        </Box>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="学号"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            margin="normal"
            required
            sx={{ 
              mb: 4,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '1.2rem'
              },
              '& .MuiInputLabel-root': {
                fontSize: '1.1rem'
              }
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={!classInfo || !studentId.trim()}
            sx={{ 
              mt: 2,
              py: 1.5,
              borderRadius: 3,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#388e3c'
              },
              '&.Mui-disabled': {
                backgroundColor: '#ccc'
              }
            }}
          >
            登录
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default StudentLogin;