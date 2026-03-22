# 🪦 API 墓地 (API Graveyard)

> 纪念那些曾经辉煌、如今已逝的 API 和服务。献一束花，缅怀它们。

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 预览

一个暗色调的墓园风格网站，每个死掉的 API 都有一块墓碑，记录着它的生卒年月、死因、遗言和墓志铭。

### 功能

- 🪦 **墓碑卡片** — 浏览 24+ 个已故 API 的详细信息
- 🌸 **献花** — 为你怀念的 API 献上一束花（本地 + 社区合并）
- ☠ **杀手排行榜** — 看看哪家公司杀死的 API 最多
- ⚠️ **濒危 API 观察名单** — 那些还活着但可能撑不了多久的 API
- 📝 **提交讣告** — 通过表单提交新的已故 API（自动生成 GitHub Issue）
- 🔍 **搜索与排序** — 按名称、公司、标签搜索
- 📋 **分享** — 一键复制墓碑信息到剪贴板
- 📱 **响应式** — 支持移动端浏览

## 快速开始

这是一个纯静态项目，无需构建工具。

```bash
# 克隆项目
git clone https://github.com/your-username/api-graveyard.git
cd api-graveyard

# 用任意静态服务器打开
npx serve .
# 或者直接用 VS Code 的 Live Server 插件打开 index.html
```

## 项目结构

```
api-graveyard/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式
├── js/
│   └── app.js              # 核心逻辑
├── data/
│   ├── apis.json           # 已故 API 数据
│   └── endangered.json     # 濒危 API 数据
├── .github/
│   └── workflows/
│       └── merge-flowers.yml  # 社区献花合并
└── README.md
```

## 贡献数据

### 方式一：通过网站提交

点击页面底部的「提交讣告」链接，填写表单后会自动跳转到 GitHub Issues 页面。

### 方式二：直接提交 PR

在 `data/apis.json` 中添加一条记录：

```json
{
  "id": "unique-id",
  "name": "API 名称",
  "born": "2010",
  "died": "2023-06-01",
  "icon": "🔥",
  "cause": "死因描述",
  "lastWords": "官方的最后声明",
  "epitaph": "一句话墓志铭",
  "killedBy": "公司名",
  "dependents": "受影响的项目/用户",
  "tags": ["标签1", "标签2"],
  "flowers": 0
}
```

## License

MIT
