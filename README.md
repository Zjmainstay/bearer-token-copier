# Bearer Token Copier

> 一键复制网页请求中的Authorization Bearer Token，开发者必备工具

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🚀 功能特点

- ✅ 自动监听网页HTTP请求
- ✅ 智能捕获Authorization请求头
- ✅ 一键刷新页面并复制Bearer Token
- ✅ 友好的操作反馈通知
- ✅ 100%本地操作，不上传数据

## 📦 安装

### 从Chrome Web Store安装（推荐）

*即将上线...*

### 手动安装

1. 下载本仓库：`git clone https://github.com/Zjmainstay/bearer-token-copier.git`
2. 打开Chrome浏览器，访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择仓库目录

## 🎯 使用方法

1. 访问需要登录的网站（如GitHub）
2. 登录账号，触发API请求
3. 点击插件图标（工具栏右上角）
4. 自动刷新并复制Token
5. 直接粘贴使用（Ctrl+V / Cmd+V）

### 在线测试

安装插件后，可以使用在线Demo页面测试功能：

👉 **Demo页面**: https://zjmainstay.github.io/bearer-token-copier/demo.html

Demo页面会自动发起带 Bearer Token 的 API 请求，方便测试插件的复制功能。

### 状态说明

- **灰色图标** 🔒：未检测到Token
- **绿色图标** 🔑：已捕获Token，可以复制
- **蓝色图标** ⌛：正在处理中
- **Badge: ✓**：已捕获Token或复制成功
- **Badge: ...**：处理中
- **Badge: ✗**：复制失败

## 🎯 适用场景

- **前端开发**：快速获取API Token用于接口测试
- **测试调试**：获取不同环境的认证Token
- **团队协作**：分享Token给后端同学排查问题

## 🔒 隐私安全

- ✅ 不上传数据：所有操作在本地完成
- ✅ 不持久化：Token仅存储在内存中
- ✅ 不记录历史：浏览器关闭后自动清除
- ✅ 开源透明：代码完全公开

## 🛠️ 技术栈

- Chrome Extension Manifest V3
- JavaScript ES6+
- Chrome APIs (webRequest, clipboard, notifications)

## 📝 许可证

[MIT License](LICENSE)

## 👨‍💻 作者

**Zjmainstay**

- GitHub: [@Zjmainstay](https://github.com/Zjmainstay)

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📧 反馈

如有问题或建议，请[提交Issue](https://github.com/Zjmainstay/bearer-token-copier/issues)。
