'use client'

// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronRight, GraduationCap } from 'lucide-react'

interface TopicResponse {
  topic: {
    id: string
    title: string
    description?: string
    subtopics: {
      id: string
      title: string
      description?: string
      courseCount: number
      courses?: { id: string; title: string; description?: string }[]
    }[]
  }
}

export default function TopicSubtopicsPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const topicId = params?.id

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TopicResponse['topic'] | null>(null)

  useEffect(() => {
    if (!topicId) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/topics/${topicId}`)
        if (res.ok) {
          const json = await res.json()
          setData(json.topic)
        } else {
          setData(null)
        }
      } catch (e) {
        console.error('Failed to load topic', e)
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [topicId])

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <main className="flex-1 px-4 pt-5 pb-10 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : data ? (
          <div>
            <nav className="mb-4 text-sm">
              <button onClick={() => router.push('/dashboard/user')} className="text-blue-600 hover:text-blue-800">Topics</button>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{data.title}</span>
            </nav>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">{data.title} Subtopics</h1>
            <p className="text-gray-600 mb-6">Select a subtopic to view available courses</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.subtopics.map((st) => (
                <button
                  key={st.id}
                  onClick={() => router.push(`/topic/${topicId}/subtopics/${st.id}`)}
                  className="bg-white text-left rounded-lg shadow-sm hover:shadow-md border border-gray-200 p-5 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{st.title}</h3>
                      <p className="text-gray-600 line-clamp-2">{st.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                        <GraduationCap className="w-4 h-4" />
                        <span>{st.courseCount} Courses</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-green-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600">Topic not found.</div>
        )}
      </main>
    </div>
  )
}
