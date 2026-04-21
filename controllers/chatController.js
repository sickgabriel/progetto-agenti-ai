import { processUserMessage } from "../services/llm.js";

export async function handleChat(req, res) {
  try {
    const { sessionId, message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "message richiesto" });
    }
    const sid = sessionId || "default";
    const result = await processUserMessage(sid, message);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "errore interno" });
  }
}
