import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

function TeacherLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/teacher');
      } else {
        setError(data.message || '登录失败');
      }
    } catch (err) {
      setError('服务器连接失败');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, border: '2px solid #bbdefb', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: '2rem', mb: 3 }}>
          教师登录
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '1.1rem' }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="工号"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '1.2rem'
              },
              '& .MuiInputLabel-root': {
                fontSize: '1.1rem'
              }
            }}
          />
          <TextField
            fullWidth
            label="密码"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
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
            sx={{ 
              mt: 2,
              py: 1.5,
              borderRadius: 3,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#388e3c'
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

export default TeacherLogin;