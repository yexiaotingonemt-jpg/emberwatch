# 余烬守望 · Emberwatch

一款黑暗森林主题的浏览器塔防游戏。守住林间最后的余烬，让穿越曲折小径的怪物止步于防线。

**[在线游玩](https://yexiaotingonemt-jpg.github.io/emberwatch/)** · [离线单文件](https://yexiaotingonemt-jpg.github.io/emberwatch/emberwatch-offline.html)

网页与离线版均无需账号，支持电脑和手机浏览器。战绩保存在当前浏览器本地。

## 启动

**直接玩：双击 `release/余烬守望.html`。** 这是完整离线单文件版，无需安装、无需服务器，也不依赖联网字体或素材。推荐使用 Chrome 或 Edge。

## 开发与修改

需要 Node.js 20.19+ 或 22.12+ 及 npm。首次运行，在此文件夹打开终端：

```powershell
npm install
npm run dev
```

打开终端打印的本地地址（通常为 `http://127.0.0.1:5173`）。Windows 下安装依赖后也可双击 `启动游戏.cmd`，自动启动并打开浏览器。游戏运行时请保留启动终端；关闭终端即可停止服务。

```powershell
npm run build  # 检查 TypeScript，生成 dist/ 与 release/余烬守望.html
npm test       # 运行游戏规则测试
npm run preview  # 本地预览已构建的成品
```

开发服务器运行在 4173 端口时，`npm run test:browser` 执行浏览器交互回归；`node qa/offline.mjs` 验证离线单文件。测试需本机已安装 Chrome。

## 玩法

- 3 张地图、每局 15 波，沿道路的建造点部署防御塔。
- 4 种防御塔，各有 3 级成长与升级分支；结合射程、攻速、范围伤害与控制搭配阵容。
- 第 5、10 波后选择强化，逐步改变本局策略。
- 使用陨星技能处理危急局面，可切换 1×、2×、3× 战斗速度。
- 最佳通关星级保存在当前浏览器本地。清除站点数据会移除记录。

## 操作

| 操作 | 按键 / 方式 |
| --- | --- |
| 选择防御塔 | 数字 `1`–`4` 或点击塔卡 |
| 建造 / 选择已建造的塔 | 点击地图上的建造点 / 防御塔 |
| 开始下一波 | `Space` 或点击下一波按钮 |
| 暂停 / 继续 | `P` |
| 陨星技能 | `F`，按界面提示选择目标 |
| 取消当前操作 | `Escape` |
| 升级、出售与战斗速度 | 点击对应界面按钮 |

音效在首次点击或按键后启用，可通过界面开关静音。森林氛围、射击与反馈音均通过 Web Audio 实时合成，无需下载音频素材。

## 技术

TypeScript、Phaser 3、Vite。完整源码在 `src/`，规则测试在 `tests/`。游戏不连接后端；首次安装开发依赖需要联网。

## 网站部署

GitHub Pages 由 `.github/workflows/pages.yml` 自动发布。默认分支 `codex/initial-release` 的每次提交都会安装锁定依赖、运行规则测试、构建游戏，成功后再部署；拉取请求仅执行构建与测试。

`vite.config.ts` 使用相对资源路径，支持仓库子目录。网站构建也会生成 `emberwatch-offline.html`，方便下载保存。
