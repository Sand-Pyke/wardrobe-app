# 阿雪的衣柜

React Native Expo 前端 + Express/PostgreSQL API。前端当前使用 AsyncStorage 保存数据，便于直接在 Expo Go 中体验；服务端提供与需求一致的 REST API 和 PostgreSQL 结构，后续将 repository 替换为 API 实现即可接入。

## 运行移动端

```powershell
cd D:\Desktop\wardrobe-app
npm install
npm start
```

扫描 Expo 控制台的二维码，在 Expo Go 中打开。首次添加衣物时，请授权相册或相机权限。

## 运行 API 与 PostgreSQL

```powershell
cd D:\Desktop\wardrobe-app
docker compose up --build
```

API 运行在 `http://localhost:3000`，数据库初始化 SQL 位于 `server/src/schema.sql`。开发中单独运行 API 时，将 `server/.env.example` 复制为 `server/.env` 并填好 `DATABASE_URL`。

## 项目结构

```text
App.tsx                         应用 Provider 入口
src/navigation/                页面流转与未来登录/业务路由边界
src/screens/                   主页、搭配、收藏、详情页面
src/components/                弹窗、底部导航和通用 UI
src/hooks/useWardrobeData.ts    衣物与穿搭状态及持久化操作
src/data/                      本地存储；后续可替换为 API repository
server/src/app.ts              Express 应用组装
server/src/routes/             按资源拆分的 REST 路由
server/src/middleware/         错误处理及未来认证边界
server/src/db/                 PostgreSQL 连接
```

当前 API 仍保持匿名模式，`server/src/middleware/auth.ts` 只定义未来认证边界，尚未挂载。接入登录后应由 JWT/session 解析用户身份，服务端从认证上下文读取 `userId`，不再接受客户端自行声明用户身份。

## 已实现的体验流程

- 三个底部 Tab：衣物管理、2D 分段假人搭配、穿搭收藏。
- 相册、拍照和文件方式的多图录入；分类常量完全按需求预置。
- 服装/穿搭分类详情、长按连续拖拽排序、批量选择删除和图片放大预览。
- 躯干上衣/连衣裙逻辑、分类自定义、穿搭保存与从收藏页编辑。
- PostgreSQL 表、预设数据、分页 REST API、Docker Compose 开发环境。
