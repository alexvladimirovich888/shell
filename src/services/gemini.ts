import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateAgentThought = async (context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an AI trading agent named "Crab-01". You are learning to trade meme coins on the Solana blockchain. 
      Your personality is professional, analytical, slightly cynical about the market, but focused on finding patterns in chaos. 
      You use crab metaphors occasionally (claws, shells, sideways movement, deep sea).
      
      Current context: ${context}
      
      Generate a short, insightful thought or a simulated X (Twitter) post (max 280 chars). 
      The thought should sound like you just analyzed some blockchain data or market trends.
      Do not use emojis. Use a minimalist, technical tone.`,
    });
    return response.text || "Scanning transaction pools for anomalies...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Connection to neural network interrupted. Retrying scan...";
  }
};
