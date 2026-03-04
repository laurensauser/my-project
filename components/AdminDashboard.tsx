'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import VideoGrid from './VideoGrid'
import AdminVideoForm from './AdminVideoForm'
import type { Video, Sport } from '@/lib/types'

// ── Sortable sport row ──────────────────────────────────────────────────────

interface SortableSportRowProps {
  sport: Sport
  description: string
  togglingId: string | null
  isDragging: boolean
  onToggle: (id: string, active: boolean) => void
  onDescriptionChange: (id: string, value: string) => void
  onDescriptionBlur: (id: string, value: string) => void
  onDragStart: (id: string) => void
  onDragEnter: (id: string) => void
  onDragEnd: () => void
}

function SortableSportRow({
  sport,
  description,
  togglingId,
  isDragging,
  onToggle,
  onDescriptionChange,
  onDescriptionBlur,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: SortableSportRowProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(sport.id)}
      onDragEnter={() => onDragEnter(sport.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`py-4 last:pb-0 space-y-2 transition-opacity ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 cursor-grab active:cursor-grabbing shrink-0 p-0.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <circle cx="5" cy="4" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="11" cy="4" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="11" cy="12" r="1.5" />
            </svg>
          </span>
          <div>
            <span className="text-sm font-medium text-white">{sport.name}</span>
            <span className="ml-2 text-xs text-gray-500">/{sport.slug}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs ${sport.active ? 'text-green-400' : 'text-gray-500'}`}>
            {sport.active ? 'Visible' : 'Hidden'}
          </span>
          <button
            onClick={() => onToggle(sport.id, !sport.active)}
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
      <input
        type="text"
        value={description}
        onChange={(e) => onDescriptionChange(sport.id, e.target.value)}
        onBlur={(e) => onDescriptionBlur(sport.id, e.target.value)}
        placeholder="Short description shown on the public board (optional)"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
      />
    </div>
  )
}

// ── Main dashboard ──────────────────────────────────────────────────────────

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
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [newestDescription, setNewestDescription] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // Reorder panel state
  const [reorderList, setReorderList] = useState<Video[]>([])
  const [reorderDraggingId, setReorderDraggingId] = useState<string | null>(null)
  const reorderDraggedRef = useRef<string | null>(null)
  const reorderListRef = useRef<Video[]>([])

  // Refs to avoid stale closures in drag handlers
  const draggedIdRef = useRef<string | null>(null)
  const sportsRef = useRef<Sport[]>(sports)
  useEffect(() => { sportsRef.current = sports }, [sports])
  useEffect(() => { reorderListRef.current = reorderList }, [reorderList])

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

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    setDescriptions(Object.fromEntries(sports.map((s) => [s.id, s.description ?? ''])))
  }, [sports])

  // ── Sports drag handlers ─────────────────────────────────────────────────

  const handleDragStart = useCallback((id: string) => {
    draggedIdRef.current = id
    setDraggingId(id)
  }, [])

  const handleDragEnter = useCallback((targetId: string) => {
    const draggedId = draggedIdRef.current
    if (!draggedId || draggedId === targetId) return
    setSports((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === draggedId)
      const newIndex = prev.findIndex((s) => s.id === targetId)
      if (oldIndex === -1 || newIndex === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      return next
    })
  }, [])

  const handleDragEnd = useCallback(async () => {
    draggedIdRef.current = null
    setDraggingId(null)
    await fetch('/api/sports/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: sportsRef.current.map((s) => s.id) }),
    })
  }, [])

  // ── Misc handlers ────────────────────────────────────────────────────────

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

  // ── Derived state ────────────────────────────────────────────────────────

  const activeSportObj =
    activeSport && activeSport !== 'featured'
      ? sports.find((s) => s.slug === activeSport) ?? null
      : null

  const filteredVideos = useMemo(() => {
    if (activeSport === 'featured') {
      const list = videos.filter((v) => v.include_in_featured)
      return [...list].sort((a, b) => {
        const aOrder = a.featured_order ?? null
        const bOrder = b.featured_order ?? null
        if (aOrder !== null && bOrder !== null) return aOrder - bOrder
        if (aOrder !== null) return -1
        if (bOrder !== null) return 1
        return 0
      })
    }
    const list = activeSport
      ? videos.filter((v) => v.sports?.some((s) => s.slug === activeSport))
      : videos
    if (!activeSportObj) return list
    return [...list].sort((a, b) => {
      const aOrder = a.sport_orders?.[activeSportObj.id] ?? null
      const bOrder = b.sport_orders?.[activeSportObj.id] ?? null
      if (aOrder !== null && bOrder !== null) return aOrder - bOrder
      if (aOrder !== null) return -1
      if (bOrder !== null) return 1
      return 0
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSport, activeSportObj?.id, videos])

  // Sync reorder list whenever tab or videos change (but not mid-drag)
  useEffect(() => {
    if (!reorderDraggedRef.current) setReorderList(filteredVideos)
  }, [filteredVideos])

  // ── Reorder panel drag handlers ──────────────────────────────────────────

  const saveVideoOrder = useCallback((reorderedVideos: Video[]) => {
    if (activeSport === 'featured') {
      setVideos((prev) => {
        const orderMap = new Map(reorderedVideos.map((v, i) => [v.id, i + 1]))
        return prev.map((v) => orderMap.has(v.id) ? { ...v, featured_order: orderMap.get(v.id)! } : v)
      })
      reorderedVideos.forEach((video, index) => {
        fetch(`/api/videos/${video.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured_order: index + 1 }),
        })
      })
    } else if (activeSportObj) {
      const sportId = activeSportObj.id
      setVideos((prev) => {
        const orderMap = new Map(reorderedVideos.map((v, i) => [v.id, i + 1]))
        return prev.map((v) =>
          orderMap.has(v.id)
            ? { ...v, sport_orders: { ...v.sport_orders, [sportId]: orderMap.get(v.id)! } }
            : v
        )
      })
      reorderedVideos.forEach((video, index) => {
        fetch(`/api/videos/${video.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sport_id: sportId, display_order: index + 1 }),
        })
      })
    }
  }, [activeSport, activeSportObj])

  const handleReorderDragStart = useCallback((id: string) => {
    reorderDraggedRef.current = id
    setReorderDraggingId(id)
  }, [])

  const handleReorderDragEnter = useCallback((targetId: string) => {
    const draggedId = reorderDraggedRef.current
    if (!draggedId || draggedId === targetId) return
    setReorderList((prev) => {
      const oldIndex = prev.findIndex((v) => v.id === draggedId)
      const newIndex = prev.findIndex((v) => v.id === targetId)
      if (oldIndex === -1 || newIndex === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      return next
    })
  }, [])

  const handleReorderDragEnd = useCallback(() => {
    reorderDraggedRef.current = null
    setReorderDraggingId(null)
    saveVideoOrder(reorderListRef.current)
  }, [saveVideoOrder])

  const showReorderPanel = activeSport === 'featured' || activeSportObj !== null

  // ── Render ───────────────────────────────────────────────────────────────

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
            <button
              onClick={() => setActiveSport('featured')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeSport === 'featured'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Featured
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

            {/* Reorder panel — shown on Featured and sport tabs */}
            {showReorderPanel && reorderList.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-1">Reorder Videos</h2>
                <p className="text-xs text-gray-500 mb-4">Drag to set display order</p>
                <div className="space-y-1">
                  {reorderList.map((video) => {
                    const label = video.title || video.caption?.slice(0, 50) || 'Untitled'
                    return (
                      <div
                        key={video.id}
                        draggable
                        onDragStart={() => handleReorderDragStart(video.id)}
                        onDragEnter={() => handleReorderDragEnter(video.id)}
                        onDragEnd={handleReorderDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800 cursor-grab active:cursor-grabbing select-none transition-opacity ${
                          reorderDraggingId === video.id ? 'opacity-40' : ''
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 16 16">
                          <circle cx="5" cy="4" r="1.5" />
                          <circle cx="5" cy="8" r="1.5" />
                          <circle cx="5" cy="12" r="1.5" />
                          <circle cx="11" cy="4" r="1.5" />
                          <circle cx="11" cy="8" r="1.5" />
                          <circle cx="11" cy="12" r="1.5" />
                        </svg>
                        <span className="text-sm text-gray-200 truncate">{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sports management panel */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-4">Manage Sports</h2>
              <div className="divide-y divide-gray-800">
                {/* Featured — always visible, description only */}
                <div className="py-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-sm font-medium text-white">Featured</span>
                      <span className="ml-2 text-xs text-gray-500">Always visible</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newestDescription}
                    onChange={(e) => setNewestDescription(e.target.value)}
                    onBlur={(e) => handleSaveNewestDescription(e.target.value)}
                    placeholder="Short description shown on the Featured tab (optional)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                  />
                </div>

                {sports.map((sport) => (
                  <SortableSportRow
                    key={sport.id}
                    sport={sport}
                    description={descriptions[sport.id] ?? ''}
                    togglingId={togglingId}
                    isDragging={draggingId === sport.id}
                    onToggle={handleToggleSport}
                    onDescriptionChange={(id, val) =>
                      setDescriptions((prev) => ({ ...prev, [id]: val }))
                    }
                    onDescriptionBlur={handleSaveDescription}
                    onDragStart={handleDragStart}
                    onDragEnter={handleDragEnter}
                    onDragEnd={handleDragEnd}
                  />
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
