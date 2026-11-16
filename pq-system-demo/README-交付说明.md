# 植保植检信息管理系统 Demo

这是可直接查看的整合演示版，包含植保植检信息管理和无人机巡田模块。页面使用本地模拟数据，不需要数据库或网络接口。

## 最快开始（Windows）

1. 确认电脑已安装 [Node.js 18+](https://nodejs.org/)。
2. 双击 `启动演示.cmd`。
3. 浏览器打开后访问：<http://localhost:5173/>。

也可以在 PowerShell 中运行 `启动演示.ps1`。

## 手动启动

在当前目录打开终端，执行：

```text
node serve.js
```

然后访问 <http://localhost:5173/>。停止服务时，在运行服务的终端按 `Ctrl+C`。

## 说明

- 推荐使用 Chrome、Edge 或 Firefox 的最新版浏览器。
- 演示数据位于 `mock.js`，页面逻辑位于 `app.js`，样式位于 `styles.css`。
- `uav/` 是无人机模块的静态构建文件，由主页面通过内嵌方式加载。
- 本包不包含 `node_modules`，只需要 Node.js 自带的运行时即可，无需执行 `npm install`。
