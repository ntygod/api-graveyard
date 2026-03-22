# 🪦 API 墓地

> 纪念那些曾经辉煌、如今已逝的 API 和服务。献一束花，缅怀它们。

[🇬🇧 English](./README.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 在线预览

👉 [ntygod.github.io/api-graveyard](https://ntygod.github.io/api-graveyard/)

## 功能

- 🪦 **墓碑卡片** — 浏览已故 API 的详细信息
- 🌸 **献花** — 为你怀念的 API 献上一束花（本地 + 社区合并）
- ☠ **杀手排行榜** — 看看哪家公司杀死的 API 最多
- ⚠️ **濒危 API 观察名单** — 那些还活着但可能撑不了多久的 API
- 📅 **时间线** — 按年份展示 API 死亡历史
- 📊 **统计图表** — 按公司、按年份的数据统计
- 📝 **提交讣告** — 通过表单提交新的已故 API（自动生成 GitHub Issue）
- 🌐 **国际化** — 中英文切换
- 🔗 **深链接** — 通过 URL hash 分享具体墓碑
- 📱 **响应式** — 支持移动端浏览

## 快速开始

纯静态项目，无需构建工具。

```bash
git clone https://github.com/ntygod/api-graveyard.git
cd api-graveyard

# 用任意静态服务器打开
npx serve .
# 或者直接用 VS Code 的 Live Server 插件打开 index.html
```

## 项目结构

```
api-graveyard/
├── index.html
├── css/style.css
├── js/
│   ├── app.js              # 核心逻辑
│   └── i18n.js             # 语言包（中/英）
├── data/
│   ├── apis.json            # 已故 API 数据（中文）
│   ├── apis-en.json         # 已故 API 数据（英文）
│   ├── endangered.json      # 濒危 API 数据（中文）
│   └── endangered-en.json   # 濒危 API 数据（英文）
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml       # 自动部署到 GitHub Pages
│   │   ├── merge-flowers.yml # 合并社区献花数据
│   │   └── process-obituary.yml # 自动处理讣告提交
│   └── ISSUE_TEMPLATE/
│       ├── obituary.yml     # 讣告提交模板
│       └── endangered.yml   # 濒危 API 报告模板
├── og-image.svg
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

## 贡献

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

### 快速贡献方式：

1. **提交已故 API** — 点击网站底部「提交讣告」，或使用 [Issue 模板](https://github.com/ntygod/api-graveyard/issues/new?template=obituary.yml)
2. **报告濒危 API** — 使用[濒危模板](https://github.com/ntygod/api-graveyard/issues/new?template=endangered.yml)
3. **修正数据** — 提交 PR 修正不准确的信息
4. **翻译** — 帮助翻译 API 数据到更多语言

## 讣告自动处理流程

1. 用户通过网站表单提交 → 自动创建带 `obituary` 标签的 GitHub Issue
2. 维护者审核 → 添加 `obituary-approved` 标签
3. GitHub Actions 自动解析 Issue、写入 `apis.json`、部署、关闭 Issue

## 许可证

[MIT](./LICENSE)
