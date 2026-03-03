'use client'

import { useState, useEffect } from 'react'
import type { Video, Sport } from '@/lib/types'

interface AdminVideoFormProps {
  sports: Sport[]
  video?: Video | null
  onSuccess: () => void
  onClose: () => void
}

export default function AdminVideoForm({
  sports,
  video,
  onSuccess,
  onClose,
}: AdminVideoFormProps) {
  const isEditing = !!video

  const [formData, setFormData] = useState({
    title: video?.title ?? '',
    tiktok_url: video?.tiktok_url ?? '',
    caption: video?.caption ?? '',
    plays: video?.plays?.toString() ?? '0',
    notes: video?.notes ?? '',
    include_in_featured: video?.include_in_featured ?? false,
  })

  const [selectedSportIds, setSelectedSportIds] = useState<string[]>(
    video?.sports?.map((s) => s.id) ?? []
  )

  const [localSports, setLocalSports] = useState<Sport[]>(sports)

  // If the form mounted before sports finished loading, sync when they arrive
  useEffect(() => {
    if (sports.length > 0 && localSports.length === 0) {
      setLocalSports(sports)
    }
  }, [sports])
  const [showNewSport, setShowNewSport] = useState(false)
  const [newSportName, setNewSportName] = useState('')
  const [creatingSpot, setCreatingSport] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const toggleSport = (id: string) => {
    setSelectedSportIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleCreateSport = async () => {
    if (!newSportName.trim()) return
    setCreatingSport(true)
    setError('')
    try {
      const res = await fetch('/api/sports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSportName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create sport')
      }
      const sport: Sport = await res.json()
      setLocalSports((prev) =>
        [...prev, sport].sort((a, b) => a.name.localeCompare(b.name))
      )
      setSelectedSportIds((prev) => [...prev, sport.id])
      setShowNewSport(false)
      setNewSportName('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create sport')
    } finally {
      setCreatingSport(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSportIds.length === 0) {
      setError('Please select at least one sport')
      return
    }
    setLoading(true)
    setError('')

    try {
      const url = isEditing ? `/api/videos/${video.id}` : '/api/videos'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sport_ids: selectedSportIds,
          plays: parseInt(formData.plays) || 0,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save video')
      }

      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? 'Edit Video' : 'Add Video'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Internal Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Internal Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Cesar catcher tip — for your reference only"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>

          {/* TikTok URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              TikTok URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              required
              value={formData.tiktok_url}
              onChange={(e) => set('tiktok_url', e.target.value)}
              placeholder="https://www.tiktok.com/@username/video/..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
            <p className="text-xs text-gray-600 mt-1">
              Paste the full TikTok URL (e.g. tiktok.com/@user/video/123...) or a short vm.tiktok.com link
            </p>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Caption
            </label>
            <textarea
              value={formData.caption}
              onChange={(e) => set('caption', e.target.value)}
              rows={2}
              placeholder="Auto-fetched from TikTok, or enter manually"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"
            />
          </div>

          {/* Sports — checkboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sports <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              {localSports.map((sport) => (
                <label
                  key={sport.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedSportIds.includes(sport.id)}
                    onChange={() => toggleSport(sport.id)}
                    className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-200 group-hover:text-white transition-colors">
                    {sport.name}
                  </span>
                </label>
              ))}
            </div>

            {showNewSport ? (
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateSport())}
                  placeholder="Sport name (e.g. Tennis)"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 transition"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateSport}
                  disabled={creatingSpot || !newSportName.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                >
                  {creatingSpot ? '...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewSport(false); setNewSportName('') }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-xl text-sm transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewSport(true)}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add new sport
              </button>
            )}
          </div>

          {/* Play count */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Play Count
            </label>
            <input
              type="number"
              min="0"
              value={formData.plays}
              onChange={(e) => set('plays', e.target.value)}
              placeholder="e.g. 1200000"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Personal Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Notes about this video, their style, potential fit..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"
            />
          </div>

          {/* Add to Featured */}
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.include_in_featured}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, include_in_featured: e.target.checked }))
              }
              className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
            />
            <div>
              <span className="text-sm text-gray-200 group-hover:text-white transition-colors">
                Add to Featured page
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                This video will appear on the public Featured tab
              </p>
            </div>
          </label>

          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition"
            >
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Video'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
