const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || 'fake-key');

async function getCategorySuggestion(description, currentIssueType) {
  if (!process.env.GOOGLE_API_KEY) {
    return null;
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
    
    const prompt = `You are a civic issue classifier.
The user is reporting an issue.
Description: "${description}"
User's selected category: "${currentIssueType}"

Available categories:
- Roads & potholes
- Streetlight
- Waste management
- Water & drainage

Analyze the description and suggest the most appropriate category from the list above. Return the output as JSON with exactly these keys:
- "suggestedCategory": (String) The best matching category.
- "confidence": (Number) A confidence score between 0 and 100.
- "shortReason": (String) A very short 1-sentence reason.

Example:
{"suggestedCategory": "Roads & potholes", "confidence": 96, "shortReason": "Mentions a pothole and a road location."}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null; // Graceful fallback
  }
}

module.exports = { getCategorySuggestion };
