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
  const [togglingId, setTogglingId] = useState<string | null>(null)
  // Per-sport description drafts: updated as user types, saved on blur
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [newestDescription, setNewestDescription] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [videosRes, sportsRes, settingsRes] = await Promise.all([
        fetch('/api/videos'),
        fetch('/api/sports'),
        fetch('/api/settings'),
      ])
      if (videosRes.ok) setVideos(await videosRes.json())
      if (sportsRes.ok) setSports(await sportsRes.json())
      if (settingsRes.ok) {
        const s = await settingsRes.json()
        setNewestDescription(s.newest_description ?? '')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Keep description drafts in sync when sports data loads/refreshes
  useEffect(() => {
    setDescriptions(Object.fromEntries(sports.map((s) => [s.id, s.description ?? ''])))
  }, [sports])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin')
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingVideo(null)
    fetchData()
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

  const handleToggleSport = async (id: string, active: boolean) => {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/sports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      if (res.ok) {
        const updated: Sport = await res.json()
        setSports((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      } else {
        alert('Failed to update sport')
      }
    } finally {
      setTogglingId(null)
    }
  }

  const handleSaveNewestDescription = async (value: string) => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newest_description: value }),
    })
    if (res.ok) {
      const data = await res.json()
      setNewestDescription(data.newest_description ?? '')
    }
  }

  const handleSaveDescription = async (id: string, description: string) => {
    const sport = sports.find((s) => s.id === id)
    if (!sport || description === (sport.description ?? '')) return
    const res = await fetch(`/api/sports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    })
    if (res.ok) {
      const updated: Sport = await res.json()
      setSports((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    }
  }

  const filteredVideos = activeSport
    ? videos.filter((v) => v.sports?.some((s) => s.slug === activeSport))
    : videos

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
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <VideoGrid
              videos={filteredVideos}
              adminControls={(video) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingVideo(video)}
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

            {/* Sports management panel */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-4">Manage Sports</h2>
              <div className="divide-y divide-gray-800">
                {/* Newest — always visible, description only */}
                <div className="py-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-sm font-medium text-white">Newest</span>
                      <span className="ml-2 text-xs text-gray-500">Always visible</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newestDescription}
                    onChange={(e) => setNewestDescription(e.target.value)}
                    onBlur={(e) => handleSaveNewestDescription(e.target.value)}
                    placeholder="Short description shown on the Newest tab (optional)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  />
                </div>

                {sports.map((sport) => (
                    <div key={sport.id} className="py-4 last:pb-0 space-y-2">
                      {/* Row 1: name + toggle */}
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-sm font-medium text-white">{sport.name}</span>
                          <span className="ml-2 text-xs text-gray-500">/{sport.slug}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs ${sport.active ? 'text-green-400' : 'text-gray-500'}`}>
                            {sport.active ? 'Visible' : 'Hidden'}
                          </span>
                          <button
                            onClick={() => handleToggleSport(sport.id, !sport.active)}
                            disabled={togglingId === sport.id}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                              sport.active ? 'bg-purple-600' : 'bg-gray-600'
                            }`}
                            aria-label={`${sport.active ? 'Hide' : 'Show'} ${sport.name} on board`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                sport.active ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      {/* Row 2: description input */}
                      <input
                        type="text"
                        value={descriptions[sport.id] ?? ''}
                        onChange={(e) =>
                          setDescriptions((prev) => ({ ...prev, [sport.id]: e.target.value }))
                        }
                        onBlur={(e) => handleSaveDescription(sport.id, e.target.value)}
                        placeholder="Short description shown on the public board (optional)"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add form */}
      {showForm && (
        <AdminVideoForm
          sports={sports}
          onSuccess={handleFormSuccess}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit form */}
      {editingVideo && (
        <AdminVideoForm
          sports={sports}
          video={editingVideo}
          onSuccess={handleFormSuccess}
          onClose={() => setEditingVideo(null)}
        />
      )}
    </div>
  )
}
