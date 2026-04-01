import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeIssueImage = async (base64Image: string) => {
  try {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    
    const prompt = "Analyze this image of a city infrastructure issue. Provide a JSON response with the following fields: 'category' (one of: pothole, garbage, streetlight, water, sidewalk, traffic_light, vandalism, park_maintenance, drainage, other), 'title' (a short descriptive title), 'description' (a detailed description of the issue), and 'severity' (low, medium, high). If the issue doesn't fit the predefined categories, use 'other' and specify the custom category in the description.";

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(",")[1] || base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const getCityInsights = async (analyticsData: any) => {
  try {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    
    const prompt = `Based on the following city infrastructure analytics, provide 3 key insights and 2 recommendations for the city council. 
    Analytics: ${JSON.stringify(analyticsData)}
    Return the response as a JSON object with 'insights' (array of strings) and 'recommendations' (array of strings).`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    throw error;
  }
};
