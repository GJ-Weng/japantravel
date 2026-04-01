import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const groqKey = Deno.env.get('GROQ_API_KEY')
  if (!groqKey) return new Response(JSON.stringify({ error: 'No GROQ_API_KEY' }), { status: 500, headers: CORS })

  const { imageBase64, mimeType } = await req.json()
  const imageUrl = `data:${mimeType};base64,${imageBase64}`

  const prompt = '你是收據辨識專家。分析這張日文收據，只回傳JSON不含markdown：{"shop_name_ja":"店名日文","shop_name_zh":"店名中文","total_amount":合計金額整數,"category":"餐飲","payment_method":null,"items":[{"name_ja":"品項日文","name_zh":"品項中文","price":價格整數,"qty":數量整數}],"date":"YYYY-MM-DD或null"}'

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: imageUrl } },
        { type: 'text', text: prompt }
      ]}],
      max_tokens: 1024,
      temperature: 0.1
    })
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { ...CORS, 'Content-Type': 'application/json' }
  })
})
