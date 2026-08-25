# GLORIA UNIVERSE Theme Design v1.0 / v1.1 实现对照

## 世界观

| 设计概念             | 当前实现                                      |
| -------------------- | --------------------------------------------- |
| VPS 节点 = 星辰      | 节点卡片使用 `STARLIGHT ON` / `STAR SLEEPING` |
| CPU = 舞台核心功率   | 总览 `CORE POWER`，卡片显示“核心”             |
| 内存 = 水晶记忆      | 总览 `CRYSTAL MEMORY`，卡片显示“水晶记忆”     |
| 磁盘 = 星库          | 总览 `STAR VAULT`，卡片显示“星库”             |
| 网络 = 能量流        | 总览 `ENERGY IN/OUT`，卡片显示“能量”          |
| 邓紫棋 = Gloria Core | 原地球区域替换为原创紫晶核心                  |

## 色板

```css
--space: #050816;
--gloria: #9b5cff;
--diamond: #57d6ff;
--rose: #ff7ac8;
--gold: #ffd77a;
```

## 素材

| 素材         | 文件                                       | 形式                 |
| ------------ | ------------------------------------------ | -------------------- |
| 舞台深空背景 | `public/images/default-background-v2.webp` | 原创 WebP，1920×1080 |
| Gloria Core  | `public/images/gloria/gloria-core.webp`    | 原创透明 WebP        |
| Crystal G    | `public/images/gloria/crystal-g.svg`       | 原创 SVG             |
| 轨道与光晕   | `src/components/GloriaCore.vue`            | CSS 动画             |
| 星尘层       | `src/components/Background.vue`            | CSS 渐变动画         |

## 动效

- Gloria Core 自转：30 秒/圈
- 悬浮：8 秒
- 呼吸光：5 秒
- 背景星尘漂移：36 秒
- 在线星标脉冲：2.8 秒
- 系统设置或浏览器请求减弱动态时自动停用主要动画

## 粉丝元素

- 首页品牌：`I AM GLORIA · DIGITAL UNIVERSE`
- Gloria Core 状态：`STABLE` / `MONITORING`
- 节点按地区映射歌曲标签，包括《光年之外》《泡沫》《启示录》《倒数》《句号》《新的心跳》等
- 后台设置 `fanLabelsEnabled` 可关闭歌曲彩蛋

## 性能策略

- 取消首页 WebGL 地球渲染，核心为一张压缩透明 WebP + CSS
- 背景压缩至约 100 KB，核心约 318 KB
- 保留基础主题的大量节点延迟挂载、列表虚拟化和实时数据层
- 不使用视频、Lottie 或额外字体包，降低长期监控页面资源占用
