'use client'

// @ts-nocheck
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
// Icons removed along with top bar

interface QuestionItem {
  id: string
  question: string
}

export default function TopicQuestionsPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const topicId = params?.id

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!topicId) return

    // Load saved selections
    try {
      const saved = localStorage.getItem(`topic-questions-${topicId}`)
      if (saved) setSelected(new Set(JSON.parse(saved)))
    } catch {}

    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/topics/${topicId}/questions`)
        if (res.ok) {
          const data = await res.json()
          setQuestions((data?.questions || []).map((q: any) => ({ id: q.id, question: q.question })))
        } else {
          setQuestions([])
        }
      } catch (e) {
        console.error('Failed to load questions', e)
        setQuestions([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [topicId])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const onNext = () => {
    try {
      localStorage.setItem(`topic-questions-${topicId}` , JSON.stringify(Array.from(selected)))
    } catch {}
    router.push(`/topic/${topicId}/subtopics`)
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      {/* Content */}
      <main className="flex-1 px-4 pt-5 pb-28 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Why do you want to learn?</h1>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.length === 0 && (
              <div className="text-gray-600 bg-white rounded-lg p-4 border border-gray-200">No questions available.</div>
            )}
            {questions.map(q => (
              <label key={q.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  checked={selected.has(q.id)}
                  onChange={() => toggle(q.id)}
                />
                <span className="text-gray-900 font-medium">{q.question}</span>
              </label>
            ))}
          </div>
        )}
      </main>

      {/* Bottom CTA */}
      <div className="px-4 py-4 sticky bottom-0 bg-amber-50">
        <button
          onClick={onNext}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-[0_8px_0_#0f6a2a] active:translate-y-[2px] active:shadow-[0_6px_0_#0f6a2a]"
        >
          Next
        </button>
      </div>
    </div>
  )
}
