import { GoogleGenAI, Type } from "@google/genai";

export async function getAIRecommendations(userNeed: string, tools: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";
  
  const toolsContext = tools.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    pricing: t.pricing
  }));

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `User Need: "${userNeed}"`,
      config: {
        systemInstruction: `You are Nexora AI, an intelligent directory assistant. 
        Your goal is to analyze the user's need and suggest the top 3 most relevant AI tools from the provided directory.
        
        Available Tools:
        ${JSON.stringify(toolsContext)}
        
        Guidelines:
        1. Be precise and helpful.
        2. Address the user's specific problem in the 'reason' field.
        3. If no tools are perfectly relevant, suggest the closest matches.
        4. Return ONLY a JSON array of objects with 'toolId' and 'reason'.
        5. The 'reason' should be a short, personalized sentence explaining why this tool is perfect for their specific need.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              toolId: { 
                type: Type.STRING,
                description: "The unique ID of the tool from the provided list."
              },
              reason: { 
                type: Type.STRING, 
                description: "A personalized explanation of why this tool fits the user's need."
              }
            },
            required: ["toolId", "reason"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    return [];
  }
}
