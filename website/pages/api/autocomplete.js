import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const perplexityOpenai = new OpenAI({
  apiKey: process.env.PERPLEXITY_KEY,
  baseURL: "https://api.perplexity.ai",
});

function removeOverlapPrefix(text, prefix) {
  // Remove overlapping part from the start (prefix)
  let commonPrefixLength = 0;
  for (let i = 0; i < prefix.length; i++) {
      if (text.startsWith(prefix.slice(i))) {
          commonPrefixLength = prefix.length - i;
          break;
      }
  }
  if (commonPrefixLength > 0 || prefix === "") {
      text = text.slice(commonPrefixLength);
  }
  return text;
}

async function completionCodeLlama(prefix, suffix, model, language){
  const chatCompletion = await perplexityOpenai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a ${language?(language + " "):""}programmer that replaces <FILL_ME> part with the right code. Only output the code that replaces <FILL_ME> part. Do not add any explanation or markdown.`,
      },
      { role: "user", content: `${prefix}<FILL_ME>${suffix}` },
    ],
    model,
  });


  return removeOverlapPrefix(chatCompletion.choices[0].message.content, prefix);
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
  const completionMethod = model.startsWith("codellama") ? completionCodeLlama : completionOpenAI;
  const prediction = await completionMethod(prefix, suffix, model, language);
  console.log(model, prediction)
  res.status(200).json({ prediction })
}
