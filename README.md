# 国际运费加权计算器

按重量比例分摊国际运费，支持手动加权微调。

## 运行方式

### 嵌入团购系统（推荐）

与 [Group-Buy-Management-System](https://github.com/zhengdaode/Group-Buy-Management-System) 并排放置：

```
some-dir/
├── Group-Buy-Management-System/
└── intl-freight-calc/
```

打开团购系统 `index.html`，首页或仪表盘点击 **🌍 国际运费**。

### 独立运行

直接打开 `index.html`，通过 Excel/CSV/JSON 导入或手动录入。

## 功能

| 功能 | 说明 |
|------|------|
| 实时计算面板 | 当前总重、目标金额、已分配、差额、均价 |
| 可编辑表格 | 单重和加权费用可手动覆盖，其余自动 |
| 团购系统导入 | 一键从团购系统导入（去重） |
| Excel/CSV/JSON 导入 | 独立模式下的导入方式 |
| CSV 导出 | 含完整计算结果和统计行 |
| 数据持久化 | localStorage，`ifc_` 前缀隔离 |

## 计算公式

| 字段 | 公式 |
|------|------|
| 总重 | 单重 × 数量 |
| 去皮总重 | Σ(总重) — 自动 |
| 平均单品国际费用 | (目标金额 ÷ 去皮总重) × 单重 |
| 加权单品国际费用 | 默认 = 平均，可手动覆盖 |
| 加权国际总费用 | 加权单品国际费用 × 数量 |

## 文件结构

```
├── index.html          # 独立运行入口
└── js/
    ├── ifc-core.js     # 双模式检测、全局状态
    ├── ifc-data.js     # localStorage 持久化
    ├── ifc-calc.js     # 计算引擎
    ├── ifc-panel.js    # 实时面板 + 批次管理
    ├── ifc-table.js    # 可编辑表格
    ├── ifc-import.js   # Excel/CSV/JSON 导入
    └── ifc-export.js   # CSV 导出 / 复制表格
```

## 嵌入接口

团购系统设置 `window.IFC_EMBEDDED = true`。计算器通过 `typeof groupData` 检测团购系统数据并进行去重导入。所有顶层声明使用 `var`/`function`，`ifc_` 前缀避免命名冲突。

## 许可

CC BY-NC-SA 4.0
