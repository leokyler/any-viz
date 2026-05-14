# AnyViz — 智能数据分析工具 设计文档

## 概述

AnyViz 是一个面向非技术业务人员的智能数据分析工具。用户通过自然语言对话，即可对数据进行分析并自动生成可视化图表。核心机制：LLM 生成 json-render spec（结构化 JSON），前端运行时绑定数据渲染图表，**原始数据不经过 LLM**。

## 架构

**AI-First 全栈 + json-render spec 驱动**

```
用户提问 → [LLM 生成 spec] → [json-render-react 渲染]
                ↑                          ↑
        数据元信息（schema）          $state 数据绑定
        （字段名/类型/描述）         （实际数据留在客户端）
```

技术栈：
- 前端：Next.js 16 + React 19 + Tailwind CSS 4
- 渲染：@json-render/react + @json-render/shadcn
- 图表：Recharts
- LLM：Vercel AI SDK（抽象接口，初期 DeepSeek）
- 数据解析：Papa Parse（CSV）/ SheetJS（Excel）

### 数据安全边界

LLM 只收到数据的**元信息**（字段名、类型、描述），通过 `$state` 路径引用绑定数据。实际数据值始终留在客户端 `StateProvider` 中，不发送给 LLM。

## 对话模式

**目标：混合模式**（按数据源/话题分会话，会话内多轮对话）

**MVP：单轮对话** — 每次提问独立生成 spec，无上下文记忆。后续迭代加入多轮会话。

## 数据源

| 阶段 | 数据源 | 说明 |
|------|--------|------|
| MVP | CSV/Excel 文件上传 | 用户上传文件，自动解析 |
| V2 | 数据库连接 | MySQL、PostgreSQL 等 |
| V3 | 第三方 API | Google Analytics、Salesforce 等 |

### 数据元信息自动推断

用户上传文件后，系统自动分析数据：
1. 解析文件获取列名、采样行
2. 推断字段类型（string、number、date）
3. 生成数据元信息描述（含字段名、类型、含义、示例值）
4. 元信息注入 LLM system prompt，用于生成正确的 $state 引用

## UI 布局

**对话内嵌布局** — 类似 ChatGPT 的单栏布局，图表内嵌在对话流中：
- 用户消息 → AI 回复（含文本洞察 + 图表）
- 图表通过 json-render spec 渲染，数据通过 $state 绑定
- 输入框在底部，支持追问（V2 多轮）

## 组件目录（MVP）

基于 json-render catalog，已有组件 + 新增：

| 组件 | 来源 | 说明 |
|------|------|------|
| Card | 已有（shadcn） | 仪表盘卡片容器 |
| Stack | 已有（shadcn） | 布局排列 |
| Heading | 已有（shadcn） | 标题 |
| Button | 已有（shadcn） | 按钮 |
| Input | 已有（shadcn） | 输入框 |
| LineChart | 已有 | 折线图（Recharts） |
| BarChart | 已有 | 柱状图（Recharts） |
| PieChart | 已有 | 饼图（Recharts） |
| DataTable | **新增** | 数据表格展示 |
| KPICard | **新增** | 关键指标卡片 |
| Text | **新增** | AI 洞察文本块 |
| Tabs | **新增** | 多视图切换 |
| Grid | **新增** | 响应式网格布局 |

后续迭代：地理地图、热力图等高级可视化。

## LLM 集成

- 使用 Vercel AI SDK（`ai` 包）统一调用接口
- 初期接入 DeepSeek（已在 demo 中验证）
- 通过 `catalog.prompt()` 生成系统 prompt（含数据元信息）
- 使用 `streamText` 流式输出 spec
- 前端用 `useUIStream` hook 接收流式 spec 并渲染

### Prompt 策略

System prompt 组成：
1. json-render catalog 组件定义（自动生成）
2. 数据元信息（字段名、类型、描述、$state 路径）
3. 布局提示（如 demo 中的 `warehouseDataMeta`）
4. 通用规则：优先使用 $state 引用数据、不要返回实际数据值

## 项目结构

基于现有 Turborepo monorepo：

```
apps/
  web/                    # 主应用（Next.js 16）
    app/
      page.tsx            # 主页面（对话 + 可视化）
      api/
        generate/route.ts # LLM API 路由
        upload/route.ts   # 文件上传 API
    lib/
      catalog.ts          # json-render catalog 定义
      registry.tsx         # json-render 组件注册
      data-parser.ts      # CSV/Excel 解析 + 元信息推断
      components/         # 自定义 json-render 组件
        DataTable.tsx
        KPICard.tsx
        Text.tsx
        Tabs.tsx
        Grid.tsx
        LineChart.tsx      # 已有
        BarChart.tsx       # 已有
        PieChart.tsx       # 已有
packages/
  ui/                     # 共享 UI 组件（shadcn 等）
```

## 国际化

- UI 支持中英双语切换（next-intl 或类似方案）
- LLM prompt 根据用户语言动态切换
- 数据元信息描述跟随用户语言

## MVP 范围

**包含：**
- CSV/Excel 文件上传并自动推断元信息
- 单轮对话生成可视化
- json-render spec 驱动渲染（8 个已有 + 5 个新增组件）
- DeepSeek LLM 集成
- 中英双语 UI

**不包含：**
- 多轮对话历史
- 数据库/API 连接
- 用户认证
- 数据持久化（会话数据仅存在客户端 state）
- 地图/热力图等高级可视化

## 从 demo 到 MVP 的路径

`feat/json-render#2` 分支已验证核心机制：
- ✅ json-render spec 生成 + 流式渲染
- ✅ $state 数据绑定
- ✅ Recharts 图表组件（Line/Bar/Pie）
- ✅ DeepSeek LLM 调用

MVP 需要在 demo 基础上：
1. 从 `apps/json-render-test` 迁移到 `apps/web`
2. 添加文件上传 + 数据解析 + 元信息推断
3. 新增 5 个组件（DataTable, KPICard, Text, Tabs, Grid）
4. 构建对话 UI（消息列表 + 输入框）
5. 优化 prompt 策略（自动注入数据元信息）