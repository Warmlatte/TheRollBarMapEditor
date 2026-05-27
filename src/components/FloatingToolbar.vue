<script setup lang="ts">
import { useBrushStore } from '../stores/brushStore'
import type { Tool } from '../stores/brushStore'
import { useI18nStore } from '../stores/i18nStore'
import { TOOLS } from '../tools/registry'
import type { ToolDef } from '../tools/registry'

type IconKind = 'hex' | 'image' | 'segment' | 'squiggle' | 'remove'

type SvgIconConfig = {
  kind: IconKind
  active: {
    fill?: string
    stroke?: string
  }
  inactive: {
    fill?: string
    stroke?: string
  }
}

const indexedIconConfigs: SvgIconConfig[] = [
  {
    kind: 'hex',
    active: { fill: 'rgba(106,154,82,0.35)', stroke: '#6a9a52' },
    inactive: { fill: 'rgba(255,255,255,0.06)', stroke: '#666' },
  },
  {
    kind: 'image',
    active: { fill: '#6a9a52' },
    inactive: { fill: '#666' },
  },
  {
    kind: 'segment',
    active: { fill: '#6a9a52', stroke: '#6a9a52' },
    inactive: { fill: '#666', stroke: '#666' },
  },
  {
    kind: 'squiggle',
    active: { stroke: '#6a9a52' },
    inactive: { stroke: '#666' },
  },
  {
    kind: 'remove',
    active: { stroke: '#c25a4a' },
    inactive: { stroke: '#666' },
  },
]

const toolIconConfigs: Record<string, SvgIconConfig> = Object.fromEntries(
  TOOLS.map((tool, idx) => [tool.id, indexedIconConfigs[idx]]),
)

const brushStore = useBrushStore()
const i18n = useI18nStore()

function selectTool(id: string) {
  brushStore.setTool(id as Tool)
}

function iconConfig(tool: ToolDef): SvgIconConfig {
  return toolIconConfigs[tool.id]
}

function iconColors(tool: ToolDef): SvgIconConfig['active'] {
  const config = iconConfig(tool)
  return brushStore.tool === tool.id ? config.active : config.inactive
}
</script>

<template>
  <div class="absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
    <div class="toolbar-wrap">
      <template v-for="(tool, idx) in TOOLS" :key="tool.id">
        <span v-if="idx === TOOLS.length - 1" class="toolbar-sep" aria-hidden="true" />
        <button
          :title="i18n.t(tool.i18nKey)"
          :aria-pressed="brushStore.tool === tool.id"
          :class="[
            'tool-btn',
            tool.variant === 'danger' ? 'is-danger' : '',
            brushStore.tool === tool.id ? 'is-active' : '',
          ]"
          @click="selectTool(tool.id)"
        >
          <svg class="tool-icon" viewBox="0 0 20 20" aria-hidden="true">
            <polygon
              v-if="iconConfig(tool).kind === 'hex'"
              points="10,2 16,5.5 16,14.5 10,18 4,14.5 4,5.5"
              :fill="iconColors(tool).fill"
              :stroke="iconColors(tool).stroke"
              stroke-width="1.5"
            />
            <path
              v-else-if="iconConfig(tool).kind === 'image'"
              d="M3 15.5h14v-11H3v11Zm2-2.2 3.5-4 2.8 3 1.7-2 2.2 3H5Z"
              :fill="iconColors(tool).fill"
            />
            <g v-else-if="iconConfig(tool).kind === 'segment'">
              <path
                d="M4 15.5 16 4.5"
                :stroke="iconColors(tool).stroke"
                stroke-width="2"
                stroke-linecap="round"
              />
              <circle cx="4" cy="15.5" r="2" :fill="iconColors(tool).fill" />
              <circle cx="16" cy="4.5" r="2" :fill="iconColors(tool).fill" />
            </g>
            <path
              v-else-if="iconConfig(tool).kind === 'squiggle'"
              d="M3.5 12c2.5-5 5 5 7.5 0s5-1 5.5 2"
              fill="none"
              :stroke="iconColors(tool).stroke"
              stroke-width="2"
              stroke-linecap="round"
            />
            <g v-else>
              <circle
                cx="10"
                cy="10"
                r="6"
                fill="none"
                :stroke="iconColors(tool).stroke"
                stroke-width="1.5"
                stroke-dasharray="2 2"
              />
              <path
                d="M6 14 14 6"
                :stroke="iconColors(tool).stroke"
                stroke-width="2"
                stroke-linecap="round"
              />
            </g>
          </svg>
          <span>{{ i18n.t(tool.i18nKey) }}</span>
          <span
            class="indicator"
            :class="[
              tool.variant === 'danger' ? 'indicator-danger' : 'indicator-green',
              brushStore.tool === tool.id ? 'indicator-on' : '',
            ]"
          />
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.toolbar-wrap {
  display: flex;
  align-items: center;
  gap: 2px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.72);
  padding: 6px 8px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.tool-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 52px;
  padding: 6px 10px 5px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #888;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}

.tool-btn:hover:not(.is-active) {
  color: #ddd;
  background: rgba(255, 255, 255, 0.04);
}

.tool-btn.is-active {
  color: #fff;
  background: rgba(74, 110, 58, 0.25);
  border-color: rgba(106, 154, 82, 0.3);
}

.tool-btn.is-active.is-danger {
  background: rgba(138, 58, 46, 0.3);
  border-color: rgba(194, 90, 74, 0.3);
}

.tool-icon {
  width: 20px;
  height: 20px;
}

.indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: calc(100% - 12px);
  height: 2px;
  border-radius: 1px;
  transform: translateX(-50%) scaleX(0);
  transition: transform 0.15s;
}

.indicator-green {
  background: #6a9a52;
}

.indicator-danger {
  background: #c25a4a;
}

.indicator-on {
  transform: translateX(-50%) scaleX(1);
}

.toolbar-sep {
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.1);
}
</style>
