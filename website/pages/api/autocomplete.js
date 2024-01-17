import OpenAI from "openai";
import extract from "extract-json-from-string";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function removeOverlapPrefixSuffix(text, prefix, suffix) {
  // Remove overlapping part from the start (prefix)
  let commonPrefixLength = 0;
  for (let i = 0; i < prefix.length; i++) {
      if (text.startsWith(prefix.slice(i))) {
          commonPrefixLength = prefix.length - i;
          break;
      }
  }
  if (commonPrefixLength > 0) {
      text = text.slice(commonPrefixLength);
  }

  // Remove overlapping part from the end (suffix)
  let commonSuffixLength = 0;
  for (let i = 0; i < suffix.length; i++) {
      if (text.endsWith(suffix.substring(0, i + 1))) {
          commonSuffixLength = i + 1;
          break;
      }
  }
  if (commonSuffixLength > 0) {
      text = text.slice(0, -commonSuffixLength);
  }

  return text.trim();
}

async function completionMixtralWithCleanup(prefix, suffix, language){
  const text = await completionMixtral(prefix, suffix, language);
  return removeOverlapPrefixSuffix(text, prefix, suffix);
}

async function completionMixtral(prefix, suffix, language, previousOutput) {
  let messages = [
      {
          role: "user",
          content: "You are a " + (language || "") +" programmer that replaces <FILL_ME> part with the right code. Only output the code that replaces <FILL_ME> part. Do not add any explanation or markdown. ```\n" + prefix + "<FILL_ME>" + suffix + "\n```" + "\nOutput: JSON in this structure: {\"r\": \"...\"}\n",
      },
  ];
  if (previousOutput) {
    messages.push({
      role: "assistant",
      content: previousOutput,
    });
    messages.push({
      role: "user",
      content: "The previous output was not formatted correctly. Please try again. Output should be JSON in this structure: {\"r\": \"...\"}",
    });
  }
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
      messages: messages,
      stop: [
          "<|im_start|>",
          "<|im_end|>",
          "<|endoftext|>"
      ],
      top_p: 1,
      top_k: 30,
      presence_penalty: 0,
      frequency_penalty: 0,
      prompt_truncate_len: 1024,
      context_length_exceeded_behavior: "truncate",
      temperature: 0.8,
      max_tokens: 50
    }),
  });

  const wholeOutput = await response.json();
  const outputJsonRaw = wholeOutput?.choices[0]?.message?.content;
  try {
    return extract(outputJsonRaw)[0].r;
  }
  catch (e) {
    console.log(e, outputJsonRaw);
    if (!previousOutput) {
      return await completionMixtral(prefix, suffix, language, outputJsonRaw);
    }
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
  const completionMethod = model == "codellama" ? completionLlama : (model==="mixtral-8x7b"? completionMixtralWithCleanup : completionOpenAI);
  const prediction = await completionMethod(prefix, suffix, model, language);
  console.log(model, prediction)
  res.status(200).json({ prediction })
}
