import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function StudentRoute() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // 检查localStorage中是否有studentId
    const studentId = localStorage.getItem('studentId');
    
    // 根据登录状态重定向到相应页面
    if (studentId) {
      navigate('/student/dashboard');
    } else {
      navigate('/student/login');
    }
  }, [navigate]);
  
  // 返回null，因为这个组件只负责重定向，不渲染任何内容
  return null;
}

export default StudentRoute;