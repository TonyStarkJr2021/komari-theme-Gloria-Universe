<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import VisitorInfo from '@/components/VisitorInfo.vue'
import { useVisitorAudit } from '@/composables/useVisitorAudit'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()
const { record: recordVisitorEvent } = useVisitorAudit()

const isScrolled = inject<ReturnType<typeof ref<boolean>>>('isScrolled', ref(false))

const siteFavicon = ref('/images/gloria/crystal-g.svg')

const actionButtons = computed(() => {
  const nextThemeTitle = appStore.isDark ? '切换到星光模式' : '切换到深空模式'
  const themeIcon = appStore.isDark ? 'icon-park-outline:sun-one' : 'icon-park-outline:moon'

  const buttons: Array<{ title: string, icon: string, action: string, pressed?: boolean }> = []

  if (router.currentRoute.value.name === 'home' && appStore.homeToolsEnabled) {
    buttons.push({
      title: appStore.homeAdvancedToolsVisible ? '收起首页工具' : '显示首页工具',
      icon: 'tabler:tools',
      action: 'toggleHomeTools',
      pressed: appStore.homeAdvancedToolsVisible,
    })
  }

  buttons.push({
    title: nextThemeTitle,
    icon: themeIcon,
    action: 'toggleTheme',
  })

  if (!appStore.loading && (appStore.privateFeaturesAllowed || !appStore.hideAdminEntryWhenLoggedOut)) {
    buttons.push({
      title: '后台管理',
      icon: 'icon-park-outline:setting',
      action: 'jumpToSetting',
    })
  }
  return buttons
})

function handleButtonClick(action: string) {
  switch (action) {
    case 'toggleTheme':
      appStore.updateThemeMode()
      void recordVisitorEvent({
        event: 'theme_mode_change',
        path: router.currentRoute.value.path,
        route: String(router.currentRoute.value.name ?? ''),
        target: appStore.themeMode,
      })
      break
    case 'toggleHomeTools':
      appStore.homeAdvancedToolsVisible = !appStore.homeAdvancedToolsVisible
      break
    case 'jumpToSetting':
      void recordVisitorEvent({
        event: 'admin_entry_click',
        path: router.currentRoute.value.path,
        route: String(router.currentRoute.value.name ?? ''),
      })
      location.href = '/admin'
      break
  }
}

function revealGloriaEasterEgg(): void {
  window.dispatchEvent(new CustomEvent('gloria:easter-egg'))
}

const sitename = computed(() => appStore.publicSettings?.sitename || 'Komari Monitor')
</script>

<template>
  <!-- 访客 IP 组件，全局悬浮 -->
  <VisitorInfo v-if="!appStore.loading && appStore.visitorInfoEnabled" />

  <div
    class="gloria-header transition-all duration-200 top-0 sticky z-10 border-b border-transparent"
    :class="isScrolled ? 'gloria-header--scrolled backdrop-blur-lg' : 'bg-transparent'"
  >
    <div class="px-4 flex-between h-14 max-w-[1280px] mx-auto">
      <div class="flex items-center gap-3 cursor-pointer" @click="router.push('/')">
        <button
          type="button"
          class="rounded-full"
          title="点击 Crystal G 唤醒彩蛋"
          aria-label="唤醒 GLORIA UNIVERSE 彩蛋"
          @click.stop="revealGloriaEasterEgg"
        >
          <Avatar class="gloria-brand__mark size-9">
            <AvatarImage :src="siteFavicon" :alt="sitename" />
            <AvatarFallback>{{ sitename.slice(0, 1) }}</AvatarFallback>
          </Avatar>
        </button>
        <div class="gloria-brand__copy">
          <h1 class="sr-only">
            {{ sitename }}
          </h1>
          <span>I AM GLORIA</span>
          <small>{{ sitename }} · DIGITAL UNIVERSE</small>
        </div>
      </div>
      <TooltipProvider :delay-duration="200">
        <div class="flex items-center gap-2">
          <Tooltip v-for="button in actionButtons" :key="button.action">
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon-sm"
                :aria-label="button.title"
                :aria-pressed="button.pressed"
                :class="button.pressed && 'bg-background/70 text-selection'"
                @click="handleButtonClick(button.action)"
              >
                <Icon :icon="button.icon" :width="18" :height="18" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ button.title }}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  </div>
</template>
