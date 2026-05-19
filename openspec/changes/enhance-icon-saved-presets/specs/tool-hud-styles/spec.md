## MODIFIED Requirements

### Requirement: IconToolHud with size and rotation sliders

`IconToolHud` SHALL render:
- A `.slider-row` for icon size (`min="10" max="300" step="5"`) bound to `iconStore.size`, labeled "大小", with the current value displayed as a two-decimal multiplier such as `1.00x`
- A `.slider-row` for rotation (`min="0" max="360" step="1"`) bound to `iconStore.rotation`, labeled "旋轉", value shown with `°` suffix
- A preview SVG (`.icon-preview`) with a hexagon outline and the selected icon rendered at the current size and rotation

#### Scenario: Size value shown as multiplier

- **WHEN** `iconStore.size` is `100`
- **THEN** the size value display SHALL show `1.00x`

#### Scenario: Rotation value shown with degree symbol

- **WHEN** `iconStore.rotation` is `90`
- **THEN** the rotation value display SHALL show `90°`

## ADDED Requirements

### Requirement: IconToolHud saved icon preset controls

`IconToolHud` SHALL keep the existing library icon picker as the uncolored default icon selector. Below that picker, it SHALL render a 「儲存圖示」 button and a 「已存圖示」 section for colored saved icon presets.

#### Scenario: Default icon picker uses gray icons

- **WHEN** IconToolHud renders the default icon picker
- **THEN** every icon button in that picker SHALL render its icon color as `#7a7a7a`

#### Scenario: Save controls appear below default icon picker

- **WHEN** IconToolHud is rendered
- **THEN** the default icon picker SHALL appear before the 「儲存圖示」 button
- **THEN** the 「已存圖示」 section SHALL appear after the 「儲存圖示」 button

#### Scenario: Saved icon uses preset color

- **WHEN** a saved preset `{ svgId: "mountain", color: "#336699" }` is displayed in the 「已存圖示」 section
- **THEN** the rendered saved icon button SHALL use `#336699` as its icon color

#### Scenario: Built-in saved icon presets appear with their colors

- **WHEN** IconToolHud is rendered with the built-in icon library entries
- **THEN** the 「已存圖示」 section SHALL include `mountain` rendered with `#7a7a7a`
- **THEN** the 「已存圖示」 section SHALL include `tree` rendered with `#4a7a3a`
- **THEN** the 「已存圖示」 section SHALL include `tower` rendered with `#7a4a2a`
- **THEN** the 「已存圖示」 section SHALL include `skull` rendered with `#c33232`

#### Scenario: Save button disabled without selected icon

- **WHEN** `iconStore.selectedSvgId` is `null`
- **THEN** the 「儲存圖示」 button SHALL be disabled
