export interface BrailleChar {
  char: string
  dots: number[]
  unicode: string
}

export type LearnMode = 'charToBraille' | 'brailleToChar' | 'dictation'

export type HomeworkType = 'charToBraille' | 'brailleToChar'

export interface HomeworkTask {
  id: string
  title: string
  type: HomeworkType
  chars: string[]
  questionCount: number
  createdAt: number
}

export interface HomeworkQuestion {
  prompt: string
  promptDots: number[]
  correctDots: number[]
  correctChar: string
}

export interface HomeworkAnswer {
  questionIndex: number
  selectedDots: number[]
  selectedChar?: string
  isCorrect: boolean
}

export interface HomeworkResult {
  taskId: string
  title: string
  type: HomeworkType
  totalQuestions: number
  correctCount: number
  answers: HomeworkAnswer[]
  questions: HomeworkQuestion[]
  completedAt: number
  durationMs: number
}

export type HomeworkPhase = 'list' | 'create' | 'practice' | 'result'
