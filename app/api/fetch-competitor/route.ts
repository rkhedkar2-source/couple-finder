import { NextResponse } from 'next/server'

// 1. Self Analysis (Based on Channel ID)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    if (!channelId) return NextResponse.json({ errorMsg: 'channelId required' }, { status: 400 })

    const key = process.env.YOUTUBE_API_KEY
    const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${key}`)
    const chData = await chRes.json()
    
    if (chData.error) return NextResponse.json({ errorMsg: chData.error.message }, { status: 400 })
    if (!chData.items?.length) return NextResponse.json({ errorMsg: 'Invalid Channel ID' }, { status: 400 })

    const uploadsId = chData.items[0].contentDetails.relatedPlaylists.uploads
    const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=20&key=${key}`)
    const plData = await plRes.json()
    if (!plData.items) return NextResponse.json({ videos: [] })

    const videoIds = plData.items.map((i: any) => i.snippet.resourceId.videoId).join(',')
    const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${key}`)
    const vData = await vRes.json()

    let videos = vData.items || []
    videos.sort((a: any, b: any) => Number(b.statistics.viewCount) - Number(a.statistics.viewCount))

    return NextResponse.json({ videos })
  } catch (error: any) {
    return NextResponse.json({ errorMsg: error.message }, { status: 500 })
  }
}

// 2. Trending Analysis (Shorts vs Long, Days Filter, No Songs, Real Couples)
export async function POST(req: Request) {
  try {
    const { category, videoType, days } = await req.json()
    const key = process.env.YOUTUBE_API_KEY
    
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - days)
    const publishedAfter = daysAgo.toISOString()

    let videoDuration = videoType === 'shorts' ? 'short' : 'long'

    let query = "trending india"
    let categoryId = ""
    
    if (category === 'couples') {
      query = "couple vlog OR couple prank OR husband wife vlog OR couple shorts"
    } else if (category === 'children') {
      query = "kids rhymes OR cartoon OR baby songs hindi"
      categoryId = "1"
    } else if (category === 'education') {
      query = "education OR learning OR tutorial hindi"
      categoryId = "27"
    } else if (category === 'news') {
      query = "news OR breaking news india"
      categoryId = "25"
    } else if (category === 'gaming') {
      query = "gaming OR gameplay OR pubg OR minecraft india"
      categoryId = "20"
    } else if (category === 'all') {
      query = "trending india"
    }

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&order=viewCount&publishedAfter=${publishedAfter}&regionCode=IN&videoDuration=${videoDuration}&maxResults=50&key=${key}`
    )
    const searchData = await searchRes.json()
    
    if (searchData.error) return NextResponse.json({ errorMsg: searchData.error.message }, { status: 400 })
    if (!searchData.items || searchData.items.length === 0) return NextResponse.json({ videos: [] })

    const videoIds = searchData.items.map((i: any) => i.id.videoId).join(',')
    
    const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${key}`)
    const vData = await vRes.json()

    let filteredVideos = vData.items || []

    // Filter by exact duration (Shorts < 1 min, Long > 4 mins)
    filteredVideos = filteredVideos.filter((v: any) => {
      const durationStr = v.contentDetails.duration 
      const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (!match) return true
      const hours = parseInt(match[1] || '0')
      const minutes = parseInt(match[2] || '0')
      const totalMinutes = (hours * 60) + minutes

      if (videoType === 'shorts') return totalMinutes <= 1 
      else return totalMinutes >= 4 
    })

    // Filter by Category
    if (categoryId) {
      filteredVideos = filteredVideos.filter((v: any) => v.snippet.categoryId === categoryId)
    } 

    // Filter out songs and keep real couples content
    if (category === 'couples') {
      const badKeywords = ['song', 'music', 'lyrical', 'lyrics', 'audio', 'album', 'movie', 'teaser', 'trailer', 'film']
      const goodKeywords = ['couple', 'wife', 'husband', 'gf', 'bf', 'girlfriend', 'boyfriend', 'vlog', 'prank', 'love', 'shaadi', 'marriage', 'pyaar']

      filteredVideos = filteredVideos.filter((v: any) => {
        const title = v.snippet.title.toLowerCase()
        const hasBadKeyword = badKeywords.some(k => title.includes(k))
        if (hasBadKeyword) return false
        return goodKeywords.some(k => title.includes(k))
      })
    }

    // Filter by Country (India Only)
    const channelIds = [...new Set(filteredVideos.map((v: any) => v.snippet.channelId))].join(',')
    if (channelIds) {
      const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds}&key=${key}`)
      const chData = await chRes.json()
      
      const indianChannelIds = chData.items
        ?.filter((ch: any) => ch.snippet.country === 'IN')
        .map((ch: any) => ch.id) || []

      filteredVideos = filteredVideos.filter((v: any) => indianChannelIds.includes(v.snippet.channelId))
    }

    // Sort by Views and get Top 20
    filteredVideos.sort((a: any, b: any) => Number(b.statistics.viewCount) - Number(a.statistics.viewCount))
    filteredVideos = filteredVideos.slice(0, 20)

    return NextResponse.json({ videos: filteredVideos })

  } catch (error: any) {
    return NextResponse.json({ errorMsg: error.message }, { status: 500 })
  }
}