import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { BRAILLE_MAP, dotsToUnicode } from '../utils/braille'
import type {
  HomeworkTask,
  HomeworkQuestion,
  HomeworkAnswer,
  HomeworkResult,
  HomeworkPhase,
  HomeworkType,
} from '../types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export const useHomeworkStore = defineStore('homework', () => {
  const tasks = ref<HomeworkTask[]>([])
  const results = ref<HomeworkResult[]>([])
  const phase = ref<HomeworkPhase>('list')

  const currentTask = ref<HomeworkTask | null>(null)
  const questions = ref<HomeworkQuestion[]>([])
  const answers = ref<HomeworkAnswer[]>([])
  const currentQuestionIndex = ref(0)
  const selectedDots = ref<number[]>([])
  const startTime = ref(0)
  const currentResult = ref<HomeworkResult | null>(null)
  const historyQuestions = ref<HomeworkQuestion[]>([])

  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || null)

  const isLastQuestion = computed(() => currentQuestionIndex.value >= questions.value.length - 1)

  const progress = computed(() => ({
    current: currentQuestionIndex.value + 1,
    total: questions.value.length,
  }))

  const completedTaskIds = computed(() => new Set(results.value.map(r => r.taskId)))

  function createTask(title: string, type: HomeworkType, chars: string[], questionCount: number) {
    const task: HomeworkTask = {
      id: generateId(),
      title,
      type,
      chars,
      questionCount,
      createdAt: Date.now(),
    }
    tasks.value.unshift(task)
    saveToStorage()
  }

  function deleteTask(taskId: string) {
    tasks.value = tasks.value.filter(t => t.id !== taskId)
    results.value = results.value.filter(r => r.taskId !== taskId)
    saveToStorage()
  }

  function startPractice(task: HomeworkTask) {
    currentTask.value = task
    questions.value = generateQuestions(task)
    answers.value = []
    currentQuestionIndex.value = 0
    selectedDots.value = []
    startTime.value = Date.now()
    phase.value = 'practice'
  }

  function generateQuestions(task: HomeworkTask): HomeworkQuestion[] {
    const pool = task.chars.filter(c => BRAILLE_MAP[c])
    if (pool.length === 0) return []

    const result: HomeworkQuestion[] = []
    const shuffled = shuffleArray(pool)

    for (let i = 0; i < task.questionCount; i++) {
      const char = shuffled[i % shuffled.length]
      const dots = BRAILLE_MAP[char] || []

      if (task.type === 'charToBraille') {
        result.push({
          prompt: char,
          promptDots: [],
          correctDots: [...dots],
          correctChar: char,
        })
      } else {
        result.push({
          prompt: dotsToUnicode(dots),
          promptDots: [...dots],
          correctDots: [...dots],
          correctChar: char,
        })
      }
    }

    return shuffleArray(result)
  }

  function toggleDot(dot: number) {
    const idx = selectedDots.value.indexOf(dot)
    if (idx >= 0) selectedDots.value.splice(idx, 1)
    else selectedDots.value.push(dot)
  }

  function submitAnswer() {
    if (!currentQuestion.value) return

    const q = currentQuestion.value
    let isCorrect: boolean

    if (currentTask.value!.type === 'charToBraille') {
      isCorrect =
        JSON.stringify([...selectedDots.value].sort()) ===
        JSON.stringify([...q.correctDots].sort())
    } else {
      isCorrect = false
    }

    answers.value.push({
      questionIndex: currentQuestionIndex.value,
      selectedDots: [...selectedDots.value],
      isCorrect,
    })

    if (navigator.vibrate) {
      navigator.vibrate(isCorrect ? 100 : [100, 50, 100])
    }

    if (isLastQuestion.value) {
      finishPractice()
    } else {
      currentQuestionIndex.value++
      selectedDots.value = []
    }
  }

  function submitBrailleToCharAnswer(char: string) {
    if (!currentQuestion.value) return

    const isCorrect = char === currentQuestion.value.correctChar

    answers.value.push({
      questionIndex: currentQuestionIndex.value,
      selectedDots: currentQuestion.value.correctDots,
      selectedChar: char,
      isCorrect,
    })

    if (navigator.vibrate) {
      navigator.vibrate(isCorrect ? 100 : [100, 50, 100])
    }

    if (isLastQuestion.value) {
      finishPractice()
    } else {
      currentQuestionIndex.value++
      selectedDots.value = []
    }
  }

  function finishPractice() {
    const correctCount = answers.value.filter(a => a.isCorrect).length
    const result: HomeworkResult = {
      taskId: currentTask.value!.id,
      title: currentTask.value!.title,
      type: currentTask.value!.type,
      totalQuestions: questions.value.length,
      correctCount,
      answers: [...answers.value],
      questions: [...questions.value],
      completedAt: Date.now(),
      durationMs: Date.now() - startTime.value,
    }
    results.value.unshift(result)
    currentResult.value = result
    historyQuestions.value = [...questions.value]
    phase.value = 'result'
    saveToStorage()
  }

  function viewResultDetail(result: HomeworkResult) {
    currentResult.value = result
    historyQuestions.value = [...result.questions]
    phase.value = 'result'
  }

  function goBack() {
    phase.value = 'list'
    currentTask.value = null
    currentResult.value = null
    questions.value = []
    answers.value = []
    selectedDots.value = []
  }

  function goCreate() {
    phase.value = 'create'
  }

  function generateShareText(result: HomeworkResult): string {
    const accuracy = Math.round((result.correctCount / result.totalQuestions) * 100)
    const minutes = Math.floor(result.durationMs / 60000)
    const seconds = Math.floor((result.durationMs % 60000) / 1000)
    const typeLabel = result.type === 'charToBraille' ? '字符→盲文' : '盲文→字符'
    const stars = accuracy >= 90 ? '★★★' : accuracy >= 70 ? '★★☆' : accuracy >= 50 ? '★☆☆' : '☆☆☆'

    let text = `📖 盲文学习家庭作业报告\n`
    text += `━━━━━━━━━━━━━━━\n`
    text += `📝 作业：${result.title}\n`
    text += `📋 类型：${typeLabel}\n`
    text += `✅ 正确：${result.correctCount}/${result.totalQuestions}\n`
    text += `🎯 正确率：${accuracy}%\n`
    text += `${stars}\n`
    text += `⏱ 用时：${minutes}分${seconds}秒\n`
    text += `━━━━━━━━━━━━━━━\n`
    text += `📅 ${new Date(result.completedAt).toLocaleString('zh-CN')}`

    return text
  }

  function generateShareImage(result: HomeworkResult): string {
    const accuracy = Math.round((result.correctCount / result.totalQuestions) * 100)
    const minutes = Math.floor(result.durationMs / 60000)
    const seconds = Math.floor((result.durationMs % 60000) / 1000)
    const typeLabel = result.type === 'charToBraille' ? '字符→盲文' : '盲文→字符'
    const stars = accuracy >= 90 ? '★★★' : accuracy >= 70 ? '★★☆' : accuracy >= 50 ? '★☆☆' : '☆☆☆'

    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 500
    const ctx = canvas.getContext('2d')!

    const gradient = ctx.createLinearGradient(0, 0, 600, 500)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 600, 500)

    ctx.fillStyle = '#a855f7'
    ctx.font = 'bold 32px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('📖 盲文学习作业报告', 300, 60)

    ctx.strokeStyle = '#a855f7'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(50, 80)
    ctx.lineTo(550, 80)
    ctx.stroke()

    ctx.fillStyle = '#e5e7eb'
    ctx.font = '24px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`📝 作业：${result.title}`, 60, 130)
    ctx.fillText(`📋 类型：${typeLabel}`, 60, 175)
    ctx.fillText(`✅ 正确：${result.correctCount}/${result.totalQuestions}`, 60, 220)

    ctx.fillStyle = accuracy >= 70 ? '#4ade80' : accuracy >= 50 ? '#fbbf24' : '#f87171'
    ctx.font = 'bold 48px system-ui, sans-serif'
    ctx.fillText(`${accuracy}%`, 60, 290)

    ctx.fillStyle = '#fbbf24'
    ctx.font = '36px system-ui, sans-serif'
    ctx.fillText(stars, 350, 290)

    ctx.fillStyle = '#9ca3af'
    ctx.font = '20px system-ui, sans-serif'
    const timeStr = `⏱ 用时：${minutes}分${seconds}秒`
    ctx.fillText(timeStr, 60, 340)

    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(50, 370)
    ctx.lineTo(550, 370)
    ctx.stroke()

    ctx.fillStyle = '#6b7280'
    ctx.font = '16px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(new Date(result.completedAt).toLocaleString('zh-CN'), 300, 400)

    ctx.fillStyle = '#4b5563'
    ctx.font = '14px system-ui, sans-serif'
    ctx.fillText('盲文翻译与触觉学习器', 300, 470)

    return canvas.toDataURL('image/png')
  }

  function saveToStorage() {
    try {
      localStorage.setItem('homework-tasks', JSON.stringify(tasks.value))
      localStorage.setItem('homework-results', JSON.stringify(results.value))
    } catch {}
  }

  function loadFromStorage() {
    try {
      const savedTasks = localStorage.getItem('homework-tasks')
      const savedResults = localStorage.getItem('homework-results')
      if (savedTasks) tasks.value = JSON.parse(savedTasks)
      if (savedResults) results.value = JSON.parse(savedResults)
    } catch {}
  }

  loadFromStorage()

  return {
    tasks,
    results,
    phase,
    currentTask,
    questions,
    answers,
    currentQuestionIndex,
    selectedDots,
    currentResult,
    historyQuestions,
    currentQuestion,
    isLastQuestion,
    progress,
    completedTaskIds,
    createTask,
    deleteTask,
    startPractice,
    toggleDot,
    submitAnswer,
    submitBrailleToCharAnswer,
    finishPractice,
    goBack,
    goCreate,
    viewResultDetail,
    generateShareText,
    generateShareImage,
  }
})
