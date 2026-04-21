import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "memory.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}), "utf-8");
  }
}

export function getConversation(sessionId) {
  ensureStore();
  const raw = fs.readFileSync(dbPath, "utf-8");
  const db = JSON.parse(raw || "{}");
  return db[sessionId] || [];
}

export function setConversation(sessionId, conversation) {
  ensureStore();
  const raw = fs.readFileSync(dbPath, "utf-8");
  const db = JSON.parse(raw || "{}");
  db[sessionId] = conversation;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
}
