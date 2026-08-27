<script setup lang="ts">
import type { VersionInfo } from '@/utils/api'
import { computed, onMounted, ref } from 'vue'
import { DataTooltip } from '@/components/ui/data-tooltip'
import { getSharedApi } from '@/utils/api'

const api = getSharedApi()

const buildVersion = __BUILD_VERSION__
const buildGitHash = __BUILD_GIT_HASH__

const serverVersion = ref<VersionInfo | null>(null)

onMounted(async () => {
  try {
    serverVersion.value = await api.getVersion()
  }
  catch {
    // 静默失败
  }
})

const formattedServerVersion = computed(() => serverVersion.value?.version ?? '')
</script>

<template>
  <footer class="w-full max-w-[1280px] mx-auto p-4">
    <div class="flex w-full flex-row flex-nowrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <div data-footer-credit="powered" class="flex shrink-0 items-center gap-1 whitespace-nowrap">
        Powered by
        <DataTooltip
          as="span"
          placement="top"
          :content="formattedServerVersion"
        >
          <a
            href="https://github.com/komari-monitor/komari" target="_blank" rel="noopener noreferrer"
            class="transition-opacity hover:opacity-80"
          >
            <span class="font-medium text-foreground">Komari Monitor</span>
          </a>
        </DataTooltip>
      </div>
      <div data-footer-credit="theme" class="flex shrink-0 items-center justify-end gap-1 whitespace-nowrap text-right">
        Theme by
        <DataTooltip
          as="span"
          placement="top"
          :content="`v${buildVersion}\n${buildGitHash}`"
        >
          <a
            href="https://github.com/TonyStarkJr2021" target="_blank" rel="noopener noreferrer"
            class="transition-opacity hover:opacity-80"
          >
            <span class="font-medium text-foreground">TonyStarkJr2021</span>
          </a>
        </DataTooltip>
      </div>
    </div>
  </footer>
</template>
