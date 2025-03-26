# EduConnect 智联师生

## 项目介绍

EduConnect（智联师生）是一个面向教育领域的互动教学平台，旨在提升课堂互动效率和教学体验。该平台支持教师与学生之间的实时互动，提供多种教学工具和活动，帮助教师更好地组织课堂教学，提高学生参与度。

## 功能特点

### 教师端功能

- **班级管理**：创建、编辑和管理班级信息
- **学生管理**：导入、添加和管理学生信息
- **实时互动**：与学生进行实时互动和交流
- **打字比赛**：组织班级打字比赛，实时查看学生进度和成绩
- **随机抽取学生**：随机抽取学生回答问题或参与活动
- **班级分组工具**：自动或手动将学生分配到不同小组
- **教学工具集**：包含多种教学辅助工具

### 学生端功能

- **实时参与**：参与教师发起的各种互动活动
- **打字比赛**：参加实时打字比赛，提高打字速度和准确率
- **二维码扫描**：扫描教师分享的二维码获取学习资源
- **情绪卡片**：表达当前情绪状态，帮助教师了解学生心理健康
- **图片滤镜**：上传图片并应用各种滤镜效果

### 其他特色功能

- **实时数据同步**：使用WebSocket技术实现师生间实时数据交互
- **多平台支持**：支持Web浏览器和桌面应用（通过Electron实现）
- **响应式设计**：适配不同设备屏幕尺寸

## 技术架构

### 前端技术栈

- **React**：用于构建用户界面的JavaScript库
- **Material-UI**：React UI组件库，提供美观的界面设计
- **Socket.io-client**：实现客户端WebSocket通信
- **React Router**：处理应用内路由导航
- **Vite**：现代前端构建工具，提供快速的开发体验

### 后端技术栈

- **Node.js**：JavaScript运行时环境
- **Express**：Web应用框架
- **Socket.io**：实现服务器端WebSocket通信
- **Sequelize**：ORM工具，用于数据库操作
- **SQLite**：轻量级关系型数据库
- **JWT**：用于用户身份验证

### 桌面应用

- **Electron**：跨平台桌面应用开发框架

## 安装指南

### 前提条件

- Node.js (v14.0.0或更高版本)
- npm (v6.0.0或更高版本)

### 安装步骤

1. 克隆项目代码

```bash
git clone <项目仓库URL>
cd EduConnect
```

2. 安装依赖

```bash
npm run install-all
```

3. 配置环境变量

在项目根目录创建`.env`文件，添加以下内容：

```
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

4. 初始化数据库

```bash
node server/scripts/initDatabase.js
node server/scripts/initDefaultTeacher.js
```

## 运行项目

### 开发模式

同时运行前端和后端服务：

```bash
npm run dev
```

单独运行后端服务：

```bash
npm run server
```

单独运行前端服务：

```bash
npm run client
```

### 生产模式

1. 构建前端代码

```bash
cd client
npm run build
```

2. 运行服务器

```bash
npm start
```

### 桌面应用

运行Electron桌面应用：

```bash
cd electron
npm start
```

构建桌面应用安装包：

```bash
cd electron
npm run build
```

## 默认账号

系统初始化后会创建一个默认的教师账号：

- 用户名：admin
- 密码：password

首次登录后请及时修改密码。

## 使用说明

### 教师使用流程

1. 使用默认账号登录系统
2. 创建班级和导入学生信息
3. 选择要进行互动的班级
4. 选择互动工具或活动（打字比赛、随机抽取学生等）
5. 开始互动活动，实时查看学生参与情况

### 学生使用流程

1. 使用学号登录系统
2. 等待教师发起互动活动
3. 参与教师发起的活动，如打字比赛、情绪卡片选择等
4. 查看活动结果和反馈

## 项目结构

```
EduConnect/
├── client/                 # 前端代码
│   ├── dist/               # 构建输出目录
│   ├── src/                # 源代码
│   │   ├── components/     # 组件
│   │   ├── pages/          # 页面
│   │   ├── styles/         # 样式文件
│   │   ├── App.jsx         # 应用入口组件
│   │   ├── config.js       # 配置文件
│   │   └── main.jsx        # 主入口文件
│   ├── index.html          # HTML模板
│   ├── package.json        # 依赖配置
│   └── vite.config.js      # Vite配置
├── server/                 # 后端代码
│   ├── config/             # 配置文件
│   ├── models/             # 数据模型
│   ├── routes/             # 路由控制器
│   ├── scripts/            # 脚本工具
│   └── index.js            # 服务器入口文件
├── electron/               # 桌面应用代码
│   ├── main.js             # Electron主进程
│   └── package.json        # 依赖配置
├── .env                    # 环境变量
└── package.json            # 项目依赖配置
```

## 许可证

[MIT License](LICENSE)

## 联系方式

如有任何问题或建议，请联系项目维护者。