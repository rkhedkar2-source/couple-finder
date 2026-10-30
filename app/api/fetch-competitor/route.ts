import { NextResponse } from 'next/server'

// 1. Self Analysis (Channel Report Card)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    if (!channelId) return NextResponse.json({ errorMsg: 'channelId required' }, { status: 400 })

    const key = process.env.YOUTUBE_API_KEY
    const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&id=${channelId}&key=${key}`)
    const chData = await chRes.json()
    
    if (chData.error) return NextResponse.json({ errorMsg: chData.error.message }, { status: 400 })
    if (!chData.items?.length) return NextResponse.json({ errorMsg: 'Invalid Channel ID' }, { status: 400 })

    const channelStats = chData.items[0].statistics;
    const uploadsId = chData.items[0].contentDetails.relatedPlaylists.uploads
    
    const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=50&key=${key}`)
    const plData = await plRes.json()
    if (!plData.items) return NextResponse.json({ videos: [], analytics: null })

    const videoIds = plData.items.map((i: any) => i.snippet.resourceId.videoId).join(',')
    const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${key}`)
    const vData = await vRes.json()

    let videos = vData.items || []
    
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    
    videos.forEach((v: any) => {
      totalViews += Number(v.statistics.viewCount || 0);
      totalLikes += Number(v.statistics.likeCount || 0);
      totalComments += Number(v.statistics.commentCount || 0);
    });

    const avgViews = videos.length ? (totalViews / videos.length) : 0;
    const engagementRate = totalViews ? (((totalLikes + totalComments) / totalViews) * 100) : 0;
    
    let bestVideo = videos[0];
    videos.forEach((v: any) => {
      if (Number(v.statistics.viewCount) > Number(bestVideo.statistics.viewCount)) {
        bestVideo = v;
      }
    });

    const analytics = {
      avgViews: Math.round(avgViews),
      engagementRate: engagementRate.toFixed(2),
      totalVideos: videos.length,
      subscriberCount: channelStats.subscriberCount || "0",
      totalViews: totalViews,
      bestVideo: bestVideo ? {
        title: bestVideo.snippet.title,
        views: bestVideo.statistics.viewCount,
        id: bestVideo.id
      } : null
    };

    videos.sort((a: any, b: any) => Number(b.statistics.viewCount) - Number(a.statistics.viewCount));

    return NextResponse.json({ videos, analytics })
  } catch (error: any) {
    return NextResponse.json({ errorMsg: error.message }, { status: 500 })
  }
}

// 2. Trending Analysis & Search (Strict AI Filter)
export async function POST(req: Request) {
  try {
    const { category, videoType, days, searchQuery } = await req.json()
    const key = process.env.YOUTUBE_API_KEY
    
    let url = "";
    let query = "";
    let orderBy = "viewCount";

    if (category === 'search' && searchQuery) {
      query = searchQuery;
      orderBy = "relevance"; 
      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=${orderBy}&regionCode=IN&maxResults=50&key=${key}`;
    } else {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - days)
      const publishedAfter = daysAgo.toISOString()
      let ytDuration = videoType === 'shorts' ? 'short' : 'long';

      if (category === 'ai') {
        // 🌟 AI साठी अधिक अचूक शब्द
        query = "ai generated video OR ai animation OR sora ai video OR ai tools"
      } else if (category === 'couples') {
        query = "couple vlog OR husband wife OR couple prank OR couple shorts"
      } else if (category === 'children') {
        query = "bacche cartoon OR hindi rhymes OR balgeet OR kids cartoon hindi"
      } else if (category === 'education') {
        query = "education OR learning hindi OR science facts"
      } else if (category === 'news') {
        query = "news hindi OR breaking news india"
      } else if (category === 'gaming') {
        query = "gaming hindi OR pubg mobile OR minecraft hindi"
      } else if (category === 'entertainment') {
        query = "entertainment hindi OR comedy video OR vlog"
      } else if (category === 'all') {
        query = "trending vlog OR comedy OR prank OR gaming india"
      }

      url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=${orderBy}&publishedAfter=${publishedAfter}&regionCode=IN&videoDuration=${ytDuration}&maxResults=50&key=${key}`;
    }

    const searchRes = await fetch(url)
    const searchData = await searchRes.json()
    
    if (searchData.error) return NextResponse.json({ errorMsg: searchData.error.message }, { status: 400 })
    if (!searchData.items || searchData.items.length === 0) return NextResponse.json({ videos: [] })

    const videoIds = searchData.items.map((i: any) => i.id.videoId).join(',')
    
    const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${key}`)
    const vData = await vRes.json()

    let filteredVideos = vData.items || []

    // 🌟 AI साठी कडक फिल्टर (फक्त खरे AI व्हिडिओ घ्यायचे)
    if (category === 'ai') {
      const aiKeywords = ['ai', 'artificial intelligence', 'generated', 'sora', 'midjourney', 'chatgpt', 'stable diffusion']
      filteredVideos = filteredVideos.filter((v: any) => {
        const title = (v.snippet.title || '').toLowerCase()
        const desc = (v.snippet.description || '').toLowerCase()
        return aiKeywords.some(k => title.includes(k) || desc.includes(k))
      })
    }

    if (category !== 'search' && category !== 'ai') {
      const blacklistedChannels = ['zee', 'colors', 'star', 'sony', 'set india', 'sab tv', 't-series', 'netflix', 'amazon', 'hotstar', 'india got talent']
      const badKeywords = ['song', 'music', 'lyrical', 'audio', 'album', 'movie', 'teaser', 'trailer', 'film', 'episode']
      
      filteredVideos = filteredVideos.filter((v: any) => {
        const title = (v.snippet.title || '').toLowerCase()
        const channel = (v.snippet.channelTitle || '').toLowerCase()
        const text = `${title} ${channel}`
        return !blacklistedChannels.some(b => channel.includes(b)) && !badKeywords.some(k => text.includes(k))
      })
    }

    const now = new Date().getTime();
    filteredVideos = filteredVideos.map((v: any) => {
      const views = Number(v.statistics.viewCount || 0);
      const likes = Number(v.statistics.likeCount || 0);
      const comments = Number(v.statistics.commentCount || 0);
      const publishedAt = new Date(v.snippet.publishedAt).getTime();
      const hoursSincePublished = Math.max((now - publishedAt) / (1000 * 60 * 60), 1);
      
      const vph = Math.round(views / hoursSincePublished);
      const engagement = views ? (((likes + comments) / views) * 100).toFixed(1) : "0.0";

      return { ...v, vph, engagement };
    })

    filteredVideos.sort((a: any, b: any) => Number(b.statistics.viewCount) - Number(a.statistics.viewCount))
    filteredVideos = filteredVideos.slice(0, 20)

    return NextResponse.json({ videos: filteredVideos })

  } catch (error: any) {
    return NextResponse.json({ errorMsg: error.message }, { status: 500 })
  }
}