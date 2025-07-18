// netlify/functions/ask-ai.js

exports.handler = async function(event) {
  // Tylko zapytania POST są dozwolone
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!prompt || !apiKey) {
      return { statusCode: 400, body: 'Missing prompt or API key' };
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Google AI API Error:', errorBody);
        return { statusCode: response.status, body: `API Error: ${errorBody}` };
    }

    const data = await response.json();
    
    // Sprawdzenie poprawności struktury odpowiedzi
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return {
            statusCode: 200,
            body: JSON.stringify({ response: data.candidates[0].content.parts[0].text }),
        };
    } else {
        console.error('Unexpected API response structure:', data);
        return { statusCode: 500, body: 'Invalid response structure from AI API.' };
    }

  } catch (error) {
    console.error('Function Error:', error);
    return { statusCode: 500, body: `Internal Server Error: ${error.message}` };
  }
};
