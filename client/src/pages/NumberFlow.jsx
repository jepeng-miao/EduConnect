import { useState, useEffect } from 'react';
import { Container, Typography, Box, Slider, Button, Paper, Grid, IconButton } from '@mui/material';
import { Add, Remove, Shuffle, ArrowBack } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NumberFlow = () => {
  const navigate = useNavigate();
  const [currentNumber, setCurrentNumber] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(0.5);
  const [isAnimating, setIsAnimating] = useState(false);

  // 将数字转换为数组，以便单独处理每一位
  const numberToDigits = (num) => {
    return Math.abs(num).toString().padStart(1, '0').split('').map(Number);
  };

  const currentDigits = numberToDigits(currentNumber);

  // 增加数字
  const incrementNumber = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentNumber(prev => prev + 1);
      setTimeout(() => setIsAnimating(false), 500 * (1 - animationSpeed + 0.1));
    }
  };

  // 减少数字
  const decrementNumber = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentNumber(prev => prev - 1);
      setTimeout(() => setIsAnimating(false), 500 * (1 - animationSpeed + 0.1));
    }
  };

  // 随机数字
  const randomNumber = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      const randomNum = Math.floor(Math.random() * 1000);
      setCurrentNumber(randomNum);
      setTimeout(() => setIsAnimating(false), 500 * (1 - animationSpeed + 0.1));
    }
  };

  // 处理滑块变化
  const handleSpeedChange = (event, newValue) => {
    setAnimationSpeed(newValue);
  };

  // 单个数字动画组件
  const AnimatedDigit = ({ digit, index }) => {
    // 创建0-9的数字数组，用于动画
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
      <Box
        sx={{
          position: 'relative',
          width: '120px',
          height: '180px',
          overflow: 'hidden',
          mx: 1,
          borderRadius: 2,
          bgcolor: 'primary.dark',
          boxShadow: 3,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={digit}
            initial={{ y: -100 * digit }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              duration: 1 - animationSpeed + 0.1
            }}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '1000%',
                transform: `translateY(-${digit * 10}%)`,
                transition: `transform ${1 - animationSpeed + 0.1}s cubic-bezier(0.4, 0.0, 0.2, 1)`,
              }}
            >
              {digits.map((d) => (
                <Box
                  key={d}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '10%',
                    fontSize: '120px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  {d}
                </Box>
              ))}
            </Box>
          </motion.div>
        </AnimatePresence>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ position: 'absolute', top: 20, left: 20 }}>
        <IconButton onClick={() => navigate('/teacher/website-tools')} color="primary" size="large">
          <ArrowBack fontSize="large" />
        </IconButton>
      </Box>

      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          数字流可视化
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          直观展示数字变化的动画效果，适用于教学演示
        </Typography>

        <Paper 
          elevation={4} 
          sx={{ 
            p: 5, 
            borderRadius: 4, 
            bgcolor: '#f5f5f5',
            maxWidth: 900,
            mx: 'auto',
            mb: 4
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            {currentDigits.map((digit, index) => (
              <AnimatedDigit key={index} digit={digit} index={index} />
            ))}
          </Box>

          <Grid container spacing={2} justifyContent="center" sx={{ mt: 4 }}>
            <Grid item xs={12} md={8}>
              <Box sx={{ px: 2 }}>
                <Typography id="speed-slider" gutterBottom>
                  动画速度
                </Typography>
                <Slider
                  value={animationSpeed}
                  onChange={handleSpeedChange}
                  aria-labelledby="speed-slider"
                  step={0.1}
                  marks
                  min={0}
                  max={1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value * 100}%`}
                />
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<Remove />}
              onClick={decrementNumber}
              disabled={isAnimating}
              sx={{ borderRadius: 2, px: 3 }}
            >
              -1
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Add />}
              onClick={incrementNumber}
              disabled={isAnimating}
              sx={{ borderRadius: 2, px: 3 }}
            >
              +1
            </Button>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<Shuffle />}
              onClick={randomNumber}
              disabled={isAnimating}
              sx={{ borderRadius: 2, px: 3 }}
            >
              随机
            </Button>
          </Box>
        </Paper>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            borderRadius: 2, 
            bgcolor: '#f8f9fa',
            maxWidth: 900,
            mx: 'auto'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            使用说明
          </Typography>
          <Typography variant="body1" align="left" paragraph>
            1. 点击 <strong>+1</strong> 或 <strong>-1</strong> 按钮增加或减少当前显示的数字
          </Typography>
          <Typography variant="body1" align="left" paragraph>
            2. 点击 <strong>随机</strong> 按钮生成一个随机数字
          </Typography>
          <Typography variant="body1" align="left" paragraph>
            3. 使用 <strong>动画速度</strong> 滑块调整数字变化的速度
          </Typography>
          <Typography variant="body1" align="left">
            4. 观察数字如何按照0-9的顺序滚动到目标值，适合用于教学演示数字概念
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default NumberFlow;