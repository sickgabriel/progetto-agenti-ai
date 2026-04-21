import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { handleChat } from "./controllers/chatController.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const defaultOrigins = ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"];
const envOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultOrigins;

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: false
  })
);
app.use(express.json({ limit: "1mb" }));

app.post("/chat", handleChat);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`server on ${port}`);
});
