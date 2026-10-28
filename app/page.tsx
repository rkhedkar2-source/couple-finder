'use client'
import { useState } from 'react'

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'self' | 'trending'>('home') 
  const [channelId, setChannelId] = useState('')
  const [videoType, setVideoType] = useState<'shorts' | 'long'>('shorts')
  const [trendingCategory, setTrendingCategory] = useState('')
  const [daysFilter, setDaysFilter] = useState(7)
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function fetchChannelVideos() {
    if (!channelId) return alert('Please enter a Channel ID')
    setLoading(true); setErrorMsg(''); setVideos([])
    try {
      const res = await fetch(`/api/fetch-competitor?channelId=${channelId}`)
      const data = await res.json()
      if (data.errorMsg) throw new Error(data.errorMsg)
      setVideos(data.videos || [])
    } catch (error: any) {
      setErrorMsg(error.message)
    }
    setLoading(false)
  }

  async function fetchTrending(category: string, type: 'shorts' | 'long', days: number) {
    setLoading(true); setErrorMsg(''); setVideos([])
    setTrendingCategory(category); setVideoType(type); setDaysFilter(days)
    try {
      const res = await fetch(`/api/fetch-competitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, videoType: type, days: days })
      })
      const data = await res.json()
      if (data.errorMsg) throw new Error(data.errorMsg)
      setVideos(data.videos || [])
    } catch (error: any) {
      setErrorMsg(error.message)
    }
    setLoading(false)
  }

  const categories = [
    { id: 'couples', label: 'Couple Content' },
    { id: 'children', label: 'Children Content' },
    { id: 'education', label: 'Education Content' },
    { id: 'news', label: 'News Content' },
    { id: 'gaming', label: 'Gaming Content' },
    { id: 'all', label: 'All Trending' }
  ]

  if (currentScreen === 'home') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-12 text-center">YouTube Content Analyzer</h1>
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
          <button onClick={() => setCurrentScreen('self')} className="flex-1 bg-blue-600 text-white text-xl font-semibold py-8 rounded-2xl shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1">Self Analysis</button>
          <button onClick={() => setCurrentScreen('trending')} className="flex-1 bg-black text-white text-xl font-semibold py-8 rounded-2xl shadow-lg hover:bg-gray-800 transition transform hover:-translate-y-1">Trending Analysis</button>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 max-w-6xl mx-auto text-black min-h-screen">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">{currentScreen === 'self' ? 'Self Analysis' : 'Trending Analysis'}</h1>
        <button onClick={() => { setCurrentScreen('home'); setVideos([]); setErrorMsg('') }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">← Back to Home</button>
      </div>

      {currentScreen === 'self' && (
        <div className="flex gap-2 mb-8 max-w-2xl mx-auto">
          <input className="border p-3 flex-1 rounded-lg shadow-sm" placeholder="Enter YouTube Channel ID (starts with UC)" value={channelId} onChange={e => setChannelId(e.target.value)} />
          <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold" onClick={fetchChannelVideos} disabled={loading}>{loading ? 'Analyzing...' : 'Start Analysis'}</button>
        </div>
      )}

      {currentScreen === 'trending' && (
        <div className="mb-8">
          <div className="flex justify-center mb-4 bg-blue-50 p-2 rounded-xl max-w-md mx-auto">
            <button onClick={() => { setVideoType('shorts'); setVideos([]); setTrendingCategory('') }} className={`flex-1 py-2 rounded-lg font-bold ${videoType === 'shorts' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>Trending Shorts</button>
            <button onClick={() => { setVideoType('long'); setVideos([]); setTrendingCategory('') }} className={`flex-1 py-2 rounded-lg font-bold ${videoType === 'long' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>Trending Videos</button>
          </div>
          <div className="flex justify-center mb-6">
            <select value={daysFilter} onChange={(e) => { const d = Number(e.target.value); setDaysFilter(d); if(trendingCategory) fetchTrending(trendingCategory, videoType, d); }} className="bg-gray-50 border p-2 rounded-lg">
              <option value={1}>1 Day</option>
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3 justify-center bg-gray-100 p-6 rounded-xl">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => fetchTrending(cat.id, videoType, daysFilter)} className={`px-5 py-2 rounded-full border text-sm font-medium ${trendingCategory === cat.id ? 'bg-black text-white' : 'bg-white text-gray-700'}`}>{cat.label}</button>
            ))}
          </div>
        </div>
      )}

      {errorMsg && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 max-w-3xl mx-auto"><p>{errorMsg}</p></div>}
      {loading && <div className="text-center py-10"><p className="text-lg font-semibold text-gray-600 animate-pulse">Fetching and Analyzing Videos...</p></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && videos.map((v: any) => {
          const avg = videos.reduce((s: any, vid: any) => s + Number(vid.statistics.viewCount), 0) / (videos.length || 1);
          const isExplosive = currentScreen === 'self' && (Number(v.statistics.viewCount) / avg) > 2;
          return (
            <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className={`block bg-white rounded-xl shadow-md overflow-hidden border hover:shadow-xl ${isExplosive ? 'border-red-500 border-2' : 'border-gray-200'}`}>
              <div className="relative">
                <img src={v.snippet.thumbnails.medium.url} alt="thumbnail" className="w-full h-48 object-cover" />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">{new Date(v.snippet.publishedAt).toLocaleDateString()}</div>
              </div>
              <div className="p-4">
                <p className="font-bold text-gray-800 line-clamp-2">{v.snippet.title}</p>
                <p className="text-sm text-gray-500 mt-2">{v.snippet.channelTitle}</p>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm font-semibold text-blue-600">{Number(v.statistics.viewCount).toLocaleString()} Views</p>
                  {isExplosive && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">🔥 Explosive</span>}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </main>
  )
}