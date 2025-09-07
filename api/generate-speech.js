export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let priorities;
    
    // Handle both JSON and form-encoded data
    if (req.headers['content-type']?.includes('application/json')) {
      // JSON format
      priorities = req.body.priorities;
    } else {
      // Form-encoded format
      priorities = req.body.priorities;
      // If it's a string, split by comma
      if (typeof priorities === 'string') {
        priorities = priorities.split(',').map(p => p.trim());
      }
    }
    
    // Validate input
    if (!priorities || (Array.isArray(priorities) && priorities.length === 0)) {
      return res.status(400).json({ error: 'No priorities provided' });
    }
    
    // Convert to array if it's not already
    if (!Array.isArray(priorities)) {
      priorities = [priorities];
    }

    // Prepare the prompt
    const prioritiesText = priorities.join('; ');
    const prompt = `You are a speech writer for a mayor who just learned that he needs to get ready to host newly incoming refugees. Draft the first paragraph (about 75 words) of a speech. The mayor wants to emphasize these aspects: ${prioritiesText}. Return a JSON with 'speech' as the sole tag.`;

console.log('About to call OpenAI with prompt:', prompt);
console.log('Priorities text:', prioritiesText);

    
    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.2
      })
    });

    // Right after the OpenAI call, add:
console.log('OpenAI response status:', openaiResponse.status);
if (!openaiResponse.ok) {
  const errorText = await openaiResponse.text();
  console.log('OpenAI error:', errorText);
  throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
}

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const speechContent = data.choices[0].message.content;

    // Try to parse as JSON, fallback to plain text
    let parsedSpeech;
    try {
      const jsonMatch = speechContent.match(/\{.*\}/s);
      if (jsonMatch) {
        parsedSpeech = JSON.parse(jsonMatch[0]);
      } else {
        parsedSpeech = { speech: speechContent };
      }
    } catch (parseError) {
      parsedSpeech = { speech: speechContent };
    }

    // Return the speech
    return res.status(200).json(parsedSpeech);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate speech',
      speech: 'We apologize, but we are unable to generate your speech at this time. Please try again later.'
    });
  }
}
