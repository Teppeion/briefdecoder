# BriefDecoder

营销Brief 12维度智能解码工具，基于通义千问 API。

## 部署步骤

### 1. 上传到 GitHub
把这个文件夹推到你的 GitHub 仓库。

### 2. 连接 Vercel
1. 去 vercel.com，用 GitHub 账号登录
2. 点 "Add New Project"
3. 选择这个仓库
4. 点 Deploy

### 3. 设置环境变量（关键）
部署完成后：
1. 进入项目 Settings → Environment Variables
2. 添加一个变量：
   - Name: `QWEN_API_KEY`
   - Value: 你的通义千问 API Key
3. 保存后点 Redeploy

完成后你会得到一个 `xxx.vercel.app` 的域名，可以直接分享给团队使用。
