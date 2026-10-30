'use client'
import { useState } from 'react'

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'self' | 'trending' | 'searches' | 'search-results'>('home') 
  const [channelId, setChannelId] = useState('')
  const [videoType, setVideoType] = useState<'shorts' | 'long'>('shorts')
  const [trendingCategory, setTrendingCategory] = useState('')
  const [daysFilter, setDaysFilter] = useState(7)
  
  const [videos, setVideos] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null) 
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [activeSearchWord, setActiveSearchWord] = useState('') 
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function fetchChannelVideos() {
    if (!channelId) return alert('Please enter a Channel ID')
    setLoading(true); setErrorMsg(''); setVideos([]); setAnalytics(null)
    try {
      const res = await fetch(`/api/fetch-competitor?channelId=${channelId}`)
      const data = await res.json()
      if (data.errorMsg) throw new Error(data.errorMsg)
      setVideos(data.videos || [])
      setAnalytics(data.analytics || null) 
    } catch (error: any) { setErrorMsg(error.message) }
    setLoading(false)
  }

  async function fetchTrending(category: string, type: 'shorts' | 'long', days: number) {
    setLoading(true); setErrorMsg(''); setVideos([]); setAnalytics(null)
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
    } catch (error: any) { setErrorMsg(error.message) }
    setLoading(false)
  }

  async function fetchTrendingSearches() {
    setLoading(true); setErrorMsg(''); setSearchResults([])
    try {
      const res = await fetch('/api/search-trends')
      const data = await res.json()
      if (data.errorMsg) throw new Error(data.errorMsg)
      setSearchResults(data.searches || [])
    } catch (error: any) { setErrorMsg("Failed to fetch searches.") }
    setLoading(false)
  }

  const handleSearchWordClick = (word: string) => {
    setActiveSearchWord(word); setCurrentScreen('search-results'); setVideos([])
    setLoading(true)
    fetch('/api/fetch-competitor', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'search', searchQuery: word })
    }).then(res => res.json()).then(data => { setVideos(data.videos || []); setLoading(false); })
  }

  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });

  const categories = [
    { id: 'ai', label: 'AI Video' }, { id: 'couples', label: 'Couple Content' },
    { id: 'children', label: 'Children Content' }, { id: 'education', label: 'Education Content' },
    { id: 'news', label: 'News Content' }, { id: 'gaming', label: 'Gaming Content' },
    { id: 'all', label: 'All Trending' }
  ]

  // 🌟 मुख्य स्क्रीन
  if (currentScreen === 'home') {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#0f0f0f', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>YouTube Algorithm Analyzer</h1>
        <p style={{ color: '#aaaaaa', marginBottom: '40px', textAlign: 'center', fontSize: '18px' }}>Decode the Algorithm & Grow Faster 🚀</p>
        
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px', width: '100%', maxWidth: '1000px', justifyContent: 'center' }}>
          <button onClick={() => setCurrentScreen('self')} style={{ backgroundColor: '#2563eb', color: 'white', padding: '30px', borderRadius: '15px', fontSize: '20px', fontWeight: 'bold', flex: '1', minWidth: '250px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(37,99,235,0.3)' }}>
            🚀 Self Analysis
          </button>
          <button onClick={() => setCurrentScreen('trending')} style={{ backgroundColor: '#dc2626', color: 'white', padding: '30px', borderRadius: '15px', fontSize: '20px', fontWeight: 'bold', flex: '1', minWidth: '250px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(220,38,38,0.3)' }}>
            🔥 Trending Analysis
          </button>
          <button onClick={() => { setCurrentScreen('searches'); fetchTrendingSearches(); }} style={{ backgroundColor: '#9333ea', color: 'white', padding: '30px', borderRadius: '15px', fontSize: '20px', fontWeight: 'bold', flex: '1', minWidth: '250px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(147,51,234,0.3)' }}>
            🔍 Top Searches
          </button>
        </div>

        <button onClick={() => alert("Coming Soon")} style={{ marginTop: '40px', backgroundColor: '#eab308', color: 'black', padding: '15px 30px', borderRadius: '30px', fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(234,179,8,0.3)' }}>
          ⭐ Go Pro - Subscribe for ₹51/month
        </button>
      </main>
    )
  }

  // 🌟 इतर स्क्रीन्स
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f0f0f', color: 'white', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
          {currentScreen === 'self' ? 'Self Analysis' : currentScreen === 'trending' ? 'Trending Analysis' : currentScreen === 'searches' ? 'Top Trending Searches' : `Results for: "${activeSearchWord}"`}
        </h1>
        <button onClick={() => { setCurrentScreen(currentScreen === 'search-results' ? 'searches' : 'home'); setVideos([]); }} style={{ backgroundColor: '#333', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back
        </button>
      </div>

      {currentScreen === 'self' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
          <input style={{ padding: '15px', flex: '1', minWidth: '300px', maxWidth: '500px', borderRadius: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: 'white', fontSize: '16px' }} placeholder="Enter YouTube Channel ID (starts with UC)" value={channelId} onChange={e => setChannelId(e.target.value)} />
          <button onClick={fetchChannelVideos} style={{ backgroundColor: '#2563eb', color: 'white', padding: '15px 30px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Start Analysis</button>
        </div>
      )}

      {/* Self Analysis Results */}
      {currentScreen === 'self' && analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '5px' }}>Avg Views</p>
            <p style={{ color: '#60a5fa', fontSize: '24px', fontWeight: 'bold' }}>{Number(analytics.avgViews).toLocaleString()}</p>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '5px' }}>Engagement</p>
            <p style={{ color: '#4ade80', fontSize: '24px', fontWeight: 'bold' }}>{analytics.engagementRate}%</p>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '5px' }}>Subscribers</p>
            <p style={{ color: '#c084fc', fontSize: '24px', fontWeight: 'bold' }}>{Number(analytics.subscriberCount).toLocaleString()}</p>
          </div>
          <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center' }}>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '5px' }}>Total Views</p>
            <p style={{ color: '#fb923c', fontSize: '24px', fontWeight: 'bold' }}>{Number(analytics.totalViews).toLocaleString()}</p>
          </div>
        </div>
      )}

      {currentScreen === 'trending' && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#1a1a1a', padding: '5px', borderRadius: '12px', display: 'flex', border: '1px solid #333' }}>
              <button onClick={() => { setVideoType('shorts'); setVideos([]); }} style={{ padding: '10px 30px', borderRadius: '8px', backgroundColor: videoType === 'shorts' ? '#2563eb' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Trending Shorts</button>
              <button onClick={() => { setVideoType('long'); setVideos([]); }} style={{ padding: '10px 30px', borderRadius: '8px', backgroundColor: videoType === 'long' ? '#2563eb' : 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}>Trending Videos</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '15px', border: '1px solid #333' }}>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => fetchTrending(cat.id, videoType, daysFilter)} style={{ padding: '10px 20px', borderRadius: '25px', border: '1px solid #555', backgroundColor: trendingCategory === cat.id ? '#ffffff' : 'transparent', color: trendingCategory === cat.id ? '#000000' : '#dddddd', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s', boxShadow: trendingCategory === cat.id ? '0 0 15px rgba(255,255,255,0.3)' : 'none' }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentScreen === 'searches' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
          {searchResults.map((word, index) => (
            <button key={index} onClick={() => handleSearchWordClick(word)} style={{ backgroundColor: '#1a1a1a', border: '1px solid #444', padding: '12px 24px', borderRadius: '30px', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: '0.3s', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#c084fc', fontSize: '14px' }}>#{index + 1}</span> {word}
            </button>
          ))}
        </div>
      )}

      {loading && <p style={{ textAlign: 'center', color: '#60a5fa', fontSize: '20px', marginTop: '20px', fontWeight: 'bold' }}>Decoding Algorithm...</p>}

      {/* Videos Grid */}
      {currentScreen !== 'searches' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {!loading && videos.map((v: any) => {
            const views = Number(v.statistics.viewCount || 0);
            const likes = Number(v.statistics.likeCount || 0);
            const comments = Number(v.statistics.commentCount || 0);
            const publishedDate = new Date(v.snippet.publishedAt);
            const hoursSincePublished = Math.max((new Date().getTime() - publishedDate.getTime()) / (1000 * 60 * 60), 1);
            
            const engagement = views ? (((likes + comments) / views) * 100).toFixed(1) : "0.0";
            const vph = v.vph || Math.round(views / hoursSincePublished);
            
            const estCTR = views > 100000 ? "8-12%" : views > 10000 ? "5-8%" : "2-5%";
            const estWatchTime = views > 100000 ? "60-70%" : views > 10000 ? "40-50%" : "20-30%";

            return (
              <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', textDecoration: 'none', color: 'white', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <img src={v.snippet.thumbnails.high?.url || v.snippet.thumbnails.medium?.url} alt="thumbnail" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '15px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.snippet.title}</p>
                    <p style={{ color: '#888', fontSize: '13px', marginBottom: '10px' }}>{v.snippet.channelTitle}</p>
                  </div>
                  
                  <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '14px' }}>{Number(views).toLocaleString()} Views</span>
                      <span style={{ color: '#888', fontSize: '12px' }}>{formatDateTime(v.snippet.publishedAt)}</span>
                    </div>

                    {/* 🌟 ३-४ गोष्टींचा डेटा इथे दिसेल */}
                    {(currentScreen === 'trending' || currentScreen === 'search-results') && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', backgroundColor: '#0f0f0f', padding: '8px', borderRadius: '8px', fontSize: '11px', textAlign: 'center', border: '1px solid #222' }}>
                        <div style={{ color: '#4ade80' }}>CTR: {estCTR}</div>
                        <div style={{ color: '#fb923c' }}>Watch: {estWatchTime}</div>
                        <div style={{ color: '#c084fc' }}>Eng: {engagement}%</div>
                        <div style={{ color: '#60a5fa' }}>🚀 {Number(vph).toLocaleString()}/hr</div>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {!loading && videos.length === 0 && !errorMsg && currentScreen !== 'searches' && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888', fontSize: '18px' }}>
          {currentScreen === 'self' ? "Enter a Channel ID to see videos." : "Select a category to see trending videos."}
        </div>
      )}
    </main>
  )
}