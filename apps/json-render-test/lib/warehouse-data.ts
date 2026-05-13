// lib/warehouse-data.ts

// 仓储示例数据 — 实际值仅存于客户端 StateProvider，AI 不可见
export const warehouseState = {
  // 月度出入库趋势（折线图）
  monthlyTrend: [
    { month: "1月", inbound: 1200, outbound: 980 },
    { month: "2月", inbound: 980, outbound: 1050 },
    { month: "3月", inbound: 1450, outbound: 1320 },
    { month: "4月", inbound: 1100, outbound: 960 },
    { month: "5月", inbound: 1380, outbound: 1200 },
    { month: "6月", inbound: 1520, outbound: 1410 },
    { month: "7月", inbound: 1290, outbound: 1180 },
    { month: "8月", inbound: 1600, outbound: 1500 },
    { month: "9月", inbound: 1350, outbound: 1250 },
    { month: "10月", inbound: 1480, outbound: 1390 },
    { month: "11月", inbound: 1700, outbound: 1600 },
    { month: "12月", inbound: 1900, outbound: 1750 },
  ],

  // 各库区库存量（柱状图）
  zoneStock: [
    { zone: "A区-原材料", quantity: 3200 },
    { zone: "B区-半成品", quantity: 1800 },
    { zone: "C区-成品", quantity: 4500 },
    { zone: "D区-零配件", quantity: 2100 },
    { zone: "E区-待检区", quantity: 900 },
    { zone: "F区-退货区", quantity: 350 },
  ],

  // 库存品类占比（饼图）
  categoryShare: [
    { name: "电子产品", value: 35 },
    { name: "机械配件", value: 25 },
    { name: "化工原料", value: 15 },
    { name: "纺织品", value: 12 },
    { name: "食品饮料", value: 8 },
    { name: "其他", value: 5 },
  ],
};

// 数据元信息 — 描述字段结构，供 AI 参考绑定（不含实际数据值）
export const warehouseDataMeta = `
## 布局提示
- Card 的 children 中有多个图表时，应使用 Stack 包裹并设置 direction: "horizontal"，使图表横向并排显示。
- 多个 Card 并排时，优先使用 Stack 横向排列；但如果超过2个 Card，考虑使用 Grid 以便窄屏自动换行。

## 可用数据资源（通过 $state 路径引用，实际值对 AI 不可见）

### /monthlyTrend — 月度出入库趋势（适合折线图 LineChart）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| month  | string | 月份标签，如 "1月" |
| inbound | number | 当月入库数量（件） |
| outbound | number | 当月出库数量（件） |

### /zoneStock — 各库区库存量（适合柱状图 BarChart）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| zone | string | 库区名称，如 "A区-原材料" |
| quantity | number | 该库区当前库存数量（件） |

### /categoryShare — 库存品类占比（适合饼图 PieChart）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| name | string | 品类名称，如 "电子产品" |
| value | number | 该品类占比百分比 |
`;