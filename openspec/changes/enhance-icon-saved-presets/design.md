## Context

Icon tool 目前已具備 IndexedDB icon library、預設 icon seed、顏色 picker、大小/旋轉控制與 map placement。使用者提出的目標畫面要求三個調整：預覽圖示在左、所有使用 ColorPickerGrid 的 color picker 在右；icon size 初始為 1.00x；保留上方無色預設 icon 列，另新增可保存「目前 icon + 目前色號」的彩色已存圖示列。

目前 brush color 是由 ColorPickerGrid 監聽 colorPickerStore.hex 後同步到 brushStore，再由 IconToolHud 監聽 brushStore.color 同步到 iconStore.color。這次變更需要沿用此資料流，避免 icon placement 使用到與 UI 顯示不同的色號。

## Goals / Non-Goals

**Goals:**

- 讓 ColorPickerGrid 的 preview slot 固定在左側，SV picker 固定在右側。
- 讓 iconStore.size 預設為 100，HUD 初始顯示 1.00x。
- 在 IconToolHud 中保留原本 library icon picker，新增「儲存圖示」按鈕與「已存圖示」區塊。
- 已存圖示 preset 必須保存 svgId 與 color；點選 preset 必須恢復 selectedSvgId 與目前色號。
- 使用不可變方式更新 saved icon preset 陣列。

**Non-Goals:**

- 不新增 localStorage 或 IndexedDB 持久化。
- 不改變 IconEntry schema、SVG sanitize/normalize 管線或 .TRBM 檔案格式。
- 不新增刪除已存圖示、重新排序或命名 preset 的功能。

## Decisions

### Store saved icon presets in iconStore session state

使用 iconStore 新增 `savedIcons: SavedIconPreset[]` 與 `saveCurrentIcon()`。`SavedIconPreset` 僅包含 `svgId` 與 `color`，因為 SVG 原始資料仍由 iconLibraryStore 管理；渲染已存圖示時透過 svgId 反查 library entry。這避免複製 raw SVG，也避免讓 preset 與 library 內容不同步。

替代方案是把彩色 preset 寫進 iconLibraryStore 或 IndexedDB，但這會把「使用者上傳/內建 icon library」與「常用彩色組合」混在同一個持久層，超出本次需求。

### Keep default icon picker uncolored and add a separate colored saved picker

上方 library picker 繼續作為無色 icon 選擇列；新的「已存圖示」區塊只顯示使用者按下「儲存圖示」後的彩色組合。這符合使用者要求，也避免預設 library icon 的視覺語意和 saved preset 混淆。

替代方案是直接把預設 icon 改成 defaultColor 顯示，但使用者明確要求目前無色預設 icon 可沿用，因此不採用。

### Drive color restoration through picker and stores

點選已存圖示時，實作需設定 selectedSvgId，並同步 colorPickerStore、brushStore、iconStore 的 color 狀態。這確保 HUD hex input、preview、cursor ghost、後續 placement 都使用相同色號。

### Treat layout as shared ColorPickerGrid behavior

Color picker 位置不在單一 IconToolHud 特判，而是在 ColorPickerGrid 內調整 slot 與 SvSquare 順序。所有使用 ColorPickerGrid 的工具 HUD 因此一致呈現「預覽左、color picker 右」。

## Implementation Contract

Behavior:

- Icon tool 初始 size SHALL be 100，HUD 顯示為 1.00x，放置 icon 使用同一 size 值。
- ColorPickerGrid 第一列 SHALL render preview slot before SvSquare in DOM order，視覺上 preview 位於左側、SV picker 位於右側。
- IconToolHud SHALL render the existing library icon picker, followed by a 「儲存圖示」 button and a 「已存圖示」 section.
- Pressing 「儲存圖示」 SHALL append `{ svgId, color }` for the currently selected icon and current icon color to `iconStore.savedIcons`.
- Duplicate `{ svgId, color }` pairs SHALL NOT be appended again.
- Pressing 「儲存圖示」 with no selected icon SHALL leave `savedIcons` unchanged and the UI control SHALL be disabled.
- Clicking a saved icon preset SHALL restore selectedSvgId and color across iconStore, brushStore, and colorPickerStore.
- Saved presets whose svgId no longer exists in iconLibraryStore SHALL NOT render a broken button.

Interface / data shape:

- `SavedIconPreset` shape: `{ svgId: string; color: string }`.
- `iconStore` exposes `savedIcons` and `saveCurrentIcon()`.
- No external file format, IndexedDB schema, command API, or .TRBM schema changes.

Acceptance criteria:

- Unit tests cover iconStore default size, savedIcons default, save behavior, duplicate prevention, and no-selection no-op.
- Component tests cover ColorPickerGrid order, IconToolHud save button/section, saving a colored icon preset, and restoring a saved preset.
- Existing icon placement tests continue to pass with the new default size expectation updated where necessary.
- `npm run test:run` and `npm run typecheck` pass.

Scope boundaries:

- In scope: icon HUD layout, session-scoped saved icon presets, default size, tests.
- Out of scope: persistence, preset deletion, icon library schema changes, map file changes.

## Risks / Trade-offs

- [Risk] Session-only saved presets disappear after refresh. → Mitigation: Document this as a non-goal and keep behavior aligned with existing in-memory saved cell pattern.
- [Risk] Color state can diverge between colorPickerStore, brushStore, and iconStore. → Mitigation: Saved preset selection explicitly updates all three state owners.
- [Risk] Deleted library icons can leave orphaned saved presets. → Mitigation: Render saved presets by resolving svgId against current library icons and skip missing entries.
