'use client'

// @ts-nocheck
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Clock, FileText, Play } from 'lucide-react'

interface TopicPayload {
  topic: {
    id: string
    title: string
    subtopics: {
      id: string
      title: string
      description?: string
      courses: { id: string; title: string; description?: string }[]
    }[]
  }
}

export default function SubtopicCoursesPage() {
  const params = useParams() as { id: string; subtopicId: string }
  const router = useRouter()
  const topicId = params?.id
  const subtopicId = params?.subtopicId

  const [loading, setLoading] = useState(true)
  const [subtopic, setSubtopic] = useState<any>(null)
  const [topicTitle, setTopicTitle] = useState('')

  // Emoji fallback helper for course thumbnails
  const getCourseEmoji = (title?: string) => {
    const t = (title || '').toLowerCase()
    if (t.includes('soil')) return '🪴'
    if (t.includes('crop')) return '🌾'
    if (t.includes('sustain')) return '🌍'
    if (t.includes('organic')) return '🥕'
    if (t.includes('tech') || t.includes('technology')) return '💻'
    if (t.includes('water') || t.includes('irrig')) return '💧'
    if (t.includes('pest')) return '🐛'
    return '🎓'
  }

  useEffect(() => {
    if (!topicId || !subtopicId) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/topics/${topicId}`)
        if (res.ok) {
          const json: TopicPayload = await res.json()
          setTopicTitle(json.topic.title)
          const st = json.topic.subtopics.find(s => s.id === subtopicId)
          setSubtopic(st || null)
        } else {
          setSubtopic(null)
        }
      } catch (e) {
        console.error('Failed to load subtopic', e)
        setSubtopic(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [topicId, subtopicId])

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <main className="flex-1 px-4 pt-5 pb-10 max-w-5xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : subtopic ? (
          <div>
            <nav className="mb-4 text-sm">
              <button onClick={() => router.push('/dashboard/user')} className="text-blue-600 hover:text-blue-800">Topics</button>
              <span className="mx-2 text-gray-400">/</span>
              <button onClick={() => router.push(`/topic/${topicId}/subtopics`)} className="text-blue-600 hover:text-blue-800">
                {topicTitle}
              </button>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{subtopic.title}</span>
            </nav>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">{subtopic.title} Courses</h1>
            <p className="text-gray-600 mb-6">Choose a course to start learning</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subtopic.courses.map((course: any) => (
                <div key={course.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transition-all">
                  {/* Thumbnail / Emoji Fallback */}
                  <div className="h-32 relative">
                    <div className="relative w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      {/* Emoji shown by default; image overlays when valid */}
                      <span className="text-4xl select-none">{getCourseEmoji(course?.title)}</span>
                      {course?.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).remove()
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                    <button
                      onClick={() => router.push(`/course/${course.id}/chapters`)}
                      className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      View Chapters
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600">Subtopic not found.</div>
        )}
      </main>
    </div>
  )
}
