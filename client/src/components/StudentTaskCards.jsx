import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Divider } from '@mui/material';
import { SportsEsports as GameIcon, School as SchoolIcon, Assignment as AssignmentIcon } from '@mui/icons-material';

// 图标映射表
const iconMap = {
  'SportsEsports': <GameIcon sx={{ fontSize: 40, color: '#1976d2' }} />,
  'School': <SchoolIcon sx={{ fontSize: 40, color: '#388e3c' }} />,
  'Assignment': <AssignmentIcon sx={{ fontSize: 40, color: '#f57c00' }} />
};

function StudentTaskCards({ tasks, activeTasks, onTaskSelect, studentInfo }) {
  // 处理任务选择
  const handleTaskClick = (taskId) => {
    onTaskSelect(taskId);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
        可用任务
      </Typography>
      <Divider sx={{ mb: 4 }} />

      {tasks.length === 0 || activeTasks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            暂无可用任务，请等待教师发布...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tasks
            .filter(task => activeTasks.some(activeTask => activeTask.id === task.id))
            .map((task) => {
              return (
                <Grid item xs={12} sm={6} key={task.id}>
                  <Card 
                    elevation={3} 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                      },
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: `2px solid #4caf50`
                    }}
                  >
                    <Box sx={{ 
                      p: 3, 
                      display: 'flex', 
                      alignItems: 'center',
                      backgroundColor: '#c8e6c9',
                      opacity: 0.8
                    }}>
                      {iconMap[task.icon] || <AssignmentIcon sx={{ fontSize: 40, color: '#757575' }} />}
                      <Typography variant="h5" component="h2" sx={{ ml: 2, fontWeight: 'bold' }}>
                        {task.title}
                      </Typography>
                      <Chip 
                        label="可用" 
                        color="success" 
                        size="small" 
                        sx={{ ml: 'auto', fontWeight: 'bold' }}
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 2 }}>
                        {task.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 3, pt: 0 }}>
                      <Button 
                        variant="contained" 
                        size="large" 
                        fullWidth
                        onClick={() => handleTaskClick(task.id)}
                        sx={{ 
                          borderRadius: 2,
                          py: 1.5,
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          backgroundColor: '#4caf50',
                          '&:hover': {
                            backgroundColor: '#388e3c'
                          }
                        }}
                      >
                        进入任务
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
        </Grid>
      )}
    </Box>
  );
}

export default StudentTaskCards;