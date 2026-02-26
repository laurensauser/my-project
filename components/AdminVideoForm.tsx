'use client'

import { useState } from 'react'
import type { Video, Sport } from '@/lib/types'

interface AdminVideoFormProps {
  sports: Sport[]
  video?: Video | null
  onSuccess: (video: Video) => void
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
    tiktok_url: video?.tiktok_url ?? '',
    caption: video?.caption ?? '',
    sport_name: video?.sport_name ?? '',
    sport_slug: video?.sport_slug ?? '',
    plays: video?.plays?.toString() ?? '0',
    notes: video?.notes ?? '',
  })

  const [localSports, setLocalSports] = useState<Sport[]>(sports)
  const [showNewSport, setShowNewSport] = useState(false)
  const [newSportName, setNewSportName] = useState('')
  const [creatingSpot, setCreatingSport] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === '__new__') {
      setShowNewSport(true)
      set('sport_slug', '')
      set('sport_name', '')
    } else {
      setShowNewSport(false)
      const sport = localSports.find((s) => s.slug === value)
      if (sport) {
        set('sport_slug', sport.slug)
        set('sport_name', sport.name)
      } else {
        set('sport_slug', '')
        set('sport_name', '')
      }
    }
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
      set('sport_name', sport.name)
      set('sport_slug', sport.slug)
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
    if (!formData.sport_slug) {
      setError('Please select or create a sport')
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
          plays: parseInt(formData.plays) || 0,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save video')
      }

      const saved: Video = await res.json()
      onSuccess(saved)
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

          {/* Sport */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Sport <span className="text-red-400">*</span>
            </label>
            <select
              value={showNewSport ? '__new__' : formData.sport_slug}
              onChange={handleSportChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            >
              <option value="">Select a sport...</option>
              {localSports.map((sport) => (
                <option key={sport.slug} value={sport.slug}>
                  {sport.name}
                </option>
              ))}
              <option value="__new__">+ Add new sport...</option>
            </select>

            {showNewSport && (
              <div className="flex gap-2 mt-2">
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
