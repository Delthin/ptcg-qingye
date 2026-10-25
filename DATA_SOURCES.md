# 数据与素材来源

本仓库提供可运行的数据快照和可校验的素材下载清单。下载器恢复当前版本，不重新抓取、推断或扩充卡牌规则。

## 随源码保留的内容

- `public-data/catalog.json`：简中展示目录。
- `ptcg-server/src/economy/`：印刷、商品、预组、抽取配方、硬币等运行数据。
- `ptcg-server/scripts/economy-*-recipes.json`：人工整理的配方依据。
- `public-data/assets.json`：14,711 个目标文件及其固定来源、大小和 SHA-256；其中 14,321 个是卡图与商品图，330 个是界面素材，60 个是音效。
- `public-data/music.json`：39 段背景音乐的来源、文件名、署名与裁切方式。
- 前端的本项目 SVG、两个默认头像、Fusion Poke Pixel 字体及其 OFL 授权文本。

运行卡牌目录包含 11,847 条印刷记录：`printings.json` 的 11,838 条加上 `coin-printings.json` 的 9 条赠卡记录。不要只读其中一个文件来统计完整卡池。

## 核心素材下载源

| 内容 | 公开来源 | 固定版本 / 校验 |
| --- | --- | --- |
| 简中卡图、商品封面、赠卡图 | [duanxr/PTCG-CHS-Datasets](https://github.com/duanxr/PTCG-CHS-Datasets) | commit `c3b6ac6ef803aad9d60e44d058359addf3a20883`；逐文件 SHA-256 与大小 |
| 继承的界面图片、头像、卡套与音效 | [ploober/twinleafgg](https://github.com/ploober/twinleafgg) | commit `b5d1874afe685264b44491c09684d1843e7ab762`；逐文件 SHA-256 与大小 |
| 早期硬币图 | [1niceroli/ptcg-assets](https://github.com/1niceroli/ptcg-assets) | commit `57f396e4e4ecd6a7e8c685a6584d0a15ac615a0a`；逐文件 SHA-256 与大小 |
| 官方产品硬币图 | [宝可梦中国产品页](https://www.pokemon.cn/tcg/product/) | 从各产品页实时解析对应原图，按清单校验原图并裁切、缩放；输出验证 RGBA 像素哈希 |
| 桌布 | [PokéWalls / MapleRose](https://pokewalls.wordpress.com/) | 保留作者署名与原图链接；JPEG 原图转为 PNG，验证 RGBA 像素哈希 |
| 标题字体 | [Fusion Poke Pixel](https://github.com/pixel-font-studio/fusion-poke-pixel-font/releases/tag/2026.09.25) | 2026.09.25，OFL-1.1；提交 WOFF2、署名及完整许可文本 |

卡图来源按本地文件与公开 Git blob 的精确身份核对，不根据卡名或编号猜文件路径。重复使用同一原图的素材只下载一次。图像变换以相同像素为目标，PNG 编码字节可能与旧本地文件不同。

硬币详细来源及裁切记录见 `ptcg-play-react/public/assets/coins/SOURCES.json`；桌布署名见 `ptcg-play-react/public/assets/playmats/attribution.json`。官方图片的临时鉴权查询参数不写入仓库、下载清单或报告；每次下载从对应公开产品页获取。

## 下载、缓存与冲突

```bash
npm run assets:prepare
npm run assets:check
```

首次核心下载约 3.70 GB。缓存位于 `.cache/assets/`，报告位于 `.cache/assets-report.json`，均被 Git 忽略。下载器只连接列出的 HTTPS 来源，检查重定向、目标路径和符号链接；下载到临时文件，校验后再原子安装。

已经正确的文件会复用，失败项可重试；内容不同的已有目标和损坏的缓存会报冲突，供使用者检查处理。不要把报告中的失败忽略后当成完整素材包使用。

可缩小到某组或单个目标，详见脚本说明：

```bash
npm run assets:prepare -- --groups ui,sfx
npm run assets:prepare -- --path ptcg-server/scans/duo/21267.png
```

## 可选背景音乐

本版清单包含 39 段音乐：25 段取自 Internet Archive（Archive.org），14 段取自 Bilibili 的公开上传内容。来源页面、署名和精确片段保存在 `public-data/music.json`，下载器要求显式确认来源条款，并依赖系统 `ffmpeg`；不会将音频提交 Git。

```bash
npm run assets:music -- --list
npm run assets:music -- --accept-source-terms
npm run assets:music:check
npm run build
```

BGM 通过构建期索引加入前端；下载后运行 `npm run build`，并重启已运行的服务，网页才会显示音乐入口。

音源可能限流、改变格式或下架，且其上传公开性不等于获得分发许可。缺失片段可以按清单手动准备；前端曲目表保持当前版本。

## 内容更新与权利

本次不提供从零生成全部卡文、映射和商品配方的数据流水线。要扩充新卡池，需要同时维护印刷、引擎实现、预组配方与素材清单；只有新图片不能让新卡自动用于对战。

卡图、卡文、商标、声音及其他第三方素材权利与源码许可证分别处理。以上记录提供可追溯来源，没有替代原站条款或授予素材再分发许可。不得将本项目的源码许可证当作宝可梦素材的授权。
