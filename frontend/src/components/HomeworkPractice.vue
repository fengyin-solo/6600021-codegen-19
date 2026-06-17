<template>
  <div class="bg-gray-900 rounded-xl p-4 flex flex-col gap-4">
    <div class="flex justify-between items-center">
      <h3 class="text-purple-300 font-bold text-lg">{{ store.currentTask?.title }}</h3>
      <button @click="store.goBack()" class="text-gray-400 text-sm hover:text-white">← 退出</button>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
        <div class="bg-purple-500 h-full transition-all duration-300"
          :style="{ width: `${(store.progress.current / store.progress.total) * 100}%` }" />
      </div>
      <span class="text-purple-300 text-sm font-bold">{{ store.progress.current }}/{{ store.progress.total }}</span>
    </div>

    <div v-if="store.currentQuestion" class="flex flex-col items-center gap-4">
      <div class="text-sm text-gray-400">
        {{ store.currentTask?.type === 'charToBraille' ? '请选择对应盲文点阵' : '请选择对应的字符' }}
      </div>

      <div class="text-7xl font-bold text-purple-400 min-h-[5rem] flex items-center justify-center">
        <template v-if="store.currentTask?.type === 'charToBraille'">
          {{ store.currentQuestion.prompt }}
        </template>
        <template v-else>
          <span class="text-6xl tracking-widest">{{ store.currentQuestion.prompt }}</span>
        </template>
      </div>

      <div v-if="store.currentTask?.type === 'charToBraille'" class="grid grid-cols-2 gap-3 p-5 bg-gray-800 rounded-xl">
        <button v-for="d in 6" :key="d" @click="store.toggleDot(d)"
          class="w-16 h-16 rounded-full border-2 transition-all flex items-center justify-center"
          :class="store.selectedDots.includes(d) ? 'bg-purple-500 border-purple-400 scale-110' : 'bg-gray-700 border-gray-600 hover:border-purple-400'">
          <span class="text-lg">{{ d }}</span>
        </button>
      </div>

      <div v-else class="flex flex-wrap gap-2 justify-center max-w-md">
        <button v-for="c in candidateChars" :key="c" @click="handleBrailleToCharAnswer(c)"
          class="w-12 h-12 rounded bg-gray-700 text-lg font-bold text-gray-200 hover:bg-purple-500 hover:text-white transition-all">
          {{ c }}
        </button>
      </div>

      <button v-if="store.currentTask?.type === 'charToBraille'" @click="store.submitAnswer()"
        class="bg-purple-500 px-8 py-3 rounded-lg text-lg hover:bg-purple-400 transition-colors">
        确认
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useHomeworkStore } from '../store/homework'
import { BRAILLE_MAP } from '../utils/braille'

const store = useHomeworkStore()

const candidateChars = computed(() => {
  if (!store.currentTask) return []
  const base = [...store.currentTask.chars]
  const allChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  while (base.length < 8) {
    const random = allChars[Math.floor(Math.random() * allChars.length)]
    if (!base.includes(random)) base.push(random)
  }
  return base.sort()
})

function handleBrailleToCharAnswer(char: string) {
  store.submitBrailleToCharAnswer(char)
}
</script>
