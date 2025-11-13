## deSEC 自动登录保活脚本
这是一个用于自动登录 deSEC 网站以保持账户活跃的脚本，配合 GitHub Actions 实现自动定时执行。

注册地址：https://desec.io

### 功能特点
- 🔐 自动登录 deSEC 账户(单账户或多账户)
- 👥 支持多账户批量处理
- 🤖 使用 Playwright 自动化浏览器操作
- ⏰ 每30天自动执行一次
- 📱 执行结果可通过 Telegram 通知
- 🛡️ 智能按钮点击，支持多种点击方式
- 📍 详细的登录过程日志输出

### 使用方法
1. Fork 此项目
2. 在 Actions 菜单点击 `I understand my workflows, go ahead and enable them` 按钮启用工作流

3. 在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加以下环境变量：

   **必填环境变量：**
   - `ACCOUNTS` - deSEC账户信息，格式：
     - 单账号：`user:pass`
     - 多账号：`user1:pass1,user2:pass2`（账号之间用英文逗号分隔）
     - 也支持分号分隔：`user1:pass1;user2:pass2`

   **可选环境变量（Telegram 通知）：**
   - `BOT_TOKEN` - Telegram机器人Token（通过 https://t.me/BotFather 获取）
   - `CHAT_ID` - Telegram聊天ID

4. 手动执行一次 GitHub Actions 检查配置是否正确
5. 脚本会自动每30天执行一次，也可以手动触发执行

### 技术实现
- **浏览器自动化**：使用 Playwright + Chromium 进行真实浏览器操作
- **智能等待**：自动等待登录按钮变为可用状态
- **多重点击策略**：支持 JavaScript 点击、Playwright 点击、hover+click 等多种方式
- **错误处理**：完善的异常捕获和错误日志
- **批量处理**：支持多个账号依次登录，账号间有适当间隔

### 执行流程
1. 解析环境变量中的账户信息
2. 为每个账户启动独立的浏览器实例
3. 访问 deSEC 登录页面
4. 填写邮箱和密码
5. 智能等待并点击登录按钮
6. 验证登录结果
7. 汇总所有账户的登录结果
8. 发送 Telegram 通知（如果配置了相关环境变量）

### 注意事项
1. 确保 deSEC 账户密码正确
2. 首次运行 GitHub Actions 需要授权
3. 脚本执行时间为 UTC 0:00（香港时间 8:00）
4. 如果不需要 Telegram 通知，可不配置相关环境变量
5. 每个账户登录过程大约需要 30-60 秒
6. 多账户时会依次处理，账户间有 3 秒间隔

### 环境变量示例
```
ACCOUNTS=user@example.com:password123
BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
CHAT_ID=987654321
```

### 故障排除
- **登录失败**：检查账户密码是否正确，或网站是否有更新
- **按钮点击失败**：脚本会自动尝试多种点击方式
- **Telegram 通知失败**：检查 BOT_TOKEN 和 CHAT_ID 是否正确配置

### 许可证
GPL 3.0
