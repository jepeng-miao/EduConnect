import { useState, useRef, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Button, Box, Divider, Alert, CircularProgress } from '@mui/material';
import { QrCode as QrCodeIcon, Upload as UploadIcon, Check as CheckIcon, Clear as ClearIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import jsQR from 'jsqr';
import { socket } from '../main';
import { useNavigate } from 'react-router-dom';

function StudentQRCodeScanner() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // 监听任务状态变化
  useEffect(() => {
    // 检查任务初始状态
    socket.emit('check_task_status', { taskId: 'qrcode-scanner' });
    
    // 监听任务状态变化
    socket.on('task_status_update', (data) => {
      if (data.taskId === 'qrcode-scanner') {
        // 如果教师发布了任务，可以在这里添加提示或其他UI反馈
        console.log('二维码识别任务状态更新:', data.active ? '已发布' : '已停止');
      }
    });
    
    // 监听任务状态检查结果
    socket.on('task_status_result', (data) => {
      if (data.taskId === 'qrcode-scanner') {
        console.log('二维码识别任务当前状态:', data.active ? '已发布' : '未发布');
      }
    });
    
    return () => {
      socket.off('task_status_update');
      socket.off('task_status_result');
    };
  }, []);

  // 处理返回仪表盘
  const handleBackToDashboard = () => {
    navigate('/student/dashboard');
  };

  // 处理图片上传
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 重置状态
    setScanResult(null);
    setError('');

    // 检查文件类型
    if (!file.type.match('image.*')) {
      setError('请上传图片文件');
      return;
    }

    setSelectedImage(file);

    // 创建图片预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // 处理二维码扫描
  const handleScan = () => {
    if (!selectedImage) {
      setError('请先上传图片');
      return;
    }

    setIsScanning(true);
    setError('');

    const img = new Image();
    img.onload = () => {
      // 创建canvas来处理图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // 获取图像数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // 使用jsQR库识别二维码
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        setScanResult({
          content: code.data,
          isQRCode: true
        });
      } else {
        setScanResult({
          content: '',
          isQRCode: false
        });
      }
      
      setIsScanning(false);
    };

    img.onerror = () => {
      setError('图片加载失败');
      setIsScanning(false);
    };

    img.src = imagePreview;
  };

  // 清除当前图片和结果
  const handleClear = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setScanResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Box sx={{ textAlign: 'center', py: 3, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', position: 'relative' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToDashboard}
          sx={{ 
            position: 'absolute', 
            left: 16, 
            top: 16,
            borderRadius: 2,
            fontWeight: 'bold'
          }}
        >
          返回仪表盘
        </Button>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold', 
          color: '#1976d2',
          fontSize: { xs: '2rem', md: '2.5rem' },
          mb: 2
        }}>
          二维码识别工具
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ 
          maxWidth: '800px', 
          mx: 'auto',
          fontSize: { xs: '1.1rem', md: '1.3rem' }
        }}>
          上传图片识别二维码内容，快速获取二维码信息
        </Typography>
      </Box>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* 左侧 - 图片上传和预览 */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 3,
                border: '2px solid #bbdefb'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                图片上传与预览
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
              }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                />
                
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current.click()}
                  sx={{ 
                    mb: 2,
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    fontWeight: 'bold'
                  }}
                >
                  上传图片
                </Button>
                
                {error && (
                  <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                    {error}
                  </Alert>
                )}
              </Box>
              
              <Box sx={{ 
                width: '100%', 
                height: 300, 
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px dashed #bdbdbd'
              }}>
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="预览图" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain' 
                    }} 
                  />
                ) : (
                  <Typography color="text.secondary">
                    请上传图片
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!selectedImage || isScanning}
                  onClick={handleScan}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 'bold'
                  }}
                >
                  {isScanning ? <CircularProgress size={24} color="inherit" /> : "识别二维码"}
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  disabled={!selectedImage || isScanning}
                  onClick={handleClear}
                  startIcon={<ClearIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 'bold'
                  }}
                >
                  清除
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* 右侧 - 识别结果 */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 3,
                border: scanResult ? 
                  (scanResult.isQRCode ? '2px solid #4caf50' : '2px solid #f44336') : 
                  '2px solid #e0e0e0'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                识别结果
              </Typography>
              
              {isScanning ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                  <CircularProgress size={60} sx={{ mb: 3 }} />
                  <Typography variant="h6" color="text.secondary">
                    正在识别中...
                  </Typography>
                </Box>
              ) : scanResult ? (
                <Box sx={{ mt: 2 }}>
                  <Alert 
                    severity={scanResult.isQRCode ? "success" : "error"}
                    icon={scanResult.isQRCode ? <CheckIcon /> : <ClearIcon />}
                    sx={{ mb: 3, py: 2 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {scanResult.isQRCode ? "成功识别二维码" : "未能识别到二维码"}
                    </Typography>
                  </Alert>
                  
                  {scanResult.isQRCode && (
                    <>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
                        二维码内容:
                      </Typography>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: 2,
                          maxHeight: 200,
                          overflow: 'auto',
                          wordBreak: 'break-all'
                        }}
                      >
                        <Typography variant="body1">
                          {scanResult.content}
                        </Typography>
                      </Paper>
                    </>
                  )}
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  py: 8
                }}>
                  <QrCodeIcon sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    请上传图片并点击识别按钮
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default StudentQRCodeScanner;