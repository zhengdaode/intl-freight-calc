# Changelog

## v1.1.0 (2026-08-12)

### Added
- **国际排发表** (`ifc-schedule.js`) — 按买家 CN 汇总商品清单、总件数、国际运费（从运费计算取）、打包费（可编辑，存 localStorage `ifc_schedule_<batchId>`），支持 CSV 导出、复制表格、**导出图片**（html2canvas → PNG）
- **运费计算** — 新增"数据备份"按钮（`ifcExportDataBackup`），导出当前批次为 JSON 备份文件
- **Tab 切换** (`ifcSwitchTab`) — 运费计算与排发表两个 tab，排发表按需渲染
- **团次选择导入** — 从团购系统导入商品时弹窗多选团次（替代原全部导入），单团次跳过弹窗，显示每团次商品种数
- **同商品数量累加** — `ifcGetGroupProductsFiltered` 对同一 category+character 的商品按 CN 累加数量，不再跳过重复

### Fixed
- **同商品统计次数有误** — 原逻辑同一商品只计入一次，现改为 A 买 2 个 + B 买 1 个 = 总数 3 个，单重 1g 时总重 3g

## v1.0.0 (2026-08-11)

### Added
- 初始发布 — 国际运费加权计算器
- 按重量比例分摊国际运费
- 实时计算面板
- 可编辑表格
- 独立运行 + 嵌入团购系统双模式
- Excel/CSV/JSON 导入导出
- localStorage 持久化（`ifc_` 前缀）
