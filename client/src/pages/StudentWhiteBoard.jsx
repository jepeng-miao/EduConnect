import { useState, useEffect, useRef } from 'react';
import { Container, Typography, Box, Button, Grid, Paper, Divider, IconButton, Tooltip, Slider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Menu, MenuItem } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Brush as BrushIcon, TextFields as TextFieldsIcon, Create as PencilIcon, Delete as EraserIcon, Circle as CircleIcon, Square as SquareIcon, Save as SaveIcon, Undo as UndoIcon, Redo as RedoIcon, Clear as ClearIcon, ColorLens as ColorLensIcon, Send as SendIcon, Fullscreen as FullscreenIcon, FullscreenExit as FullscreenExitIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { socket } from '../main';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import '../styles/excalidraw-fullscreen.css';

function StudentWhiteBoard() {
  const navigate = useNavigate();
  const excalidrawRef = useRef(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isTaskActive, setIsTaskActive] = useState(false);
  const [studentId, setStudentId] = useState(() => localStorage.getItem('studentId') || '');
  const [excalidrawTheme, setExcalidrawTheme] = useState('light');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 初始化和监听事件
  useEffect(() => {
    // 如果没有登录，重定向到登录页面
    if (!studentId) {
      navigate('/student/login');
      return;
    }
    
    // 检查任务初始状态
    socket.emit('check_task_status', { taskId: 'whiteboard' });
    
    // 监听任务状态变化
    socket.on('task_status_update', (data) => {
      if (data.taskId === 'whiteboard') {
        setIsTaskActive(data.active);
      }
    });
    
    // 监听任务状态检查结果
    socket.on('task_status_result', (data) => {
      if (data.taskId === 'whiteboard') {
        setIsTaskActive(data.active);
      }
    });
    
    return () => {
      socket.off('task_status_update');
      socket.off('task_status_result');
    };
  }, [navigate, studentId]);

  // 保存画布为图片
  const handleSaveCanvas = async () => {
    if (!excalidrawRef.current || !isTaskActive) return;
    
    try {
      // 获取Excalidraw元素和应用状态
      const elements = excalidrawRef.current.getSceneElements();
      const appState = excalidrawRef.current.getAppState();
      
      // 导出为PNG图片
      const blob = await exportToBlob({
        elements,
        appState,
        mimeType: 'image/png',
        quality: 1
      });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `whiteboard-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = url;
      link.click();
      
      // 释放URL对象
      URL.revokeObjectURL(url);
      
      setSnackbarMessage('白板已保存为图片');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('保存白板失败:', err);
      setSnackbarMessage('保存白板失败');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // 切换主题
  const toggleTheme = () => {
    setExcalidrawTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // 切换全屏模式
  const toggleFullscreen = () => {
    // 直接使用Excalidraw容器作为全屏目标
    const excalidrawContainer = document.querySelector('.excalidraw-container');
    
    if (!excalidrawContainer) {
      console.error('找不到Excalidraw容器元素');
      setSnackbarMessage('无法进入全屏模式');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    if (!document.fullscreenElement) {
      // 进入全屏模式
      excalidrawContainer.requestFullscreen().then(() => {
        setIsFullscreen(true);
        // 添加全屏样式
        excalidrawContainer.classList.add('fullscreen-excalidraw');
      }).catch(err => {
        console.error('无法进入全屏模式:', err);
        setSnackbarMessage('无法进入全屏模式');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
    } else {
      // 退出全屏模式
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        // 移除全屏样式
        excalidrawContainer.classList.remove('fullscreen-excalidraw');
      }).catch(err => {
        console.error('无法退出全屏模式:', err);
        setSnackbarMessage('无法退出全屏模式');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
    }
  };

  // 关闭提示框
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          互动白板
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          使用互动白板进行创意表达和互动学习
        </Typography>
        
        {!isTaskActive && (
          <Alert severity="info" sx={{ width: '100%', maxWidth: 600, mt: 2 }}>
            老师尚未开启互动白板任务，请等待老师开启后再使用。
          </Alert>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {/* 工具栏 */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Tooltip title="保存为图片">
              <span>
                <IconButton onClick={handleSaveCanvas} disabled={!isTaskActive}>
                  <SaveIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="切换主题">
              <IconButton onClick={toggleTheme}>
                <ColorLensIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? "退出全屏" : "全屏显示"}>
              <IconButton onClick={toggleFullscreen}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/student/dashboard')}
              sx={{ borderRadius: 2, fontWeight: 'bold' }}
            >
              返回
            </Button>
          </Paper>
        </Grid>
        
        {/* Excalidraw画板区域 */}
        <Grid item xs={12}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 0, 
              height: 'calc(100vh - 300px)', 
              minHeight: '500px',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              borderRadius: 2,
              opacity: isTaskActive ? 1 : 0.7,
              pointerEvents: isTaskActive ? 'auto' : 'none'
            }}
          >
            <div style={{ width: '100%', height: '100%' }} className="excalidraw-container">
              <Excalidraw
                ref={excalidrawRef}
                theme={excalidrawTheme}
                gridModeEnabled={true}
                zenModeEnabled={false}
                viewModeEnabled={!isTaskActive}
                name="EduConnect学生互动白板"
              />
            </div>
          </Paper>
        </Grid>
      </Grid>
      
      {/* 提示框 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default StudentWhiteBoard;