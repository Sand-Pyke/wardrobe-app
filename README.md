# 阿雪的衣柜

React Native Expo 前端 + Express/PostgreSQL API。前端首次运行使用 AsyncStorage 在设备本地保存数据，便于直接在 Expo Go 中体验；服务端目录则提供与需求一致的 REST API 和 PostgreSQL 结构，后续将 repository 替换为 `fetch` 调用即可接入。

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

API 运行在 `http://localhost:3000`，数据库初始化 SQL 位于 `server/src/schema.sql`。开发中单独运行 API 时，将 `.env.example` 复制为 `server/.env` 并填好 `DATABASE_URL`。

## 已实现的体验流程

- 三个底部 Tab：衣物管理、2D 分段假人搭配、穿搭收藏。
- 相册、拍照和文件方式的多图录入；分类常量完全按需求预置。
- 服装/穿搭分类详情、长按后点按目标卡片排序、批量选择删除。
- 躯干上衣/连衣裙逻辑、分类自定义、穿搭保存与从收藏页编辑。
- PostgreSQL 表、预设数据、分页 REST API、Docker Compose 开发环境。
