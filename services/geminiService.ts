import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';

// Use a singleton pattern to lazily initialize the AI client.
// This prevents the app from crashing on start if the API key is not set.
let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!ai) {
    // The constructor will throw an error if API_KEY is missing.
    // This will now be caught by the calling function.
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
}

// Function to generate a smart reply for the employee chat
export async function generateChatReply(
  history: Message[],
  employeeName: string,
  picName: string
): Promise<string> {
  try {
    const client = getAiClient(); // Initialize client on first use.

    // Take the last 4 messages for context, or fewer if not available
    const conversationContext = history
      .slice(-4)
      .map(msg => {
        // NOTE: This assumes 'pic-1' is the hardcoded ID for the PIC user.
        const sender = msg.senderId === 'pic-1' ? picName : employeeName;
        return `${sender}: ${msg.text}`;
      })
      .join('\n');

    const prompt = `Anda adalah ${employeeName}, seorang karyawan di SWAPRO. Anda sedang berbicara dengan manajer Anda, ${picName}. Balas pesan terakhir dengan singkat, profesional, dan ramah dalam Bahasa Indonesia.

Konteks percakapan terakhir:
${conversationContext}

Balasan Anda (sebagai ${employeeName}):`;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
        return "Baik, saya akan segera memeriksanya.";
    }
    return text;
  } catch (error) {
    console.error("Error generating AI reply:", error);
    // Provide a more specific error message if the API key is missing.
    if (error instanceof Error && error.message.includes("API key")) {
        return "Gagal terhubung ke layanan AI. Harap hubungi administrator.";
    }
    // Provide a generic fallback response for other errors.
    return "Terima kasih atas informasinya, akan saya tindak lanjuti.";
  }
}