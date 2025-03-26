import { useState, useRef, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Button, Box, Slider, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Divider } from '@mui/material';
import { Photo as PhotoIcon, Upload as UploadIcon, Save as SaveIcon, Clear as ClearIcon, ArrowBack as ArrowBackIcon, FilterAlt as FilterIcon } from '@mui/icons-material';
import { socket } from '../main';
import { useNavigate } from 'react-router-dom';

function StudentImageFilter() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [filteredImage, setFilteredImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  // 滤镜参数
  const [brightness, setBrightness] = useState(100); // 亮度 (0-200)
  const [contrast, setContrast] = useState(100);     // 对比度 (0-200)
  const [saturation, setSaturation] = useState(100); // 饱和度 (0-200)
  const [selectedFilter, setSelectedFilter] = useState('none'); // 预设滤镜

  // 预设滤镜效果
  const presetFilters = {
    none: { name: '无滤镜', brightness: 100, contrast: 100, saturation: 100 },
    warm: { name: '暖色调', brightness: 110, contrast: 110, saturation: 120 },
    cool: { name: '冷色调', brightness: 100, contrast: 110, saturation: 90 },
    vintage: { name: '复古', brightness: 90, contrast: 120, saturation: 80 },
    blackAndWhite: { name: '黑白', brightness: 100, contrast: 120, saturation: 0 },
    sepia: { name: '褐色', brightness: 95, contrast: 110, saturation: 50 },
    vivid: { name: '鲜艳', brightness: 110, contrast: 130, saturation: 150 },
    soft: { name: '柔和', brightness: 105, contrast: 90, saturation: 90 }
  };

  // 监听任务状态变化
  useEffect(() => {
    // 检查任务初始状态
    socket.emit('check_task_status', { taskId: 'image-filter' });
    
    // 监听任务状态变化
    socket.on('task_status_update', (data) => {
      if (data.taskId === 'image-filter') {
        console.log('图片滤镜任务状态更新:', data.active ? '已发布' : '已停止');
        // 如果任务被停止，返回学生仪表盘
        if (!data.active) {
          navigate('/student/dashboard');
        }
      }
    });
    
    // 监听任务状态检查结果
    socket.on('task_status_result', (data) => {
      if (data.taskId === 'image-filter') {
        console.log('图片滤镜任务当前状态:', data.active ? '已发布' : '未发布');
        // 如果任务未发布，返回学生仪表盘
        if (!data.active) {
          navigate('/student/dashboard');
        }
      }
    });
    
    return () => {
      socket.off('task_status_update');
      socket.off('task_status_result');
    };
  }, [navigate]);

  // 处理返回仪表盘
  const handleBackToDashboard = () => {
    navigate('/student/dashboard');
  };

  // 处理图片上传
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 重置状态
    setFilteredImage(null);
    setError('');
    resetFilters();

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

  // 重置滤镜参数
  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSelectedFilter('none');
  };

  // 应用预设滤镜
  const applyPresetFilter = (filterName) => {
    setSelectedFilter(filterName);
    const filter = presetFilters[filterName];
    setBrightness(filter.brightness);
    setContrast(filter.contrast);
    setSaturation(filter.saturation);
  };

  // 应用滤镜效果
  const applyFilter = () => {
    if (!selectedImage) {
      setError('请先上传图片');
      return;
    }

    setIsProcessing(true);
    setError('');

    const img = new Image();
    img.onload = () => {
      // 创建canvas来处理图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制原始图片
      ctx.drawImage(img, 0, 0);
      
      // 应用滤镜效果
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // 应用亮度、对比度和饱和度
      const brightnessValue = brightness / 100;
      const contrastValue = contrast / 100;
      const saturationValue = saturation / 100;
      
      for (let i = 0; i < data.length; i += 4) {
        // 亮度调整
        data[i] = data[i] * brightnessValue;
        data[i + 1] = data[i + 1] * brightnessValue;
        data[i + 2] = data[i + 2] * brightnessValue;
        
        // 对比度调整
        data[i] = ((data[i] - 128) * contrastValue) + 128;
        data[i + 1] = ((data[i + 1] - 128) * contrastValue) + 128;
        data[i + 2] = ((data[i + 2] - 128) * contrastValue) + 128;
        
        // 饱和度调整
        const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
        data[i] = gray * (1 - saturationValue) + data[i] * saturationValue;
        data[i + 1] = gray * (1 - saturationValue) + data[i + 1] * saturationValue;
        data[i + 2] = gray * (1 - saturationValue) + data[i + 2] * saturationValue;
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // 设置处理后的图片
      setFilteredImage(canvas.toDataURL('image/jpeg'));
      setIsProcessing(false);
    };

    img.onerror = () => {
      setError('图片加载失败');
      setIsProcessing(false);
    };

    img.src = imagePreview;
  };

  // 保存处理后的图片
  const handleSaveImage = () => {
    if (!filteredImage) return;
    
    // 创建一个临时链接并触发下载
    const link = document.createElement('a');
    link.href = filteredImage;
    link.download = 'filtered_image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 清除当前图片和结果
  const handleClear = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFilteredImage(null);
    setError('');
    resetFilters();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* 顶部导航栏 */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToDashboard}
            sx={{ mr: 2 }}
          >
            返回仪表盘
          </Button>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
            图片滤镜工具
          </Typography>
        </Box>
        
        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* 左侧 - 图片上传和预览 */}
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 3,
                border: '2px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                图片上传与预览/处理结果
              </Typography>
              
              {/* 图片上传按钮 */}
              <Box 
                sx={{ 
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mb: 2
                }}
              >
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
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 'bold'
                  }}
                >
                  上传图片
                </Button>
              </Box>
              
              {/* 图片预览和处理结果 */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* 图片预览和处理结果区域 */}
                <Box sx={{ 
                  width: '100%',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  mb: 2,
                  flex: 1
                }}>
                  {/* 原图预览 - 左侧 */}
                  <Box sx={{ 
                    flex: 1,
                    height: 300, 
                    backgroundColor: '#f5f5f5',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid #bbdefb',
                  }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#1976d2' }}>
                      原始图片
                    </Typography>
                    <Box sx={{ 
                      flex: 1,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="原始图片" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%', 
                            objectFit: 'contain' 
                          }} 
                        />
                      ) : (
                        <Typography color="text.secondary">
                          请上传图片以查看原图
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  {/* 处理后图片 - 右侧 */}
                  <Box sx={{ 
                    flex: 1,
                    height: 300, 
                    backgroundColor: '#f5f5f5',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid #bbdefb',
                  }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: '#1976d2' }}>
                      处理后图片
                    </Typography>
                    <Box sx={{ 
                      flex: 1,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {filteredImage ? (
                        <img 
                          src={filteredImage} 
                          alt="处理后图片" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%', 
                            objectFit: 'contain' 
                          }} 
                        />
                      ) : isProcessing ? (
                        <CircularProgress />
                      ) : (
                        <Typography color="text.secondary">
                          应用滤镜后将在此显示
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          {/* 右侧 - 滤镜效果控制 */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                borderRadius: 3,
                border: '2px solid #e0e0e0'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                滤镜控制面板
              </Typography>
              
              {/* 预设滤镜选择 */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="filter-select-label">选择预设滤镜</InputLabel>
                <Select
                  labelId="filter-select-label"
                  id="filter-select"
                  value={selectedFilter}
                  label="选择预设滤镜"
                  onChange={(e) => applyPresetFilter(e.target.value)}
                  disabled={!selectedImage || isProcessing}
                >
                  {Object.entries(presetFilters).map(([key, filter]) => (
                    <MenuItem key={key} value={key}>{filter.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* 亮度调整 */}
              <Box sx={{ mb: 3 }}>
                <Typography id="brightness-slider" gutterBottom>
                  亮度: {brightness}%
                </Typography>
                <Slider
                  aria-labelledby="brightness-slider"
                  value={brightness}
                  onChange={(e, newValue) => setBrightness(newValue)}
                  min={0}
                  max={200}
                  step={5}
                  disabled={isProcessing || !selectedImage}
                />
              </Box>
              
              {/* 对比度调整 */}
              <Box sx={{ mb: 3 }}>
                <Typography id="contrast-slider" gutterBottom>
                  对比度: {contrast}%
                </Typography>
                <Slider
                  aria-labelledby="contrast-slider"
                  value={contrast}
                  onChange={(e, newValue) => setContrast(newValue)}
                  min={0}
                  max={200}
                  step={5}
                  disabled={isProcessing || !selectedImage}
                />
              </Box>
              
              {/* 饱和度调整 */}
              <Box sx={{ mb: 3 }}>
                <Typography id="saturation-slider" gutterBottom>
                  饱和度: {saturation}%
                </Typography>
                <Slider
                  aria-labelledby="saturation-slider"
                  value={saturation}
                  onChange={(e, newValue) => setSaturation(newValue)}
                  min={0}
                  max={200}
                  step={5}
                  disabled={isProcessing || !selectedImage}
                />
              </Box>
              
              {isProcessing && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    正在处理中...
                  </Typography>
                </Box>
              )}
              
              {/* 滤镜控制面板底部的应用滤镜按钮 */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!selectedImage || isProcessing}
                  onClick={applyFilter}
                  startIcon={<FilterIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    fontWeight: 'bold',
                    flex: 1
                  }}
                >
                  {isProcessing ? <CircularProgress size={24} color="inherit" /> : "应用滤镜"}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* 底部按钮区域 */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {filteredImage && (
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={handleSaveImage}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 'bold'
              }}
            >
              保存图片
            </Button>
          )}
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            onClick={handleClear}
            disabled={!selectedImage || isProcessing}
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
      </Container>
    </>
  );
}

export default StudentImageFilter;