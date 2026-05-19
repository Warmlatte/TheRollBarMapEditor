## ADDED Requirements

### Requirement: Icon tool defaults to one times size

The Icon Tool SHALL initialize `iconStore.size` to `100` so newly placed icons use a `1.00x` scale unless the user changes the size control.

#### Scenario: Default icon size is one times

- **WHEN** a new icon store instance is created
- **THEN** `iconStore.size` SHALL be `100`

### Requirement: Icon tool saves colored icon presets

The Icon Tool SHALL allow users to save the currently selected icon and current color as a session-scoped preset. A saved icon preset MUST contain `svgId` and `color`. Saving MUST use immutable array replacement and MUST NOT append duplicate presets with the same `svgId` and `color`.

#### Scenario: Save current icon and color

- **WHEN** `selectedSvgId` is `mountain`, `color` is `#336699`, and the user activates 「儲存圖示」
- **THEN** `iconStore.savedIcons` SHALL contain `{ svgId: "mountain", color: "#336699" }`

#### Scenario: Duplicate saved icon is ignored

- **WHEN** `iconStore.savedIcons` already contains `{ svgId: "mountain", color: "#336699" }` and the user saves the same selected icon and color again
- **THEN** `iconStore.savedIcons` SHALL still contain exactly one matching preset

#### Scenario: No selected icon is not saved

- **WHEN** `selectedSvgId` is `null` and the user attempts to save an icon preset
- **THEN** `iconStore.savedIcons` SHALL remain unchanged

### Requirement: Icon tool restores saved colored presets

The Icon Tool SHALL allow users to select a saved icon preset. Selecting a preset MUST restore `selectedSvgId` and synchronize the preset color to `iconStore`, `brushStore`, and `colorPickerStore`.

#### Scenario: Select saved icon preset

- **WHEN** a saved preset `{ svgId: "mountain", color: "#336699" }` is displayed and the user selects it
- **THEN** `iconStore.selectedSvgId` SHALL become `mountain`
- **THEN** the active icon color SHALL become `#336699`
- **THEN** the color picker hex value SHALL become `#336699`

#### Scenario: Missing library icon preset is hidden

- **WHEN** `iconStore.savedIcons` contains `{ svgId: "missing", color: "#336699" }` and iconLibraryStore has no icon with id `missing`
- **THEN** IconToolHud SHALL NOT render a saved icon button for that preset
