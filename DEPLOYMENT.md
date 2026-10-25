# 本地运行与部署

新安装先按 [README](README.md) 运行 `npm run setup`、`npm start`。本页说明配置、故障处理和公开部署。Node 22 LTS 为推荐运行环境；支持 Node 22.12+ 或 24 LTS。

## 本机配置与存档

`npm run config:init` 只在不存在配置时创建 `ptcg-server/.env`，使用独立随机签名密钥与注册口令，并将文件权限设为 `0600`。已有配置保留。

| 字段 | 用途 |
| --- | --- |
| 小写 `secret` | 登录签名密钥；不要填到前端、README 或公开日志 |
| `PTCG_DUO=1` | 启用当前双人房间模式 |
| `DUO_ROOM_PASSWORD` | 注册口令；留空关闭新注册 |
| `PTCG_BIND` / `PTCG_PORT` | 默认仅监听 `127.0.0.1:8080` |
| `STORAGE_TYPE=sqlite` | 当前使用 SQLite |
| `STORAGE_DATABASE` | SQLite 路径，默认 `database.sq3`，相对后端工作目录 |
| `PTCG_CLIENT_DIR` | 可选的前端 dist 绝对路径 |
| `PTCG_INVITE_TIMEOUT_MS` | 邀请有效期，默认 120000 毫秒 |
| `PTCG_DISCONNECT_FORFEIT_MS` | 断线判负等待，默认 300000 毫秒 |

`npm start` 从后端目录启动，首次运行创建自己的数据库。注册会发放实际持有卡牌及两套新手预组。源码不附管理员账号，管理权限需要实例维护者按后端已有工具配置。

账户、余额、收藏和卡组保存在 SQLite。维护前停止服务并备份数据库及必要的 WAL；对局状态在内存中，服务重启会打断未结束的比赛。当前部署按单服务进程使用，不提供多实例对局同步。

## 素材与下载问题

核心清单共 14,711 个目标文件，外部下载约 3.70 GB。下载缓存、最终素材、依赖与构建产物合计需要明显多于下载大小的空间，建议预留 16 GB。完整命令见 [SCRIPTS.md](SCRIPTS.md)。

- GitHub Raw 连接失败：检查本机网络或代理，网络恢复后重跑 `npm run assets:prepare`；已完成文件会复用。
- 官方图片来源改变：报告会返回失败的目标路径；核对 `public-data/assets.json` 和硬币 `SOURCES.json` 对应产品页，再决定是否更新快照。
- 已有文件冲突：脚本保留原文件。先备份、检查报告并移走冲突文件，再重试。
- Pillow 安装失败：确认 Python 3.10+、`venv`、`pip` 可用；Linux 可能需要先安装发行版的 `python3-venv` 包。
- SQLite 原生依赖安装失败：安装系统 C/C++ 构建工具和 Python，确认正在使用 Node 22/24 后，重跑 `npm run setup`。macOS 通常需要 Xcode Command Line Tools；Linux 常用 `build-essential`。
- BGM 源站失败：按 `public-data/music.json` 的来源和片段手动准备；可先不启用背景音乐。

检查完整核心素材：`npm run assets:check`。`npm run check:assets` 只是音频引用路径检查，不能替代完整素材校验。

## 让其他玩家访问同一个实例

推荐用 HTTPS 反向代理公开这一个 Node 服务，前端、API 和 Socket.IO 使用同一域名。`deploy/nginx.conf.example` 与 `deploy/ptcg.service.example` 是需要按实际域名、目录和服务用户修改的示例。

当前版本仍有继承依赖的高危和严重安全告警，定位为本地功能预览。公开前至少确认：

1. 已按 [SECURITY.md](SECURITY.md) 升级、复核相关依赖，并验证注册、登录及对战路径。
2. 已配置独立的签名密钥与注册口令；仅把注册口令私下提供给要加入的玩家。
3. Node 只监听本机，由反向代理负责 HTTPS 和 WebSocket 转发。
4. 已设置进程托管、备份、日志保留及系统资源限制。
5. 已核对所用卡图、音频、桌布和数据来源的使用条款。

生产前端默认请求同源 API。`VITE_*` 会被打包进浏览器代码，只能放公开配置。

## Docker 示例

保留 `deploy/Dockerfile` 和 `deploy/compose.public.yaml` 供自行部署。先在宿主机完成 `npm run setup` 的配置与素材准备，再执行：

```bash
docker compose -f deploy/compose.public.yaml up -d --build
```

Compose 将当前宿主机的 scans、avatars、sleeves 只读挂载进容器，数据库使用独立命名卷；外部端口默认仍只绑定 `127.0.0.1:8080`。容器数据库与直接 `npm start` 的数据库不是同一份，迁移时须自行备份和核对。

Docker 配置属于部署示例，本次主要验收以本机 Node 运行路径为准；未实际构建容器镜像。
