<template>
  <div class="bg-gray-900 rounded-xl p-4 flex flex-col gap-4">
    <h3 class="text-purple-300 font-bold text-lg">作业完成！</h3>

    <div v-if="result" class="flex flex-col gap-4">
      <div class="bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-3">
        <div class="text-6xl">
          {{ result.correctCount / result.totalQuestions >= 0.9 ? '🏆' : result.correctCount / result.totalQuestions >= 0.7 ? '🌟' : result.correctCount / result.totalQuestions >= 0.5 ? '👍' : '💪' }}
        </div>
        <div class="text-2xl font-bold"
          :class="accuracyColor">
          {{ accuracy }}%
        </div>
        <div class="text-4xl">{{ starRating }}</div>
        <div class="text-gray-400">{{ result.title }}</div>
      </div>

      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="bg-gray-800 rounded p-3">
          <div class="text-2xl font-bold text-green-400">{{ result.correctCount }}</div>
          <div class="text-xs text-gray-400">正确</div>
        </div>
        <div class="bg-gray-800 rounded p-3">
          <div class="text-2xl font-bold text-red-400">{{ result.totalQuestions - result.correctCount }}</div>
          <div class="text-xs text-gray-400">错误</div>
        </div>
        <div class="bg-gray-800 rounded p-3">
          <div class="text-2xl font-bold text-purple-400">{{ formattedDuration }}</div>
          <div class="text-xs text-gray-400">用时</div>
        </div>
      </div>

      <div class="bg-gray-800 rounded-xl p-3">
        <h4 class="text-gray-400 text-sm mb-2">答题详情</h4>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div v-for="(answer, i) in result.answers" :key="i"
            class="flex items-center gap-3 text-sm p-2 rounded bg-gray-900"
            :class="answer.isCorrect ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
            <span class="font-bold w-6" :class="answer.isCorrect ? 'text-green-400' : 'text-red-400'">
              {{ answer.isCorrect ? '✓' : '✗' }}
            </span>
            <span class="text-gray-400 w-10">第{{ i + 1 }}题</span>
            <div class="flex-1 flex items-center gap-4">
              <template v-if="result.type === 'charToBraille'">
                <div class="flex items-center gap-2">
                  <span class="text-gray-400 text-xs">题目:</span>
                  <span class="text-xl font-bold text-purple-300">{{ questions[i]?.prompt }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-gray-400 text-xs">正确:</span>
                  <BrailleCell :dots="questions[i]?.correctDots || []" :size="24" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-gray-400 text-xs">你的:</span>
                  <BrailleCell :dots="answer.selectedDots" :size="24" />
                </div>
              </template>
              <template v-else>
                <div class="flex items-center gap-2">
                  <span class="text-gray-400 text-xs">题目:</span>
                  <span class="text-2xl text-purple-300 tracking-widest">{{ questions[i]?.prompt }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-gray-400 text-xs">正确:</span>
                  <span class="text-xl font-bold text-green-400">{{ questions[i]?.correctChar }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-gray-400 text-xs">你的:</span>
                  <span class="text-xl font-bold" :class="answer.isCorrect ? 'text-green-400' : 'text-red-400'">
                    {{ answer.selectedChar || '-' }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <button @click="shareAsText"
          class="flex-1 bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 flex items-center justify-center gap-2">
          📋 复制报告
        </button>
        <button @click="shareAsImage"
          class="flex-1 bg-green-600 px-4 py-2 rounded hover:bg-green-500 flex items-center justify-center gap-2">
          🖼 保存图片
        </button>
      </div>

      <div v-if="shareMsg" class="text-sm text-center" :class="shareMsgType === 'success' ? 'text-green-400' : 'text-red-400'">
        {{ shareMsg }}
      </div>

      <div class="flex gap-2">
        <button @click="retryHomework"
          class="flex-1 bg-purple-500 px-4 py-2 rounded hover:bg-purple-400">
          重新练习
        </button>
        <button @click="store.goBack()"
          class="flex-1 bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 text-gray-300">
          返回列表
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHomeworkStore } from '../store/homework'
import BrailleCell from './BrailleCell.vue'

const store = useHomeworkStore()

const result = computed(() => store.currentResult)
const questions = computed(() => store.historyQuestions.length > 0 ? store.historyQuestions : (store.currentResult?.questions || []))
const shareMsg = ref('')
const shareMsgType = ref<'success' | 'error'>('success')

const accuracy = computed(() => {
  if (!result.value) return 0
  return Math.round((result.value.correctCount / result.value.totalQuestions) * 100)
})

const accuracyColor = computed(() => {
  if (accuracy.value >= 90) return 'text-green-400'
  if (accuracy.value >= 70) return 'text-yellow-400'
  if (accuracy.value >= 50) return 'text-orange-400'
  return 'text-red-400'
})

const starRating = computed(() => {
  if (accuracy.value >= 90) return '★★★'
  if (accuracy.value >= 70) return '★★☆'
  if (accuracy.value >= 50) return '★☆☆'
  return '☆☆☆'
})

const formattedDuration = computed(() => {
  if (!result.value) return '0:00'
  const minutes = Math.floor(result.value.durationMs / 60000)
  const seconds = Math.floor((result.value.durationMs % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

async function shareAsText() {
  if (!result.value) return
  const text = store.generateShareText(result.value)
  try {
    await navigator.clipboard.writeText(text)
    shareMsg.value = '报告已复制到剪贴板！'
    shareMsgType.value = 'success'
  } catch {
    shareMsg.value = '复制失败，请手动复制'
    shareMsgType.value = 'error'
  }
  setTimeout(() => { shareMsg.value = '' }, 3000)
}

function shareAsImage() {
  if (!result.value) return
  const dataUrl = store.generateShareImage(result.value)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `homework-result-${Date.now()}.png`
  a.click()
  shareMsg.value = '图片已开始下载！'
  shareMsgType.value = 'success'
  setTimeout(() => { shareMsg.value = '' }, 3000)
}

function retryHomework() {
  if (store.currentTask) {
    store.startPractice(store.currentTask)
  }
}
</script>
