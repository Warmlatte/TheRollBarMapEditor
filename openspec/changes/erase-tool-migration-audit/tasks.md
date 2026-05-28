## 1. eraseStore.ts — 核心 Store 修正

實作 "Erase tool persists target state across sessions"（spec: erase-tool），依設計決策「eraseStore 行為契約」與「localStorage key 維持 hexmap.erase.v1」。

- [x] 1.1 [Erase tool persists target state across sessions] 修改 `useEraseStore` 中的 `savePref()` 函式，將 `{ radius, targets }` 同時序列化寫入 `localStorage` key `hexmap.erase.v1`。修改 `loadPref()` 函式讀取時同時還原 `targets`；若 stored JSON 缺少 `targets` 欄位或個別 key，該 key 預設為 `true`。行為：`toggleTarget('hex')` 呼叫後 localStorage 的 `targets.hex` 反映翻轉值；重新建立 store 後 targets 狀態與持久化一致。驗證：`npm run test:run` 中 `eraseStore.test.ts` 的「restores targets from localStorage on init」「missing targets key defaults to true」「writes targets to localStorage when toggleTarget is called」三個新案例通過。

實作 "Erase radius is stored as SVG pixels with a clamped range of 5 to 200"（spec: erase-tool），依設計決策「半徑儲存方式改回 SVG px 直接值」與「eraseStore 行為契約」。

- [x] 1.2 [Erase radius is stored as SVG pixels with a clamped range of 5 to 200] 移除 `radius` 的 `computed(() => eraseRadius.value * HEX_SIZE)` 換算，讓 `radius` 直接等於 `eraseRadius`（getter 或 alias）。同步移除對 `HEX_SIZE` 的 import。行為：`eraseStore.radius` === `eraseStore.eraseRadius`，無係數乘法。驗證：`npm run typecheck` 零錯誤；既有 `eraseStore.test.ts` 案例繼續通過。

- [x] 1.3 [Erase radius is stored as SVG pixels with a clamped range of 5 to 200] 在 `setRadius(r)` 中加入 `Math.max(5, Math.min(200, r))` clamp，確保 `eraseRadius` 永遠在 5–200 之間。行為：`setRadius(0)` 後 `eraseStore.radius` === 5；`setRadius(999)` 後 === 200；`setRadius(80)` 後 === 80。驗證：`npm run test:run` 中「setRadius(0) clamps to 5」「setRadius(999) clamps to 200」新案例通過。

實作 "Erase store exposes selectAllTargets action"（spec: erase-tool），依設計決策「eraseStore 加入 selectAllTargets()」與「eraseStore 行為契約」。

- [x] 1.4 在 `useEraseStore` 中新增 `selectAllTargets()` action：將 `targets` 的 `hex/icon/line/doodle` 全設為 `true`，呼叫 `savePref()` 持久化。行為：呼叫後四個 targets 皆為 `true`；localStorage 中 `targets` 四個 key 皆為 `true`。驗證：`npm run test:run` 中「selectAllTargets sets all four targets to true and persists」新案例通過。

## 2. i18nStore.ts — 補齊 i18n Keys

實作 "Erase HUD labels are i18n-driven"（spec: erase-tool），依設計決策「EraseToolHud 接 i18nStore」。

- [ ] 2.1 在 `i18nStore.ts` 的 `zh-TW` locale 新增：`erase_radius_label: '半徑'`、`erase_targets_label: '擦除目標'`、`erase_target_hex: '格子'`、`erase_target_icon: '圖示'`、`erase_target_line: '線條'`、`erase_target_doodle: '塗鴉'`、`erase_target_all: '全部'`。在 `en` locale 新增：`erase_radius_label: 'Radius'`、`erase_targets_label: 'Erase Targets'`、`erase_target_hex: 'Hexes'`、`erase_target_icon: 'Icons'`、`erase_target_line: 'Lines'`、`erase_target_doodle: 'Doodles'`、`erase_target_all: 'All'`。驗證：`npm run typecheck` 零錯誤。

## 3. EraseToolHud.vue — UI 修正

依設計決策「EraseToolHud 行為契約」與「EraseToolHud 接 i18nStore」。

- [ ] 3.1 將半徑 slider 的 `min` 改為 `"5"`、`max` 改為 `"200"`；`:value` 綁定改為 `eraseStore.radius`；半徑顯示欄改為 `{{ eraseStore.radius }}`（px 直接值）。行為：slider 顯示範圍 5–200 px，不再是 1–5 單位。驗證：`npm run typecheck` 零錯誤；`EraseToolHud.test.ts` 確認 slider min/max 屬性。

- [ ] 3.2 將 HUD 中 hardcoded 的「半徑」改為 `{{ t('erase_radius_label') }}`；`targetLabels` 改為透過 `t('erase_target_hex')` 等取得。import `useI18nStore`，`<script setup>` 初始化 `const { t } = useI18nStore()`。行為："Erase HUD labels are i18n-driven"——語言切換後標籤即時更新。驗證：`npm run typecheck` 零錯誤；Component render 時無硬編碼中文字串。

- [ ] 3.3 在 target grid 下方加入「全部」按鈕，文字 `{{ t('erase_target_all') }}`，點擊呼叫 `eraseStore.selectAllTargets()`。行為："Erase store exposes selectAllTargets action"——點擊後四個 toggle 全部啟用。驗證：`npm run test:run` 中「renders All button and calls selectAllTargets on click」新案例通過。

## 4. EraseCursor.vue — 補 pointer-events

實作 "EraseCursor does not intercept pointer events"（spec: erase-tool-handler），依設計決策「EraseCursor 行為契約」。

- [ ] 4.1 [EraseCursor does not intercept pointer events] 在 `EraseCursor.vue` 的 `<g>` 根元素加上 `pointer-events="none"`，游標圓圈不攔截底層 SVG 的 pointer 事件。驗證：`npm run typecheck` 零錯誤；`hexCanvas.test.ts` 或手動確認游標層不攔截事件。

## 5. eraseTool.ts — 補 preventDefault

實作 "Erase tool handler calls preventDefault on pointerdown"（spec: erase-tool-handler），依設計決策「eraseTool 行為契約」。

- [ ] 5.1 [Erase tool handler calls preventDefault on pointerdown] 在 `eraseHandler.onPointerDown` 的 `e.button !== 0` 檢查後立即呼叫 `e.preventDefault()`。行為：左鍵按下時阻止瀏覽器預設行為（如文字選取）。驗證：`npm run test:run` 中「onPointerDown calls e.preventDefault on left-button press」新案例通過。

## 6. 補全測試

- [x] 6.1 在 `src/stores/__tests__/eraseStore.test.ts` 新增：(a) `writes targets to localStorage when toggleTarget is called`；(b) `restores targets from localStorage on init`；(c) `missing targets key in localStorage defaults all targets to true`；(d) `setRadius(0) clamps to 5`；(e) `setRadius(999) clamps to 200`；(f) `selectAllTargets sets all four targets to true and persists`。驗證：`npm run test:run` 六個新案例全通過。

- [ ] 6.2 在 `src/render/toolHandlers/__tests__/eraseTool.test.ts` 新增：`onPointerDown calls e.preventDefault when left button is pressed`，用 `vi.fn()` 追蹤 `preventDefault` 並斷言被呼叫一次。驗證：`npm run test:run` 新案例通過。

- [ ] 6.3 在 `src/components/__tests__/EraseToolHud.test.ts` 新增：`renders All button and calls selectAllTargets on click`，mount `EraseToolHud`，找到含「全部」文字的按鈕，trigger click，斷言 `eraseStore.selectAllTargets` 被呼叫。驗證：`npm run test:run` 新案例通過。
