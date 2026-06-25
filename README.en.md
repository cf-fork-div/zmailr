# <div align="center">🚀 zMailR - 24-hour Temporary Email Service</div>

<div align="center">
  <p>
    <strong>English</strong> | <a href="./README.md">中文</a>
  </p>

  <p><em>Web UI is Chinese (zh-CN) only.</em></p>

  <p><strong>Enhanced fork of <a href="https://github.com/zaunist/zmail">zaunist/zmail</a></strong> (MIT License)</p>

  <p>
    <a href="https://zmailr.itool.eu.cc/" target="_blank"><strong>🌐 Live Demo</strong></a>
  </p>
</div>

---

## Deployment

See **[docs/deploy.md](docs/deploy.md)** for full deployment steps (D1, GitHub Secrets, Email Routing, local dev).

### 📧 Configure Email Routing

<div style="background-color: #2d2d2d; color: #ffffff; padding: 15px; border-radius: 5px; margin: 15px 0;">
  <ol>
    <li>Find your domain in the Cloudflare dashboard</li>
    <li>Go to "Email" → "Email Routing"</li>
    <li>Enable Email Routing</li>
    <li>Add a routing rule:
      <ul>
        <li>Match type: "Catch-all address"</li>
        <li>Action: "Send to a Worker"</li>
        <li>Select your deployed Worker</li>
      </ul>
    </li>
    <li>Repeat for each domain if you have multiple</li>
  </ol>
</div>

### 📚 Related docs

- **Outbound mail**: [docs/brevo-setup.md](docs/brevo-setup.md) (Brevo signup, SPF/DKIM/DMARC, API key, GitHub Secret, testing)
- **Admin console** (Chinese): [docs/admin-guide.md](docs/admin-guide.md) — secret `ADMIN_PATH` URL, maintenance mode, rate limits, audit logs
- **Programmatic API**: After deploy, create a user API token at **Dashboard → API 密钥** (`/dashboard/api-keys`). Endpoints: `/api/lease`, `/api/mail`, `/api/send` — all require `Authorization: Bearer <token>`

---

## 📄 License

[MIT License](./LICENSE)
