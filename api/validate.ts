import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

async function validateWithGemini(payload: { firstName: string; lastName: string; message: string; phone?: string }) {
  if (!ai) {
    console.warn("GEMINI_API_KEY is not defined. Skipping spam validation.");
    return { isValid: true };
  }

  const { firstName, lastName, message, phone } = payload;
  const prompt = `Você é um filtro de segurança inteligente anti-spam e de moderação para o site "ABBA DIGITAL" (Ábaco Brasileiro de Alfabetização Bilíngue).
Analise os seguintes dados enviados no formulário de contato por um usuário:
Nome: ${firstName}
Sobrenome: ${lastName}
Mensagem: ${message}
${phone ? `WhatsApp/Telefone: ${phone}` : ""}

Classifique se o envio é spam (propagandas de produtos/serviços, links maliciosos, textos em idiomas aleatórios sem relação com o projeto, tentativas de invasão, caracteres aleatórios, ou mensagens ofensivas/inadequadas) ou se é uma mensagem de contato legítima (perguntas sobre o projeto, elogios, interesse em parcerias, suporte, etc.).

Responda estritamente no formato JSON abaixo:
{
  "isValid": true ou false (false se for spam/inadequado, true se for legítimo),
  "reason": "Se for inválido/spam, explique brevemente o motivo em português. Se for válido, deixe vazio."
}`;

  const maxRetries = 3;
  let delay = 500; // ms

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 3000)
      );

      const response: any = await Promise.race([apiCall, timeoutPromise]);
      const text = response.text;
      
      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      const result = JSON.parse(text.trim());
      return {
        isValid: typeof result.isValid === 'boolean' ? result.isValid : true,
        reason: result.reason || "Mensagem identificada como spam ou suspeita de publicidade."
      };

    } catch (err: any) {
      console.error(`Gemini API validation attempt ${attempt} failed:`, err.message);
      
      const isTransient = err.message.includes("503") || err.message.includes("Service Unavailable") || err.message.includes("Timeout");
      if (attempt === maxRetries || !isTransient) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  console.warn("Validation failed or timed out. Falling back to pass-through (isValid: true).");
  return { isValid: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, message, phone } = req.body;
    
    if (!firstName || !lastName || !message) {
      return res.status(400).json({ isValid: false, reason: "Campos obrigatórios ausentes." });
    }

    const result = await validateWithGemini({ firstName, lastName, message, phone });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in /api/validate endpoint:", error);
    return res.status(200).json({ isValid: true });
  }
}
