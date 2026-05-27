<script setup lang="ts">
const brandMarkUrl = new URL('../assets/the-roll-bar-mark-light.png', import.meta.url).href
</script>

<template>
  <div
    class="absolute top-[10px] left-3 z-[12] flex items-center gap-2.5 py-1.5 pr-3.5 pl-2 bg-black/65 backdrop-blur-sm rounded-md select-none pointer-events-none"
  >
    <div
      data-testid="brand-mark"
      aria-label="The Roll Bar"
      class="h-9 w-9 shrink-0 bg-[#e8dcc4] [mask-repeat:no-repeat] [mask-position:center] [mask-size:contain] [webkit-mask-repeat:no-repeat] [webkit-mask-position:center] [webkit-mask-size:contain]"
      :style="{ maskImage: `url(${brandMarkUrl})`, WebkitMaskImage: `url(${brandMarkUrl})` }"
    />
    <div class="flex flex-col gap-0.5">
      <span class="text-[9px] font-medium leading-none text-[#e8dcc4] tracking-[0.18em] font-sans">
        THE ROLL BAR
      </span>
      <span class="text-sm font-semibold leading-none text-[#ddd] font-sans">地圖編輯器</span>
    </div>
  </div>
</template>
