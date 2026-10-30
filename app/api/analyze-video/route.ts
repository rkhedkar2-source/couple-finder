import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: Request) {
  try {
    const { title, description, category } = await req.json()
    
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) {
      console.error("MISSING DEEPSEEK API KEY IN .env.local");
      return NextResponse.json({ errorMsg: "Missing Key" }, { status: 500 });
    }

    const deepseek = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: key,
    })

    const prompt = `You are an expert YouTube Content Coach. 
    A creator is analyzing this trending video to learn how to make their own viral video.
    
    Video Title: "${title}"
    Category: "${category || 'General'}"

    Return a JSON object with exactly this structure:
    {
      "whyViral": "A 2-sentence explanation in Marathi explaining why this video went viral.",
      "keywords": ["#keyword1", "#keyword2", "#keyword3", "#keyword4"]
    }`

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat", 
      messages: [
        { role: "system", content: "You must output only valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }, 
      max_tokens: 500,
    })

    const resultText = completion.choices[0]?.message?.content
    if (!resultText) throw new Error("No response from AI")
    
    const parsedData = JSON.parse(resultText)
    return NextResponse.json(parsedData)

  } catch (error: any) {
    console.error("DEEPSEEK ERROR:", error.message) // CMD मध्ये खरं कारण दिसेल
    
    // फॉलबॅक (जर AI फेल झाला तरी ॲप चालू राहील)
    return NextResponse.json({ 
      whyViral: "AI Error: " + error.message, 
      keywords: ["#error", "#check console"]
    }, { status: 200 })
  }
}