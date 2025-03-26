const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 加载应用
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startServer() {
  const serverPath = path.join(__dirname, '..', 'server', 'index.js');
  serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit'
  });

  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
  });
  
  // 添加退出事件处理
  serverProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`服务器进程异常退出，退出码: ${code}，信号: ${signal || 'none'}`);
      // 如果是在应用启动阶段服务器就退出了，可能是端口占用问题
      if (!mainWindow) {
        // 显示错误对话框
        const { dialog } = require('electron');
        dialog.showErrorBox(
          '服务器启动失败',
          '服务器可能因端口5002被占用而无法启动。请关闭占用该端口的其他应用后重试。'
        );
      }
    }
  });
}

app.on('ready', () => {
  startServer();
  // 等待服务器启动
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});