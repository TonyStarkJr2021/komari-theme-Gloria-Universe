export const GLORIA_PRIORITY_TRACKS = [
  '多远都要在一起',
  '再见',
  '新的心跳',
  'GLORIA',
  '来自天堂的魔鬼',
  '光年之外',
  '于是',
  '单行的轨道',
  '查克靠近',
  '你不是第一个离开的人',
  '冰河时代',
  'FIND YOU',
  '夜的尽头',
  '天空没有极限',
  '让世界暂停一分钟',
  '很久以后',
  '好想好想你',
  '句号',
  '泡沫',
  'Where Did U Go',
] as const

export const GLORIA_TRACKS = [
  '光年之外',
  '泡沫',
  '倒数',
  '来自天堂的魔鬼',
  '句号',
  '新的心跳',
  '再见',
  '多远都要在一起',
  'A.I.N.Y.',
  '睡公主',
  'Where Did U Go',
  '回忆的沙漏',
  '我的秘密',
  '后会无期',
  '画',
  '桃花诺',
  '差不多姑娘',
  '摩天动物园',
  '透明',
  '很久以后',
  'Fly Away',
  'Walk on Water',
  '萤火',
  '灰狼',
  '依然睡公主',
  '平凡天使',
  '超能力',
  '孤独',
  '两个你',
  '倒流时间',
  '无双的王者',
  '万国觉醒',
  '平行世界',
  '启示录',
  'GLORIA',
  'HELL',
  '老人与海',
  '让世界暂停一分钟',
  '你不是第一个离开的人',
  '不想回家',
  '受难曲',
  '冰河时代',
  '少年与海',
  '离心力',
  '天空没有极限',
  '夜的尽头',
  '只有我和你的地方',
  'FIND YOU',
  '一路逆风',
  '单行的轨道',
  '盲点',
  '瞬间',
  '于是',
  '查克靠近',
  '好想好想你',
  '别勉强',
  '多美丽',
  'What Have U Done',
  'Someday I’ll Fly',
  '潜意式的残酷',
  '奇迹',
  '不存在的存在',
  'Amazing Grace',
  'T.I.M.E.',
  '你成为了谁的幸福',
  'Sacrifice',
  'Still Breathing',
] as const

let sessionSeed: number | null = null

function getSessionSeed(): number {
  if (sessionSeed !== null)
    return sessionSeed

  const random = new Uint32Array(1)
  globalThis.crypto?.getRandomValues?.(random)
  sessionSeed = random[0] || Date.now()
  return sessionSeed
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function assignUniqueGloriaTracks(nodeIds: string[]): Map<string, string> {
  const sortedNodeIds = [...new Set(nodeIds)].sort((a, b) => a.localeCompare(b))
  const priorityTracks = new Set<string>(GLORIA_PRIORITY_TRACKS)
  const otherTracks = GLORIA_TRACKS.filter(track => !priorityTracks.has(track))
  const random = createRandom(getSessionSeed())

  for (let index = otherTracks.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1))
    const currentTrack = otherTracks[index]!
    otherTracks[index] = otherTracks[target]!
    otherTracks[target] = currentTrack
  }

  const tracks = [...GLORIA_PRIORITY_TRACKS, ...otherTracks]

  return new Map(sortedNodeIds.map((nodeId, index) => [
    nodeId,
    tracks[index % tracks.length]!,
  ]))
}
