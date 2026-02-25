"use client"

// @ts-nocheck
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { BookOpen, CheckCircle2, Clock, FileText, PlayCircle, Sparkles, HelpCircle } from "lucide-react"

interface APICourseResponse {
  course: {
    id: string
    title: string
    description?: string
    thumbnail?: string
    level?: string
    duration?: number
    isCompleted?: boolean
    completedAt?: string | null
    subtopic?: {
      id: string
      title: string
      topic?: {
        id: string
        title: string
        description?: string
        thumbnail?: string
      }
    }
    chapters: Array<{
      id: string
      title: string
      description?: string
      orderIndex: number
      hasQuiz: boolean
      quiz: null | {
        id: string
        title: string
        passingScore: number
        timeLimit: number
      }
    }>
  }
}

export default function CourseChaptersPage() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const courseId = params?.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<APICourseResponse["course"] | null>(null)
  const [quizStatus, setQuizStatus] = useState<Record<string, { passed: boolean; score?: number }>>({})

  useEffect(() => {
    if (!courseId) return

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const headers: HeadersInit = {}
        // Optional auth if token exists
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (token) headers["authorization"] = `Bearer ${token}`

        const res = await fetch(`/api/courses/${courseId}`, { headers })
        if (!res.ok) {
          throw new Error(`Failed to load course (${res.status})`)
        }
        const json: APICourseResponse = await res.json()
        setData(json.course)

        // Reset quiz status each time
        setQuizStatus({})

        if (token && json.course?.chapters?.length) {
          try {
            const statusResponse = await fetch('/api/quiz/check-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                chapterIds: json.course.chapters
                  .filter((chapter) => chapter.quiz)
                  .map((chapter) => chapter.id)
              })
            })

            if (statusResponse.ok) {
              const statusJson = await statusResponse.json()
              setQuizStatus(statusJson.statusMap || {})
            }
          } catch (statusError) {
            console.warn('Unable to load quiz status map', statusError)
          }
        }
      } catch (e: any) {
        console.error("Failed to load course", e)
        setError(e?.message || "Failed to load course")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [courseId])

  const handleStartQuiz = (chapterId: string) => {
    // Navigate to existing quiz route used in dashboard
    router.push(`/quiz/${chapterId}`)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 px-4 pt-5 pb-10 max-w-5xl mx-auto w-full">
        {/* Breadcrumbs */}
        <nav className="mb-4 text-sm">
          <button onClick={() => router.push('/dashboard/user')} className="text-blue-600 hover:text-blue-800">Topics</button>
          {data?.subtopic?.topic?.title && (
            <>
              <span className="mx-2 text-gray-400">/</span>
              <button onClick={() => router.push(`/topic/${data.subtopic!.topic!.id}/subtopics`)} className="text-blue-600 hover:text-blue-800">
                {data.subtopic!.topic!.title}
              </button>
            </>
          )}
          {data?.subtopic?.title && (
            <>
              <span className="mx-2 text-gray-400">/</span>
              <button onClick={() => router.push(`/topic/${data.subtopic!.topic!.id}/subtopics/${data.subtopic!.id}`)} className="text-blue-600 hover:text-blue-800">
                {data.subtopic!.title}
              </button>
            </>
          )}
          {data?.title && (
            <>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{data.title}</span>
            </>
          )}
        </nav>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>
        ) : data ? (
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
                  {data.description && (
                    <p className="text-gray-600 mt-1 max-w-3xl">{data.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                    {data.level && (
                      <span className="inline-flex items-center gap-1"><Sparkles className="w-4 h-4 text-purple-500" /> {data.level}</span>
                    )}
                    {typeof data.duration === 'number' && (
                      <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4 text-blue-500" /> ~{data.duration} min</span>
                    )}
                    {data.isCompleted && (
                      <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4" /> Completed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chapters list */}
            {data.chapters.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.chapters.map((chapter) => (
                  <div key={chapter.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Chapter {chapter.orderIndex}</div>
                          <h3 className="text-lg font-semibold text-gray-900">{chapter.title}</h3>
                          {chapter.description && (
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{chapter.description}</p>
                          )}
                          {quizStatus?.[chapter.id]?.passed && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full mt-2">
                              <CheckCircle2 className="w-3 h-3" />
                              Quiz Passed
                            </span>
                          )}
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-green-600" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>~10 min</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {chapter.quiz && (
                            <button
                              onClick={() => handleStartQuiz(chapter.id)}
                              className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors flex items-center gap-1"
                            >
                              <HelpCircle className="w-4 h-4" />
                              Take Quiz
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/learn/chapter/${chapter.id}`)}
                            className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors flex items-center gap-1"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Start Learning
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Chapters Available</h3>
                <p className="text-gray-600 mb-4">This course does not have any chapters yet.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600">Course not found.</div>
        )}
      </main>
    </div>
  )
}
