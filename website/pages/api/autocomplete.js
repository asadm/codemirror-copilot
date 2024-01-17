import OpenAI from "openai";
import extract from "extract-json-from-string";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function completionMixtral(prefix, suffix, language) {
  const response = await fetch(
    `https://api.fireworks.ai/inference/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}`,
    },
    body: JSON.stringify({
      model: "accounts/fireworks/models/mixtral-8x7b-instruct",
      n: 1,
      messages: [
          {
              role: "user",
              content: "You are a " + (language || "") +" programmer that replaces <FILL_ME> part with the right code. Only output the code that replaces <FILL_ME> part. Do not add any explanation or markdown. Output JSON in this structure: {\"r\": \"...\"}\n```\n" + prefix + "<FILL_ME>" + suffix + "\n```",
          },
      ],
      stop: [
          "<|im_start|>",
          "<|im_end|>",
          "<|endoftext|>"
      ],
      top_p: 1,
      top_k: 40,
      presence_penalty: 0,
      frequency_penalty: 0,
      prompt_truncate_len: 1024,
      context_length_exceeded_behavior: "truncate",
      temperature: 0.9,
      max_tokens: 50
    }),
  });

  const wholeOutput = await response.json();
  const outputJsonRaw = wholeOutput?.choices[0]?.message?.content;
  try {
    return extract(outputJsonRaw)[0].r;
  }
  catch (e) {
    return "";
  }
}

async function completionLlama(prefix, suffix, language){
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDLFARE_ID}/ai/run/@hf/thebloke/codellama-7b-instruct-awq`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "prompt": `You are a ${language?(language + " "):""}programmer. Do not add any explanation or markdown. <PRE>${prefix}<SUF>${suffix}<MID>`, "max_tokens": 30 })
    });
    
    const data = await response.json();
    return data.result.response;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function completionOpenAI(prefix, suffix, model="gpt-3.5-turbo-1106", language){
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a ${language?(language + " "):""}programmer that replaces <FILL_ME> part with the right code. Only output the code that replaces <FILL_ME> part. Do not add any explanation or markdown.`,
      },
      { role: "user", content: `${prefix}<FILL_ME>${suffix}` },
    ],
    model,
  });

  return chatCompletion.choices[0].message.content;
}

export default async function handler(req, res) {
  const { prefix, suffix, model, language } = req.body;
  const completionMethod = model == "codellama" ? completionLlama : (model==="mixtral-8x7b"? completionMixtral : completionOpenAI);
  const prediction = await completionMethod(prefix, suffix, model, language);
  console.log(model, prediction)
  res.status(200).json({ prediction })
}
