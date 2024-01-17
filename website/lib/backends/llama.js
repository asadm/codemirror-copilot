
export async function completionLlama(prefix, suffix, language){
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