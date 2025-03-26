import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

// 创建一个共享的Socket.IO实例
export const socket = io(SOCKET_URL, {
  // 允许Socket.io自动选择最佳传输方式
  autoConnect: true,
  // 添加重连配置
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});

// 监听连接状态
socket.on('connect', () => {
  console.log('已连接到服务器');
});

socket.on('connect_error', (error) => {
  console.error('连接错误:', error);
});

// 添加重连事件监听
socket.on('reconnect', (attemptNumber) => {
  console.log(`重连成功，尝试次数: ${attemptNumber}`);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`尝试重连，次数: ${attemptNumber}`);
});

socket.on('reconnect_error', (error) => {
  console.error('重连错误:', error);
});

socket.on('reconnect_failed', () => {
  console.error('重连失败，已达到最大尝试次数');
});

// 添加心跳机制
setInterval(() => {
  if (socket.connected) {
    // 如果已登录，发送心跳包
    const studentId = localStorage.getItem('studentId');
    if (studentId) {
      socket.emit('heartbeat', { studentId });
    }
  }
}, 5000);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);