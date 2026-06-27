# 快速开始

<div class="zmailr-hero">

**zMailR** 提供真实 MX 临时邮箱 + OTP 自动提取，供 **测试脚本、CI、Cursor/Claude Agent** 使用。

**本实例** <SiteOrigin /> · 演示 <SiteLink to="/login">guest / guest</SiteLink> · Token 在 <SiteLink to="/dashboard/api-keys">API 密钥</SiteLink> 创建

</div>

## 文档导航

| 章节 | 页面 | 你会学到 |
|------|------|----------|
| **入门** | [认证与 Token](./user-auth.md) | Bearer、Scope、创建 Token |
| | [错误码与限制](./errors.md) | 统一错误表、速率与发信配额 |
| **API** | [API 概览](./api-overview.md) | 核心接口、选型、REST vs 长轮询 |
| | [API 参考](./api.md) | 逐端点参数、返回、curl |
| | [脚本接入](./scripting.md) | Python / Node / curl 模板 |
| **MCP** | [MCP 快速接入](./mcp.md) | Cursor / Claude 5 分钟配置 |
| | [MCP 工具参考](./mcp-tools.md) | 11 个工具参数与 REST 对照 |

OpenAPI：<SiteLink to="/openapi.json">/openapi.json</SiteLink> · 交互式：<SiteLink to="/api-docs">/api-docs</SiteLink>

---

## 什么是 zMailR？

1. **租用**一个 24 小时有效的真实 MX 临时邮箱（`POST /api/lease`）
2. 在目标网站填写该邮箱触发验证邮件
3. **收取 OTP**——长轮询（`GET /api/mail`）或即时查询（`latest-code`）

Agent 用户可跳过手写 HTTP，配置 MCP 后让 Cursor/Claude 调用 `lease_mailbox` → `wait_for_mail`。

---

## 5 分钟上手

### 1. 准备 Token

1. <SiteLink to="/login">登录</SiteLink>（演示 `guest` / `guest`）
2. <SiteLink to="/dashboard/api-keys">API 密钥</SiteLink> → 新建 Token
3. Scope 勾选 **`lease`**、**`mail`**，复制 Token

详情 → [认证与 Token](./user-auth.md)

### 2. 租用邮箱 → 取 OTP

Base URL：<SiteOrigin />

```bash
export BASE="https://your-domain"   # 本实例见上方 SiteOrigin
export TOKEN="your-bearer-token"

curl -s -X POST "$BASE/api/lease" -H "Authorization: Bearer $TOKEN"
# 将返回的 email 用于目标站点，然后：
curl -s -G "$BASE/api/mail" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode 'to=<email>' \
  --data-urlencode 'timeout=60' \
  --data-urlencode 'require_code=true'
```

Python / Node 完整模板 → [脚本接入](./scripting.md)

### 3. MCP（可选）

配置 `@zmailr/mcp` 后，在 Cursor 中说：「用 zmailr 租临时邮箱，等验证码告诉我」。

5 分钟配置 → [MCP 快速接入](./mcp.md)

---

## 核心概念（3 个接口）

| 接口 | 做什么 | 什么时候用 |
|------|--------|------------|
| `POST /api/lease` | 分配 **24h** 临时邮箱 | 注册/登录测试第一步 |
| `GET .../latest-code` | **立刻**查 OTP（无则 404） | 自己控制轮询间隔 |
| `GET /api/mail?to=...` | **阻塞等待** OTP（最长 ~55s） | 脚本一条命令等验证码 |

MCP 工具 `lease_mailbox` / `wait_for_mail` / `get_latest_code` 与上表一一对应 → [MCP 工具参考](./mcp-tools.md)

选型与完整端点表 → [API 概览](./api-overview.md)

---

## 遇到问题？

| 现象 | 去哪查 |
|------|--------|
| `401` / `403` | [认证与 Token](./user-auth.md) |
| `404 no_code` | 正常，继续轮询 → [错误码与限制](./errors.md) |
| `429 rate_limit` | [错误码与限制 · 速率限制](./errors.md#速率限制) |
| MCP 连不上 | [MCP 快速接入 · 验证](./mcp.md#验证) |
