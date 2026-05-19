## Why

目前圖示工具 HUD 與目標樣式不一致：圖示預覽與 color picker 左右順序相反、圖示大小預設不是 1.00x，且使用者選定圖示與色號後，沒有一個可重複點選的彩色「已存圖示」區塊。這讓常用彩色地圖圖示需要反覆重新選色，操作成本偏高。

## What Changes

- ColorPickerGrid 的第一列改為左側工具預覽、右側 SV color picker，套用到所有使用該共用元件的工具 HUD。
- Icon tool 的預設大小改為 100，讓初始顯示與放置比例為 1.00x。
- Icon tool 保留目前的預設 icon 選擇列，且預設 icon 在選擇列中統一以 `#7a7a7a` 顯示。
- Icon tool 新增「儲存圖示」按鈕，將目前選中的 icon 與目前色號存成彩色 preset。
- Icon tool 新增「已存圖示」區塊，初始顯示內建彩色 preset：`mountain/#7a7a7a`、`tree/#4a7a3a`、`tower/#7a4a2a`、`skull/#c33232`；使用者儲存的 preset 也顯示於此，點選 preset 會恢復 icon 與色號。

## Non-Goals

- 不在本次變更中加入跨重新整理持久化；已存圖示先維持與現有 saved cells 類似的當次 session 狀態。
- 不變更 IndexedDB icon library 的 schema 或上傳 SVG 流程。
- 不改變地圖檔案 .TRBM 的 icon 資料格式。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `icon-tool`: 增加 icon tool 的彩色已存圖示 preset 行為，並調整預設 icon size。
- `color-picker-layout`: 調整 ColorPickerGrid 第一列預覽與 SV picker 的左右位置。
- `tool-hud-styles`: 調整 icon HUD 的控制項排列，新增儲存圖示按鈕與已存圖示區塊。

## Impact

- Affected specs: icon-tool, color-picker-layout, tool-hud-styles
- Affected code:
  - Modified: src/stores/iconStore.ts
  - Modified: src/components/IconToolHud.vue
  - Modified: src/components/picker/ColorPickerGrid.vue
  - Modified: src/assets/main.css
  - Modified: src/stores/__tests__/iconStore.test.ts
  - Modified: src/components/__tests__/IconToolHud.test.ts
  - Modified: src/components/picker/__tests__/ColorPickerGrid.test.ts
  - New: none
  - Removed: none
