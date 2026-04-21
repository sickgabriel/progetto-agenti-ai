import OpenAI from "openai";
import { getConversation, setConversation } from "./memory.js";
import { calculateEmissions } from "./ecoFreight.js";

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const systemPrompt =
  "Sei l'assistente di Orizon. Il tuo compito è aiutare l'utente a calcolare la CO2 del suo viaggio. Devi estrarre: origine, destinazione, mezzo di trasporto e peso del bagaglio. Se mancano informazioni, chiedile gentilmente. Una volta ottenute tutte, usa il tool 'calculate_emissions' per ottenere il dato reale. Alla fine restituisci un riepilogo chiaro con: Quantità totale di CO2 prodotta e conferma di mezzo di trasporto, peso bagaglio, origine e destinazione.";

const tools = [
  {
    type: "function",
    function: {
      name: "calculate_emissions",
      description:
        "Calcola la CO2 del viaggio con EcoFreight usando origine, destinazione, mezzo e peso bagaglio",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string" },
          destination: { type: "string" },
          transport_mode: {
            type: "string",
            enum: ["train", "plane", "car", "bus", "ship", "bike", "walk", "metro"]
          },
          baggage_kg: { type: "number", minimum: 0 }
        },
        required: ["origin", "destination", "transport_mode", "baggage_kg"],
        additionalProperties: false
      }
    }
  }
];

function mapMemoryToMessages(history) {
  const arr = [];
  for (const m of history) {
    if (!m || !m.role || !m.content) continue;
    arr.push({ role: m.role, content: m.content });
  }
  return arr;
}

function appendMemory(sessionId, role, content) {
  const h = getConversation(sessionId);
  const n = h.concat([{ role, content }]);
  setConversation(sessionId, n);
}

export async function processUserMessage(sessionId, userText) {
  if (!client) {
    const reply = await localFallback(sessionId, userText);
    return reply;
  }
  const history = getConversation(sessionId);
  const messages = [{ role: "system", content: systemPrompt }, ...mapMemoryToMessages(history), { role: "user", content: userText }];

  const first = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages,
    tools,
    tool_choice: "auto",
    temperature: 0.2
  });

  const msg = first.choices?.[0]?.message;
  let toolPayload = null;

  if (msg?.tool_calls && msg.tool_calls.length > 0) {
    const call = msg.tool_calls[0];
    if (call.function?.name === "calculate_emissions") {
      const args = safeParse(call.function?.arguments) || {};
      const result = await calculateEmissions({
        origin: args.origin,
        destination: args.destination,
        transport_mode: args.transport_mode,
        baggage_kg: args.baggage_kg
      });
      toolPayload = result;

      const follow = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          ...messages,
          {
            role: "assistant",
            content: msg.content || null,
            tool_calls: msg.tool_calls
          },
          {
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result)
          }
        ],
        tools,
        tool_choice: "none",
        temperature: 0.2
      });
      const final = follow.choices?.[0]?.message?.content || "";
      appendMemory(sessionId, "user", userText);
      appendMemory(sessionId, "assistant", final);
      return { reply: final, sessionId, emissions: toolPayload };
    }
  }

  const assistantText = msg?.content || "";
  appendMemory(sessionId, "user", userText);
  appendMemory(sessionId, "assistant", assistantText);
  return { reply: assistantText, sessionId, emissions: toolPayload };
}

function safeParse(x) {
  try {
    return JSON.parse(x);
  } catch {
    return null;
  }
}

function findMode(text) {
  const t = text.toLowerCase();
  if (/(treno|train|freccia|italo)/.test(t)) return "train";
  if (/(aereo|volo|plane|flight)/.test(t)) return "plane";
  if (/(auto|macchina|car)/.test(t)) return "car";
  if (/(bus|pullman)/.test(t)) return "bus";
  if (/(nave|traghetto|ship|ferry)/.test(t)) return "ship";
  if (/(metro)/.test(t)) return "metro";
  if (/(bici|bike)/.test(t)) return "bike";
  if (/(piedi|walk)/.test(t)) return "walk";
  return null;
}

function findBaggage(text) {
  const m = text.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*kg/);
  if (m) return Number(String(m[1]).replace(",", "."));
  return null;
}

function findCities(text) {
  const m = text.match(/da\s+([A-Za-zÀ-ÿ'’\s]+?)\s+(?:a|verso)\s+([A-Za-zÀ-ÿ'’\s]+?)(?:\s|$|[.,;])/i);
  if (m) return { origin: m[1].trim(), destination: m[2].trim() };
  const stop = new Set(["da","a","verso","in","con","bagaglio","kg","di","il","la","lo","un","una","uno","e","per","su","del","della","dello"]);
  const modes = new Set(["treno","train","freccia","italo","aereo","volo","plane","flight","auto","macchina","car","bus","pullman","nave","traghetto","ship","ferry","metro","bici","bike","piedi","walk"]);
  const tokens = (text.toLowerCase().match(/[a-zà-ÿ'’]+/g) || []).filter((t) => !stop.has(t) && !modes.has(t));
  if (tokens.length >= 2) {
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    return { origin: cap(tokens[0]), destination: cap(tokens[1]) };
  }
  return { origin: null, destination: null };
}

function extractFields(text) {
  const { origin, destination } = findCities(text);
  const transport_mode = findMode(text);
  const baggage_kg = findBaggage(text);
  return { origin, destination, transport_mode, baggage_kg };
}

function deriveContextFromHistory(history) {
  const ctx = { origin: null, destination: null, transport_mode: null, baggage_kg: null };
  for (const m of history) {
    if (m.role !== "user") continue;
    const e = extractFields(m.content || "");
    ctx.origin = ctx.origin || e.origin;
    ctx.destination = ctx.destination || e.destination;
    ctx.transport_mode = ctx.transport_mode || e.transport_mode;
    ctx.baggage_kg = ctx.baggage_kg ?? e.baggage_kg;
  }
  return ctx;
}

async function localFallback(sessionId, userText) {
  const history = getConversation(sessionId);
  const base = deriveContextFromHistory(history);
  const incoming = extractFields(userText);
  const ctx = {
    origin: incoming.origin || base.origin,
    destination: incoming.destination || base.destination,
    transport_mode: incoming.transport_mode || base.transport_mode,
    baggage_kg: incoming.baggage_kg ?? base.baggage_kg
  };

  const missing = [];
  if (!ctx.origin) missing.push("origine");
  if (!ctx.destination) missing.push("destinazione");
  if (!ctx.transport_mode) missing.push("mezzo di trasporto");
  if (ctx.baggage_kg == null) missing.push("peso del bagaglio");

  if (missing.length > 0) {
    const hints = [];
    if (ctx.origin) hints.push(`Origine attuale: ${ctx.origin}`);
    if (ctx.destination) hints.push(`Destinazione attuale: ${ctx.destination}`);
    if (ctx.transport_mode) hints.push(`Mezzo: ${ctx.transport_mode}`);
    if (ctx.baggage_kg != null) hints.push(`Bagaglio: ${ctx.baggage_kg} kg`);
    const ask =
      (hints.length ? `${hints.join(" • ")}\n` : "") +
      `Mi mancano: ${missing.join(", ")}. Puoi indicarli?`;
    appendMemory(sessionId, "user", userText);
    appendMemory(sessionId, "assistant", ask);
    return { reply: ask, sessionId, emissions: null };
  }

  const result = await calculateEmissions({
    origin: ctx.origin,
    destination: ctx.destination,
    transport_mode: ctx.transport_mode,
    baggage_kg: ctx.baggage_kg
  });
  const co2 = result?.co2_kg ?? "N/D";
  const summary = `Ho calcolato la stima delle emissioni.
- Origine: ${ctx.origin}
- Destinazione: ${ctx.destination}
- Mezzo: ${ctx.transport_mode}
- Bagaglio: ${ctx.baggage_kg} kg
- CO2 totale stimata: ${co2} kg
Se vuoi, posso confrontare mezzi alternativi.`;
  appendMemory(sessionId, "user", userText);
  appendMemory(sessionId, "assistant", summary);
  return { reply: summary, sessionId, emissions: result };
}
