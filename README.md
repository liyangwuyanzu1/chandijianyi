# 无人机产地检疫 Demo

本仓库提供可直接浏览的植保植检信息管理系统演示，包含无人机巡田相关模块。演示使用本地模拟数据，不需要数据库。

## 在线预览

部署 GitHub Pages 后，打开仓库的 Pages 地址即可查看。页面由 `pq-system-demo/` 发布。

## 本地运行

需要 Node.js 18+。进入 `pq-system-demo` 文件夹，双击 `启动演示.cmd`，或执行：

```text
node serve.js
```

然后访问 <http://localhost:5173/>。

## GitHub Pages

仓库包含 `.github/workflows/pages.yml`。推送到 `main` 分支后，GitHub Actions 会自动发布 `pq-system-demo`，首次发布后在仓库的 **Settings → Pages** 查看网址。
