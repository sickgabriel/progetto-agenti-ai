import { useEffect, useMemo, useRef, useState } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

function Message({ role, content }) {
  const isUser = role === "user";
  return (
    <div
      className="msg"
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        background: isUser ? "linear-gradient(135deg,#1e7a50,#2aa26b)" : "#f7f3ea",
        color: isUser ? "#fff" : "#1f3d2b",
        border: isUser ? "1px solid #1e7a50" : "1px solid #e6e0d3"
      }}
    >
      <div className="msg-role">{isUser ? "Tu" : "Orizon"}</div>
      <div className="msg-content">{content}</div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Ciao, sono Orizon. Descrivi il tuo viaggio e stimerò la CO2." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const sessionId = useMemo(() => {
    const id = localStorage.getItem("orizon_session");
    if (id) return id;
    const n = Math.random().toString(36).slice(2);
    localStorage.setItem("orizon_session", n);
    return n;
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

  async function onSend() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch(`${SERVER_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text })
      });
      const data = await r.json();
      const reply = data?.reply || "Errore";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Si è verificato un errore. Riprova tra poco." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand" style={{display:"flex",gap:12,alignItems:"center"}}>
          <span className="leaf">☘︎</span>
          <span>Orizon</span>
          <a href="/preview.html" style={{marginLeft:12,fontWeight:600,color:"#2aa26b",textDecoration:"none"}}>Anteprima</a>
          <a href="/" style={{marginLeft:8,fontWeight:600,color:"#1f3d2b",textDecoration:"none"}}>Chat</a>
        </div>
      </header>
      <main className="chat">
        <div className="list" ref={listRef}>
          {messages.map((m, i) => (
            <Message key={i} role={m.role} content={m.content} />
          ))}
          {loading && (
            <div className="typing">
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </div>
          )}
        </div>
        <div className="composer">
          <textarea
            className="input"
            placeholder="Es. Voglio andare da Milano a Parigi in treno con 20kg di bagaglio"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={2}
          />
          <button className="send" onClick={onSend} disabled={loading || !input.trim()}>
            Invia
          </button>
        </div>
      </main>
      <footer className="footer">Sostenibile, pulito e orientato alla natura</footer>
    </div>
  );
}
