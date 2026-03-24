# Docker Compose Deployment

1. 复制环境变量示例文件：

```bash
cp docker-compose.env.example .env.docker
```

2. 修改 `.env.docker`，至少填好：

- `POSTGRES_PASSWORD`
- `CONFIG_ENCRYPTION_KEY`

3. 在服务器执行构建：

```bash
docker compose --env-file .env.docker build
```

4. 启动服务：

```bash
docker compose --env-file .env.docker up -d
```

5. 查看运行日志：

```bash
docker compose --env-file .env.docker logs -f postgres api web
```

6. 访问入口：

```text
http://<your-server-ip-or-domain>:<WEB_PORT>
```

说明：

- 对外只暴露 `web` 一个端口，浏览器请求 `/api/*` 时由 Next 转发到 compose 内网的 `api` 服务。
- `api` 容器启动时会显式执行 `prisma db push`；如果数据库结构不兼容，会直接启动失败并在日志里暴露问题。
- 当前仓库没有 Prisma migration 历史，所以 compose 部署默认采用 `db push` 同步 schema。
