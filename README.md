[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/Masque999/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/Masque999/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

# 安家账本

安家账本是一个给一家三口用的家庭记账网站：记每一笔收入和支出、按分类管每月预算、攒储蓄目标、看近半年的收支趋势。栏目有总览、流水、预算、储蓄目标和报表，数据存在本机浏览器里，改动即时保存。

## 本地打开

```bash
cd app
python3 -m http.server 8080
```

然后用浏览器打开 http://localhost:8080/；也可以直接双击 `app/index.html` 打开。

## 功能

- **总览**：当月收入、支出、结余和储蓄率，分类支出条形图，各分类预算进度，最近 5 笔收支，月份可前后切换。
- **流水**：按月份和分类筛选、按备注搜索，新增收支（日期、分类、金额、备注，必填校验），每条可删除。
- **预算**：每月各分类预算与已花金额、进度条，超支标红，预算金额可编辑保存。
- **储蓄目标**：孩子教育金、家庭旅行、换车基金等目标的已存金额与进度，「存入」按钮可加钱并实时更新。
- **报表**：近 6 个月收支趋势图、分类占比环形图和月度结余表。
