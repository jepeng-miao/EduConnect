// 应用配置文件

// 开发环境配置
const isDev = process.env.NODE_ENV === 'development';

// 获取当前主机名和协议
const protocol = window.location.protocol;
const hostname = window.location.hostname;

// 服务器端口
const SERVER_PORT = 5002;

// API基础URL - 使用相对路径或完整URL
export const API_BASE_URL = isDev 
  ? `${protocol}//${hostname}:${SERVER_PORT}` 
  : `${protocol}//${hostname}:${SERVER_PORT}`;

// Socket.IO连接URL
// 使用相对路径，让Socket.io自动选择适当的协议和主机名
export const SOCKET_URL = isDev 
  ? `${protocol}//${hostname}:${SERVER_PORT}` 
  : window.location.origin;