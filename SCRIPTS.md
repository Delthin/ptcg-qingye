# 脚本入口

在项目根目录运行。核心流程为：`npm run setup` → `npm start`。脚本的写入范围是当前项目；下载器不上传素材、不操作远端服务器。

## 安装与开发

| 命令 | 作用 |
| --- | --- |
| `npm run setup` | 创建本机配置、准备核心素材、安装依赖、先构建后端再构建前端 |
| `npm run config:init` | 仅在 `.env` 不存在时创建独立随机签名密钥与注册口令 |
| `npm run room:invite` | 在本机终端显示注册口令；不要把输出发到公开问题或日志 |
| `npm run build` | 使用已安装依赖重新构建，不创建账号或修改数据库 |
| `npm start` | 启动服务与已构建前端；首次启动会创建本机 SQLite 数据库 |
| `npm run dev` | 启动 Vite 开发前端；后端单独启动 |

`setup` 保留已有 `.env`。如果旧配置关闭注册，需要手动设置 `DUO_ROOM_PASSWORD` 后重启服务。Node 版本通过 `.nvmrc` 管理；Python 依赖安装在本项目 `.venv`。

## 素材

| 命令 | 作用 |
| --- | --- |
| `npm run assets:prepare` | 下载并校验卡图、界面图片和音效，已有正确文件复用 |
| `npm run assets:check` | 离线校验全部核心素材，缺失或冲突时返回非零退出码 |
| `npm run assets:prepare -- --groups ui,sfx` | 只恢复界面和音效，卡图仍需完整下载才能获得相同显示效果 |
| `npm run assets:prepare -- --path <清单中的完整目标路径>` | 只恢复指定文件，可重复传 `--path` |
| `npm run assets:prepare -- --workers 4` | 降低并发；默认为 8，最多 16 |
| `npm run assets:music -- --list` | 离线查看当前 39 段 BGM 的准备情况 |
| `npm run assets:music -- --accept-source-terms` | 确认来源条件后，用 `ffmpeg` 下载和转码 BGM |
| `npm run assets:music -- --theme <主题>` | 限定 BGM 主题；实际下载仍需条款确认参数 |
| `npm run assets:music:check` | 离线检查 BGM 文件；不联网 |

BGM 下载到源码目录后，需要运行 `npm run build` 将音乐编入前端；若服务正在运行，再停止并重新执行 `npm start`。只下载或执行音乐文件检查不会更新已构建的网页。

核心素材报告位于 `.cache/assets-report.json`；BGM 准备状态位于 `.cache/music-state.json`。背景音乐检查是文件有效性检查，不代表取得了内容使用权。

## 检查与数据库维护

- `npm run check:downloads`：使用项目 `.venv`、合成响应和临时目录执行下载器离线测试；可在 `setup` 完成后运行。
- `npm run check:assets`：查看音效和 BGM 引用路径是否齐备。
- `npm run check:ui`：已有主要操作入口的定点静态检查。
- `npm run check:sqlite`：已有 SQLite 维护工具测试。

`ptcg-server/scripts/economy-admin.cjs` 提供指定账号的管理维护操作；先阅读它的使用说明，并仅在确认目标实例和备份后操作。公开包不携带预设管理员账号。

`ptcg-server/scripts/backfill-deck-formats.js` 会更新所连接数据库中的旧卡组赛制字段，仅供旧数据迁移；新安装不需要运行。

## 保留为资料的文件

`ptcg-server/scripts/economy-*-recipes.json` 保存嗨皮、对战派对、三十周年等配方依据。它们不是自动扩充新卡池的生成器；本版本直接使用 `src/economy/` 下已完成的运行快照。

前端 `scripts/*review*` 是已有组件的局部开发预览，不属于新用户安装步骤。
