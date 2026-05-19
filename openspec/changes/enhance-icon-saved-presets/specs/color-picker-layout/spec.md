## MODIFIED Requirements

### Requirement: ColorPickerGrid 2×2 grid layout

The `ColorPickerGrid` component SHALL use CSS Grid with `grid-template-columns: 1fr 1fr; column-gap: 8px; row-gap: 6px; align-items: center; margin: 4px 0`. The layout SHALL place:
- Row 1, column 1: `#preview` named slot content (tool-specific SVG preview)
- Row 1, column 2: `SvSquare` (full height square)
- Row 2, spanning both columns: `HuePicker`
- Row 3, column 1: `HexInput`
- Row 3, column 2: color hex label

#### Scenario: ColorPickerGrid shows 2-column layout

- **WHEN** PaintToolHud renders ColorPickerGrid
- **THEN** the preview SVG and SvSquare SHALL appear side by side in the first row, not stacked vertically
- **THEN** the preview SVG SHALL appear before SvSquare in DOM order

### Requirement: ColorPickerGrid preview slot

`ColorPickerGrid` SHALL accept a named slot `#preview`. The slot content SHALL be rendered in the first column of the first row. When no slot content is provided, the cell SHALL remain empty.

#### Scenario: Parent passes preview SVG via slot

- **WHEN** a parent component provides `<template #preview><svg>...</svg></template>`
- **THEN** the SVG SHALL appear in the top-left cell of the picker grid
