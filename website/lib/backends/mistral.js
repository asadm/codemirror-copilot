
function extractCodeSegments(markdownText) {
  // Regular expression to match code blocks (optionally including a language specifier)
  const codeBlockRegex = /```[a-z]*[\s\S]*?```/g;

  // Find matches for the regex in the provided markdown text
  const matches = markdownText.match(codeBlockRegex);

  if (matches) {
      // Remove the backticks and the optional language specifier, then trim whitespace
      return matches.map(match => match.replace(/```[a-z]*\n?/, '').replace(/```/, '').trim());
  } else {
      // Return an empty array if no matches are found
      return [markdownText];
  }
}
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
  else{
    throw new Error("prefix not found");
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
  else{
    throw new Error("suffix not found");
  }

  return text;
}

async function completionMixtral(prefix, suffix, language, previousOutput) {
  let messages = [
      {
          role: "user",
          content: "You are a " + (language || "") +" programmer that replaces <FILL_ME> part with the right code. ALWAYS INCLUDE PREFIX AND SUFFIX in the completed code.\n Do not format code, leave prefix and suffix as-is, only replace <FILL_ME> part, do not include any code comments. ```\n" + prefix + "<FILL_ME>" + suffix + "\n```" + "\nPut output in markdown\n",
      },
  ];
  if (previousOutput) {
    messages.push({
      role: "assistant",
      content: previousOutput,
    });
    messages.push({
      role: "user",
      content: "The previous output was not formatted correctly. Please try again. Output should be in markdown code block and should include prefix and suffix.",
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
      top_k: 40,
      presence_penalty: 0,
      frequency_penalty: 0,
      prompt_truncate_len: 1024,
      context_length_exceeded_behavior: "truncate",
      temperature: 0.9,
      max_tokens: 150
    }),
  });

  const wholeOutput = await response.json();
  const outputRaw = wholeOutput?.choices[0]?.message?.content;

  try {
    // extract markdown code part
    const codeItself = extractCodeSegments(outputRaw)[0];
    // check if <FILL_ME> is still there
    if (codeItself.includes("<FILL_ME")) {
      throw new Error("fill me still there");
    }
    return removeOverlapPrefixSuffix(codeItself, prefix, suffix);;
  }
  catch (e) {
    if (!previousOutput) {
      return await completionMixtral(prefix, suffix, language, outputRaw);
    }
    return "";
  }
}

export async function completionMixtralWithRetries(prefix, suffix, language, _model, retries=5){
  while(retries-->0){
    const output = await completionMixtral(prefix, suffix, language);
    if (output) return output;
  }
  return "";
}
