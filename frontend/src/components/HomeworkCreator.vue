<template>
  <div class="bg-gray-900 rounded-xl p-4 flex flex-col gap-4">
    <h3 class="text-purple-300 font-bold text-lg">布置新作业</h3>

    <div class="flex flex-col gap-2">
      <label class="text-gray-400 text-sm">作业标题</label>
      <input v-model="title" class="bg-gray-800 rounded p-3 text-white" placeholder="例如：第一课 字母A-J练习" />
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-gray-400 text-sm">练习类型</label>
      <div class="flex gap-2">
        <button @click="type = 'charToBraille'"
          class="flex-1 px-4 py-2 rounded text-sm"
          :class="type === 'charToBraille' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
          字符→盲文
        </button>
        <button @click="type = 'brailleToChar'"
          class="flex-1 px-4 py-2 rounded text-sm"
          :class="type === 'brailleToChar' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
          盲文→字符
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex justify-between items-center">
        <label class="text-gray-400 text-sm">练习字符</label>
        <div class="flex gap-2">
          <button @click="selectPreset('a-j')" class="text-xs px-2 py-1 bg-gray-800 rounded text-purple-300 hover:bg-gray-700">A-J</button>
          <button @click="selectPreset('k-t')" class="text-xs px-2 py-1 bg-gray-800 rounded text-purple-300 hover:bg-gray-700">K-T</button>
          <button @click="selectPreset('u-z')" class="text-xs px-2 py-1 bg-gray-800 rounded text-purple-300 hover:bg-gray-700">U-Z</button>
          <button @click="selectPreset('all')" class="text-xs px-2 py-1 bg-gray-800 rounded text-purple-300 hover:bg-gray-700">A-Z</button>
          <button @click="selectPreset('numbers')" class="text-xs px-2 py-1 bg-gray-800 rounded text-purple-300 hover:bg-gray-700">0-9</button>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 bg-gray-800 rounded p-3">
        <button v-for="c in availableChars" :key="c" @click="toggleChar(c)"
          class="w-9 h-9 rounded text-sm font-bold transition-all"
          :class="chars.includes(c) ? 'bg-purple-500 text-white scale-110' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'">
          {{ c }}
        </button>
      </div>
      <div class="text-xs text-gray-500">已选 {{ chars.length }} 个字符</div>
    </div>

    <div class="flex flex-col gap-2">
      <label class="text-gray-400 text-sm">题目数量</label>
      <div class="flex items-center gap-3">
        <input type="range" v-model.number="questionCount" min="1" max="30"
          class="flex-1 accent-purple-500" />
        <span class="text-purple-300 font-bold w-8 text-center">{{ questionCount }}</span>
      </div>
    </div>

    <div class="flex gap-2">
      <button @click="handleSubmit" :disabled="!canSubmit"
        class="flex-1 bg-purple-500 px-4 py-2 rounded hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed">
        布置作业
      </button>
      <button @click="store.goBack()"
        class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 text-gray-300">
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHomeworkStore } from '../store/homework'
import type { HomeworkType } from '../types'

const store = useHomeworkStore()

const title = ref('')
const type = ref<HomeworkType>('charToBraille')
const chars = ref<string[]>([])
const questionCount = ref(10)

const availableChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')

const canSubmit = computed(() => title.value.trim() !== '' && chars.value.length > 0)

function toggleChar(c: string) {
  const idx = chars.value.indexOf(c)
  if (idx >= 0) chars.value.splice(idx, 1)
  else chars.value.push(c)
}

function selectPreset(preset: string) {
  chars.value = []
  if (preset === 'a-j') chars.value = 'ABCDEFGHIJ'.split('')
  else if (preset === 'k-t') chars.value = 'KLMNOPQRST'.split('')
  else if (preset === 'u-z') chars.value = 'UVWXYZ'.split('')
  else if (preset === 'all') chars.value = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  else if (preset === 'numbers') chars.value = '0123456789'.split('')
}

function handleSubmit() {
  if (!canSubmit.value) return
  store.createTask(title.value.trim(), type.value, [...chars.value], questionCount.value)
  store.goBack()
}
</script>
