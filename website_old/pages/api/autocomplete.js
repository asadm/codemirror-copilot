import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function completion(prefix, suffix, model="gpt-3.5-turbo-1106", language){
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
  const prediction = await completion(prefix, suffix, model, language);
  console.log(prediction)
  res.status(200).json({ prediction })
}
