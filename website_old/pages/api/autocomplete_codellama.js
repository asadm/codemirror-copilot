// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function completion(prefix, suffix, language){
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDLFARE_ID}/ai/run/@hf/thebloke/codellama-7b-instruct-awq`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "prompt": `<PRE>${prefix}<SUF>${suffix}<MID>` })
    });
    
    const data = await response.json();
    return data.result.response;
  } catch (error) {
    console.error('Error:', error);
  }
}

export default async function handler(req, res) {
  const { prefix, suffix, model, language } = req.body;
  console.log("prefix", prefix)
  console.log("suffix", suffix)
  console.log("model", model)
  console.log("language", language)
  const prediction = await completion(prefix, suffix, model, language);
  console.log(prediction)
  res.status(200).json({ prediction })
}
