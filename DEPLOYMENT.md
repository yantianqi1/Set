# Docker Compose Deployment

1. 复制部署环境变量模板到根目录 `.env`：

```bash
cp docker-compose.env.example .env
```

2. 编辑 `.env`，至少改掉这几个值：

- `POSTGRES_PASSWORD`
- `CONFIG_ENCRYPTION_KEY`
- `WEB_PORT`（如果你不想用 3000）

可用下面的命令生成加密密钥：

```bash
openssl rand -hex 32
```

3. 在服务器构建镜像：

```bash
docker compose build --pull
```

4. 启动服务：

```bash
docker compose up -d
```

5. 检查状态和日志：

```bash
docker compose ps
docker compose logs -f postgres api web
```

6. 访问入口：

```text
http://<your-server-ip-or-domain>:<WEB_PORT>
```

说明：

- Compose 会自动读取根目录 `.env`，所以部署时可以直接使用 `docker compose build` 和 `docker compose up -d`。
- 对外只暴露 `web` 一个端口，浏览器请求 `/api/*` 时由 Next 转发到 compose 内网的 `api` 服务。
- `api` 容器启动时会先执行 `prisma db push`；如果数据库结构不兼容，会直接启动失败并在日志里暴露问题。
- 当前仓库没有 Prisma migration 历史，所以 compose 部署默认采用 `db push` 同步 schema。
