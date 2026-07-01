# 📨 zMailR

<p align="center">
  <strong>自托管临时邮箱 · OTP 自动化 · MCP · 小圈子 Admin</strong>
</p>

<p align="center">
  <a href="https://zmailr.onlydev.ccwu.cc/">在线体验</a> ·
  <a href="https://zmailr.onlydev.ccwu.cc/docs/">文档</a> ·
  <a href="./README.en.md">English</a>
  <br>
  <a href="https://github.com/jia0327/zmailr/stargazers"><img src="https://img.shields.io/github/stars/jia0327/zmailr?style=social"></a>
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg">
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white">
</p>

---

## 是什么

**zMailR** 是基于 Cloudflare Workers + D1 + Email Routing 的**开源自托管临时邮箱**，专为**收验证码**设计。

受 [mailsink](https://mailsink.dev) 的 MCP 自动化启发，在 [zmail](https://github.com/zaunist/zmail) 基础上增强——保留自托管与自定义域名，补齐 **REST API、OTP 提取、MCP、Admin 小圈子管理**。

> **Receive-Only Mode**：只收验证码？**跳过 Brevo** 即可部署，收信 / OTP / MCP 均不受影响。

---

## 解决什么痛点

| 痛点 | zMailR 怎么做 |
| :--- | :--- |
| **公共临时域被拦** | 用**自有域名**收信，GitHub、银行、AI 平台通过率更高 |
| **CI/Agent 无法自动收码** | Bearer API + **11 个 MCP 工具**，脚本 / Cursor / Claude 直接调用 |
| **有信无码** | 内置规则 + **按发件人域名自定义正则**，小众平台也能精准提取 |
| **SaaS 数据不可控** | 自托管到 Cloudflare，密钥与邮件数据完全自控 |
| **想分享给朋友用** | Admin 后台：多用户、配额、审计，不是公开临时邮箱站 |
| **发信配置门槛高** | 纯收验证码**无需 Brevo**，Email Routing 即可跑通 |

**典型场景**：E2E 自动化 · AI Agent 注册收码 · 个人及朋友小圈子私用

---

## 核心特性

**🤖 自动化接入**
- REST API + [`@zmailr/mcp`](https://www.npmjs.com/package/@zmailr/mcp)，Bearer Token 分 `lease` / `mail` / `send` scope
- 长轮询 `wait_for_mail`、即时查码 `get_latest_code`，对接 CI 与 Agent

**📩 OTP 提取**
- 收信自动提取验证码，Web 控制台高亮展示
- 按发件人域名配置正则，优先级：用户规则 → Admin 全局 → 内置兜底

**🌐 收信基础设施**
- Cloudflare Email Routing 入站，Catch-all 转发至 Worker
- 24h 邮箱生命周期，D1 存邮件，R2 存附件

**🛡️ 小圈子治理**
- Admin 后台（`ADMIN_PATH` 隐藏入口）：用户管理、Free/Pro/Team 速率方案
- 维护模式、审计日志、系统公告

**📤 发信（可选）**
- Brevo 出站，完整邮件往返测试；纯收信场景可完全不配

---

## 对比差异

| | **zMailR** | **[zmail](https://github.com/zaunist/zmail)** | **[mailsink](https://mailsink.dev)** | **传统临时邮箱** |
| :--- | :---: | :---: | :---: | :---: |
| 定位 | 自托管 + 自动化 + 小圈子 | 极简自托管收信 | SaaS Agent 收码 | 公共一次性浏览 |
| 部署 | 自托管 (CF) | 自托管 (CF) | 零部署 SaaS | 公共 SaaS |
| 自定义域名 | ✅ | ✅ | ❌ 共享域 | ❌ 黑名单域 |
| REST API | ✅ Bearer + scope | ❌ | ✅ | ❌ |
| MCP | ✅ 11 工具 | ❌ | ✅ | ❌ |
| OTP 提取 | ✅ **按域名自定义规则** | ❌ | ✅ 预设发件商 | ❌ 手动复制 |
| 多用户 / 配额 | ✅ Admin + 审计 | ❌ | ❌ 单人 | ❌ |
| 发信 | 🟡 可选 Brevo | ❌ | ❌ | ❌ |
| 数据自控 | ✅ | ✅ | ❌ | ❌ |

**怎么选？**

- **zMailR** — 要自定义域名 + CI/Agent 自动化 + 分享给朋友，且数据在自己手里
- **zmail** — 只要最简自托管收信，不需要 API / MCP / Admin
- **mailsink** — 单人 Agent、零运维、不关心域名
- **传统临时邮箱** — 手动看一眼验证码，无自动化

---

## 快速上手

部署、MCP 配置、环境变量详见文档：

👉 **[部署指南](./docs/deploy.md)** · **[MCP 接入](./docs/mcp.md)** · **[完整文档](https://zmailr.onlydev.ccwu.cc/docs/)**

---

## 致谢 & License

基于 [zaunist/zmail](https://github.com/zaunist/zmail) · MCP 设计受 [mailsink](https://mailsink.dev) 启发 · [MIT](./LICENSE)
