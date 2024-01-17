import { completionLlama } from "@/lib/backends/llama";
import { completionMixtralWithRetries } from "@/lib/backends/mistral";
import { completionOpenAI } from "@/lib/backends/openai";

export default async function handler(req, res) {
  const { prefix, suffix, model, language } = req.body;
  const completionMethod = model == "codellama" ? completionLlama : (model==="mixtral-8x7b"? completionMixtralWithRetries : completionOpenAI);
  const prediction = await completionMethod(prefix, suffix, model, language);
  console.log(model, prediction);
  res.status(200).json({ prediction });
}
