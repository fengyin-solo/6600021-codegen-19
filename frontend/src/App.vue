<template>
  <div class="min-h-screen p-4 flex flex-col gap-4 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-purple-400">盲文翻译与触觉学习器</h1>

    <div class="flex gap-2">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        class="px-4 py-2 rounded text-sm"
        :class="activeTab === t.id ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
        {{ t.label }}
      </button>
    </div>

    <!-- Translate -->
    <div v-if="activeTab === 'translate'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">文本输入</h3>
        <textarea v-model="store.inputText" @input="store.translate()"
          class="w-full h-32 bg-gray-800 rounded p-3 text-white resize-none" placeholder="输入英文文本..." />
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">盲文输出</h3>
        <div class="text-4xl tracking-wider text-purple-300 h-16">{{ store.brailleUnicode }}</div>
        <div class="flex flex-wrap gap-2 mt-3">
          <BrailleCell v-for="(dots, i) in store.brailleOutput" :key="i" :dots="dots" :size="40" />
        </div>
      </div>
    </div>

    <!-- Learn -->
    <div v-if="activeTab === 'learn'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-4">
        <h3 class="text-purple-300 font-bold">猜盲文</h3>
        <div v-if="!store.quizChar">
          <button @click="store.generateQuiz()" class="bg-purple-500 px-6 py-3 rounded-lg text-lg hover:bg-purple-400">
            开始训练
          </button>
        </div>
        <div v-else class="flex flex-col items-center gap-3">
          <div class="text-7xl font-bold text-purple-400">{{ store.quizChar }}</div>
          <div class="text-sm text-gray-400">点击下方 6 点阵选择对应盲文</div>
          <div class="grid grid-cols-2 gap-2 p-4 bg-gray-800 rounded-xl">
            <button v-for="d in 6" :key="d" @click="store.toggleDot(d)"
              class="w-14 h-14 rounded-full border-2 transition-all"
              :class="store.selectedDots.includes(d) ? 'bg-purple-500 border-purple-400 scale-110' : 'bg-gray-700 border-gray-600 hover:border-purple-400'">
              <span class="text-xs">{{ d }}</span>
            </button>
          </div>
          <button @click="store.checkQuizAnswer()" class="bg-purple-500 px-6 py-2 rounded hover:bg-purple-400">确认</button>
        </div>
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <div class="flex justify-between mb-2">
          <h3 class="text-purple-300 font-bold">统计</h3>
          <button @click="store.resetScore()" class="text-red-400 text-xs hover:underline">重置</button>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center mb-3">
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-green-400">{{ store.score.correct }}</div>
            <div class="text-xs text-gray-400">正确</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-red-400">{{ store.score.total - store.score.correct }}</div>
            <div class="text-xs text-gray-400">错误</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-purple-400">{{ store.score.total ? Math.round(store.score.correct / store.score.total * 100) : 0 }}%</div>
            <div class="text-xs text-gray-400">正确率</div>
          </div>
        </div>
        <div class="space-y-1 max-h-48 overflow-y-auto">
          <div v-for="(h, i) in store.history.slice(0, 20)" :key="i"
            class="flex justify-between bg-gray-800 rounded p-2 text-sm"
            :class="h.correct ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
            <span>{{ h.input }}</span><span>{{ h.correct ? '✓' : '✗' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Homework -->
    <div v-if="activeTab === 'homework'" class="flex flex-col gap-4">
      <HomeworkCreator v-if="homeworkStore.phase === 'create'" />
      <HomeworkPractice v-else-if="homeworkStore.phase === 'practice'" />
      <HomeworkResult v-else-if="homeworkStore.phase === 'result'" />

      <div v-else class="flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <h3 class="text-purple-300 font-bold text-lg">家庭作业</h3>
          <button @click="homeworkStore.goCreate()"
            class="bg-purple-500 px-4 py-2 rounded hover:bg-purple-400 text-sm">
            + 布置新作业
          </button>
        </div>

        <div v-if="homeworkStore.tasks.length === 0" class="bg-gray-900 rounded-xl p-8 flex flex-col items-center gap-3">
          <div class="text-5xl">📝</div>
          <div class="text-gray-400">还没有作业，点击上方按钮布置新作业</div>
        </div>

        <div v-else class="space-y-3">
          <div v-for="task in homeworkStore.tasks" :key="task.id"
            class="bg-gray-900 rounded-xl p-4 flex items-center gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-white font-bold">{{ task.title }}</span>
                <span class="text-xs px-2 py-0.5 rounded"
                  :class="task.type === 'charToBraille' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'">
                  {{ task.type === 'charToBraille' ? '字符→盲文' : '盲文→字符' }}
                </span>
                <span v-if="homeworkStore.completedTaskIds.has(task.id)"
                  class="text-xs px-2 py-0.5 rounded bg-green-900 text-green-300">
                  已完成
                </span>
              </div>
              <div class="text-gray-500 text-sm mt-1">
                {{ task.chars.length }} 个字符 · {{ task.questionCount }} 道题 · {{ new Date(task.createdAt).toLocaleDateString('zh-CN') }}
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="homeworkStore.startPractice(task)"
                class="bg-purple-500 px-3 py-1.5 rounded text-sm hover:bg-purple-400">
                开始练习
              </button>
              <button @click="homeworkStore.deleteTask(task.id)"
                class="bg-gray-700 px-3 py-1.5 rounded text-sm hover:bg-red-600 text-gray-300">
                删除
              </button>
            </div>
          </div>
        </div>

        <div v-if="homeworkStore.results.length > 0" class="bg-gray-900 rounded-xl p-4">
          <h4 class="text-gray-400 text-sm mb-3">历史成绩</h4>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div v-for="r in homeworkStore.results.slice(0, 10)" :key="r.taskId + r.completedAt"
              class="flex items-center gap-3 bg-gray-800 rounded p-2 text-sm">
              <span class="font-bold w-12" :class="r.correctCount / r.totalQuestions >= 0.7 ? 'text-green-400' : 'text-red-400'">
                {{ Math.round(r.correctCount / r.totalQuestions * 100) }}%
              </span>
              <span class="text-gray-300 flex-1">{{ r.title }}</span>
              <span class="text-gray-500">{{ r.correctCount }}/{{ r.totalQuestions }}</span>
              <span class="text-gray-600 hidden sm:inline">{{ new Date(r.completedAt).toLocaleDateString('zh-CN') }}</span>
              <button @click="homeworkStore.viewResultDetail(r)"
                class="text-xs px-2 py-1 bg-purple-600 rounded hover:bg-purple-500 text-white">
                详情
              </button>
              <button @click="copyHistoryResult(r)"
                class="text-xs px-2 py-1 bg-blue-600 rounded hover:bg-blue-500 text-white">
                分享
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reference -->
    <div v-if="activeTab === 'ref'" class="bg-gray-900 rounded-xl p-4">
      <h3 class="text-purple-300 font-bold mb-3">盲文速查表</h3>
      <div class="grid grid-cols-6 md:grid-cols-9 gap-3">
        <div v-for="(dots, char) in brailleMap" :key="char" class="flex flex-col items-center">
          <div class="text-xl font-bold text-purple-400">{{ char }}</div>
          <BrailleCell :dots="dots" :size="30" />
          <div class="text-xs text-gray-500">{{ dots.join(',') }}</div>
        </div>
      </div>
    </div>

    <button @click="doExport" class="bg-green-700 px-4 py-2 rounded self-start hover:bg-green-600 text-sm">
      导出翻译文本
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useBrailleStore } from './store/braille'
import { useHomeworkStore } from './store/homework'
import { BRAILLE_MAP } from './utils/braille'
import BrailleCell from './components/BrailleCell.vue'
import HomeworkCreator from './components/HomeworkCreator.vue'
import HomeworkPractice from './components/HomeworkPractice.vue'
import HomeworkResult from './components/HomeworkResult.vue'

const store = useBrailleStore()
const homeworkStore = useHomeworkStore()
const brailleMap = BRAILLE_MAP
const tabs = [
  { id: 'translate', label: '翻译模式' },
  { id: 'learn', label: '训练模式' },
  { id: 'homework', label: '家庭作业' },
  { id: 'ref', label: '速查表' },
]
const activeTab = ref('translate')

watch(activeTab, (tab) => {
  if (tab !== 'homework' && homeworkStore.phase !== 'list') {
    homeworkStore.goBack()
  }
})

function doExport() {
  const text = store.exportPDF()
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'braille-output.txt'
  a.click()
}

async function copyHistoryResult(result: any) {
  const text = homeworkStore.generateShareText(result)
  try {
    await navigator.clipboard.writeText(text)
    alert('作业报告已复制到剪贴板！')
  } catch {
    alert('复制失败，请手动复制')
  }
}
</script>
