# 无人机产地检疫演示系统

本项目是植保植检信息管理系统的前端演示版，将产地检疫业务页面与无人机巡田模块整合在同一套界面中，用于方案展示、业务流程讲解和交互验证。

演示采用本地预置数据，使用 Node.js 即可运行，无需安装 npm 依赖、配置数据库或启动业务后端。

## 在线演示

公开访问地址：[https://liyangwuyanzu1.github.io/chandijianyi/](https://liyangwuyanzu1.github.io/chandijianyi/)。访问演示无需登录或仓库权限。

代码托管于 [GitLab 项目仓库](https://git-access.hezor.ai/solution-demo-system-center/uav-origin-quarantine)，公开演示由原有 GitHub 仓库的 Pages 提供。更新公开演示时，需将最新代码同步至 GitHub 远程 `origin` 的 `main` 分支，工作流会自动发布 `pq-system-demo/`。

## 功能概览

### 产地检疫

| 页面 | 演示内容 |
| --- | --- |
| 产检申请 | 申请表单、申报信息、植物明细录入 |
| 产检受理 | 申请记录查询、受理信息与业务详情 |
| 田间调查 | 调查列表、调查办理、检疫地点及关联飞行记录入口 |
| 实验室检验 | 检验记录查询与办理界面 |
| 签发证书 | 待签发记录、签发信息与处理界面 |
| 产检查询 | 按单证号、植物名称、申报单位等条件查询记录，查看办理状态和流程 |
| 综合查询 | 分类查询入口、统计和明细页面 |

界面支持菜单展开、多页签切换、列表筛选、分页和详情查看。首次打开默认进入“田间调查”。

### 无人机巡田

在“产地检疫 → 无人机巡田”下提供六个模块入口：

| 模块 | 场景 |
| --- | --- |
| 设备管理 | 无人机及相关设备信息展示 |
| 地点管理 | 检疫地块、地点信息与地图展示 |
| 飞行计划 | 巡田计划、航线及飞行参数展示 |
| 实时监测 | 模拟飞行状态、地图轨迹与监测界面 |
| 飞行记录 | 历次作业记录、任务详情及相关成果展示 |
| 数据管理 | 巡田采集数据与处理成果展示 |

无人机模块以已构建的静态页面通过 iframe 嵌入主系统，并通过查询参数选择对应模块。田间调查页面可携带地点信息跳转至关联飞行记录。

## 快速开始

### 环境要求

- Node.js 18 或更高版本。
- 推荐使用最新版 Chrome、Edge 或 Firefox。
- 默认使用本机 `5173` 端口。

### 命令行运行

```bash
git clone https://git-access.hezor.ai/solution-demo-system-center/uav-origin-quarantine.git
cd uav-origin-quarantine/pq-system-demo
node serve.js
```

浏览器访问 [http://127.0.0.1:5173/](http://127.0.0.1:5173/)，也可使用 [http://localhost:5173/](http://localhost:5173/)。

在运行服务的终端按 `Ctrl+C` 停止服务。本项目不需要执行 `npm install` 或构建命令。

### Windows 一键启动

进入 `pq-system-demo` 文件夹，双击 `启动演示.cmd`，脚本会启动服务并打开浏览器。关闭新打开的服务窗口即可停止服务。

也可在仓库根目录的 PowerShell 中执行：

```powershell
.\pq-system-demo\启动演示.ps1
```

PowerShell 脚本会在后台启动 Node.js 进程；停止时需结束对应的服务进程。

## 推荐演示路径

1. 从默认打开的“田间调查”查看列表，按植物名称或申报单位筛选记录。
2. 打开记录的“办理”页面，查看调查信息和检疫地点，并进入关联的无人机飞行记录。
3. 展开“无人机巡田”，依次查看设备、地点、飞行计划、实时监测、飞行记录和数据管理。
4. 返回产地检疫菜单，演示申请、受理、实验室检验、签发与查询页面。
5. 使用顶部已打开的页签切换业务页面，展示检疫业务与巡田信息的衔接方式。

## 目录结构

```text
uav-origin-quarantine/
├── README.md
├── 无人机产地检疫模块Demo功能清单.md       # 业务方案与后续功能规划
├── .github/workflows/pages.yml          # GitHub Pages 发布配置
└── pq-system-demo/                     # 可独立部署的静态站点
    ├── index.html                      # 主系统入口
    ├── app.js                          # 菜单、页签、表格与表单交互
    ├── mock.js                         # 业务菜单、查询配置和演示数据
    ├── styles.css                      # 主系统样式
    ├── serve.js                        # Node.js 静态文件服务
    ├── 启动演示.cmd
    ├── 启动演示.ps1
    ├── README-交付说明.md
    ├── assets/                         # 主系统图片、图标和字体
    └── uav/                            # 无人机模块的构建产物与素材
        ├── index.html
        ├── assets/
        └── map-icons/
```

## 技术与维护

- 主系统使用原生 HTML、CSS 和 JavaScript，演示数据由 `mock.js` 提供。
- 本地服务只使用 Node.js 内置的 `http`、`fs` 和 `path` 模块。
- 调整业务页面时，修改 `app.js`、`mock.js` 或 `styles.css`，保存后刷新浏览器即可查看。
- `pq-system-demo/uav/` 保存的是无人机模块的构建产物，不包含对应的组件级源码和构建配置。修改该模块需在其源码项目中完成开发和构建，再同步产物，并保留现有嵌入入口及模块参数的兼容性。

可在仓库根目录执行基础 JavaScript 语法检查：

```bash
node --check pq-system-demo/serve.js
node --check pq-system-demo/app.js
node --check pq-system-demo/mock.js
```

## 部署

### 静态服务器

将 `pq-system-demo/` 的完整内容部署至 Nginx、Apache 或其他静态托管服务，并将该目录设为站点根目录。保留 `assets/` 与 `uav/` 的相对目录结构，无需额外构建。

直接打开 `file://` 页面可能受浏览器限制，建议通过 HTTP 服务访问。

### GitHub Pages

仓库保留了 `.github/workflows/pages.yml`。在 GitHub 仓库启用 Pages 并将发布来源设置为 GitHub Actions 后，推送至 `main` 或 `master` 分支可触发发布，也支持手动运行工作流。

该工作流仅适用于 GitHub。当前 GitLab 仓库未配置自动部署流水线，推送代码后仍需另行配置托管服务。

## 演示范围

- 当前版本用于前端演示，未接入正式检疫业务接口、数据库、无人机控制服务或在线识别服务。
- 提交、签发、上传、导出等操作中，部分仅提供交互提示或模拟结果，不代表已完成实际业务处理。
- 主系统表单和办理操作没有服务端持久化，不应作为正式业务记录保存。
- 顶部其他业务模块及部分侧边菜单用于展示整体系统结构，当前主要可交互范围为产地检疫和无人机巡田。
- [无人机产地检疫模块 Demo 功能清单](无人机产地检疫模块Demo功能清单.md)包含业务方案和后续规划，具体已实现内容以当前页面及本 README 为准。

## 常见问题

**提示 `node` 命令不存在**：安装 Node.js 18 或更高版本，并重新打开终端。

**提示 `EADDRINUSE`**：默认 `5173` 端口已被占用。确认已有服务用途后，停止对应服务，或调整 `serve.js` 中的监听端口并使用相同端口访问。

**主页面可访问但无人机模块空白**：检查 `uav/index.html` 和 `uav/assets/` 是否完整部署，确认静态资源请求没有返回 404。

**`localhost` 无法访问**：尝试使用 `127.0.0.1` 和服务实际监听的端口访问。
