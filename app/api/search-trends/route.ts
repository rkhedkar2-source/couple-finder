import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // सर्व्हरवरून Google च्या Autosuggest API ला कॉल करत आहोत (CORS एरर येणार नाही)
    const res = await fetch('https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=trending+india', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    const text = await res.text()
    
    // Google चा डेटा JSONP फॉरमॅटमध्ये येतो, तो आपण साफ करून घेतो
    const jsonStart = text.indexOf('[')
    const jsonEnd = text.lastIndexOf(']')
    
    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json({ searches: [] })
    }

    const jsonString = text.substring(jsonStart, jsonEnd + 1)
    const parsedData = JSON.parse(jsonString)
    
    // फक्त सर्च शब्द वेगळे काढा
    const suggestions = parsedData[1].map((item: any) => item[0])

    return NextResponse.json({ searches: suggestions })
  } catch (error: any) {
    return NextResponse.json({ errorMsg: error.message }, { status: 500 })
  }
}