'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import VideoGrid from './VideoGrid'
import AdminVideoForm from './AdminVideoForm'
import type { Video, Sport } from '@/lib/types'

export default function AdminDashboard() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [activeSport, setActiveSport] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [videosRes, sportsRes] = await Promise.all([
        fetch('/api/videos'),
        fetch('/api/sports'),
      ])
      if (videosRes.ok) setVideos(await videosRes.json())
      if (sportsRes.ok) setSports(await sportsRes.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin')
  }

  const handleAddSuccess = (video: Video) => {
    setVideos((prev) => [video, ...prev])
    setShowForm(false)
  }

  const handleEditSuccess = (updated: Video) => {
    setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
    setEditingVideo(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id))
      } else {
        alert('Failed to delete video')
      }
    } finally {
      setDeletingId(null)
    }
  }

  const filteredVideos = activeSport
    ? videos.filter((v) => v.sport_slug === activeSport)
    : videos

  const openEdit = (video: Video) => {
    setEditingVideo(video)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 z-40 bg-gray-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <span className="text-xs bg-purple-600/20 text-purple-300 border border-purple-600/30 px-2 py-0.5 rounded-full">
                {videos.length} video{videos.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/board"
                target="_blank"
                className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View board
              </a>
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Video
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-300 transition"
              >
                Log out
              </button>
            </div>
          </div>

          {/* Sport filter tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveSport(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !activeSport
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              All
            </button>
            {sports.map((sport) => (
              <button
                key={sport.slug}
                onClick={() => setActiveSport(sport.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSport === sport.slug
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {sport.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <VideoGrid
            videos={filteredVideos}
            adminControls={(video) => (
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(video)}
                  className="flex-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={deletingId === video.id}
                  className="flex-1 text-xs bg-red-950/50 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-900/50 px-3 py-1.5 rounded-lg transition font-medium disabled:opacity-50"
                >
                  {deletingId === video.id ? '...' : 'Delete'}
                </button>
              </div>
            )}
          />
        )}
      </main>

      {/* Add form */}
      {showForm && (
        <AdminVideoForm
          sports={sports}
          onSuccess={(video) => {
            handleAddSuccess(video)
            if (!sports.find((s) => s.slug === video.sport_slug)) {
              fetchData()
            }
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit form */}
      {editingVideo && (
        <AdminVideoForm
          sports={sports}
          video={editingVideo}
          onSuccess={(video) => {
            handleEditSuccess(video)
            if (!sports.find((s) => s.slug === video.sport_slug)) {
              fetchData()
            }
          }}
          onClose={() => setEditingVideo(null)}
        />
      )}
    </div>
  )
}
