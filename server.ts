import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

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
      // Define a 3-second timeout for the API call
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

async function startServer() {
  const app = express();
  let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Parse JSON bodies
  app.use(express.json());

  // Contact spam validation route
  app.post("/api/validate", async (req: express.Request, res: express.Response) => {
    try {
      const { firstName, lastName, message, phone } = req.body;
      
      if (!firstName || !lastName || !message) {
        return res.status(400).json({ isValid: false, reason: "Campos obrigatórios ausentes." });
      }

      const result = await validateWithGemini({ firstName, lastName, message, phone });
      return res.json(result);
    } catch (error) {
      console.error("Error in /api/validate endpoint:", error);
      return res.json({ isValid: true });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  function listen(p: number) {
    const server = app.listen(p, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${p}`);
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`Port ${p} is already in use. Trying port ${p + 1}...`);
        listen(p + 1);
      } else {
        console.error("Server error:", err);
      }
    });
  }

  listen(port);
}

startServer();
