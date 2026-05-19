## 1. Store 與行為

- [x] 1.1 實作「Icon tool defaults to one times size」與「IconToolHud with size and rotation sliders」合約：新 iconStore instance 的 `size` 為 `100` 並讓 HUD 顯示 `1.00x`；以 `src/stores/__tests__/iconStore.test.ts` 與 `src/components/__tests__/IconToolHud.test.ts` 驗證。
- [x] 1.2 依「Store saved icon presets in iconStore session state」決策實作「Icon tool saves colored icon presets」：`iconStore.savedIcons` 暴露 session-scoped `{ svgId, color }` preset，`saveCurrentIcon()` 以不可變陣列更新、忽略重複與未選 icon；以 `src/stores/__tests__/iconStore.test.ts` 驗證。
- [x] 1.3 依「Drive color restoration through picker and stores」決策實作「Icon tool restores saved colored presets」：點選 saved preset 後同步 `selectedSvgId`、`iconStore.color`、`brushStore.color` 與 `colorPickerStore.hex`；以 `src/components/__tests__/IconToolHud.test.ts` 驗證。

## 2. HUD 排版與樣式

- [x] 2.1 依「Treat layout as shared ColorPickerGrid behavior」決策實作「ColorPickerGrid 2×2 grid layout」與「ColorPickerGrid preview slot」：所有 ColorPickerGrid 使用者都呈現 preview 左、SV picker 右，Hue 與 Hex 列維持既有排列；以 `src/components/picker/__tests__/ColorPickerGrid.test.ts` 驗證 DOM order。
- [x] 2.2 依「Keep default icon picker uncolored and add a separate colored saved picker」決策實作「IconToolHud saved icon preset controls」：保留無色預設 icon picker，於其下方顯示「儲存圖示」按鈕與「已存圖示」彩色 preset 區塊，未選 icon 時按鈕 disabled，缺失 library icon 的 preset 不渲染；以 `src/components/__tests__/IconToolHud.test.ts` 與瀏覽器畫面檢查驗證。

## 3. 驗證與交付

- [x] 3.1 跑 `npm run test:run -- src/stores/__tests__/iconStore.test.ts src/components/picker/__tests__/ColorPickerGrid.test.ts src/components/__tests__/IconToolHud.test.ts`，驗證本 change 的 store、layout、HUD 行為測試全綠。
- [x] 3.2 跑 `npm run test:run` 與 `npm run typecheck`，驗證整體測試與 TypeScript 檢查通過。
- [x] 3.3 跑 `spectra status --change enhance-icon-saved-presets --json`，確認 proposal、design、specs、tasks artifacts 完整且可進入 apply。

## 4. 預設已存圖示修正

- [x] 4.1 依「Store default and user saved icon presets in iconStore session state」決策更新「Icon tool saves colored icon presets」：`iconStore.savedIcons` 預設包含 `mountain/#7a7a7a`、`tree/#4a7a3a`、`tower/#7a4a2a`、`skull/#c33232`，且 `saveCurrentIcon()` 仍以不可變陣列追加非重複 preset；以 `src/stores/__tests__/iconStore.test.ts` 驗證。
- [x] 4.2 依「Keep default icon picker gray and add a separate colored saved picker」決策更新「IconToolHud saved icon preset controls」：預設 icon picker 全部以 `#7a7a7a` 顯示，已存圖示區塊初始顯示四個內建彩色 preset；以 `src/components/__tests__/IconToolHud.test.ts` 驗證。
- [x] 4.3 跑 `npm run test:run -- src/stores/__tests__/iconStore.test.ts src/components/__tests__/IconToolHud.test.ts`、`npm run test:run` 與 `npm run typecheck`，確認修正後相關與全量驗證通過。
