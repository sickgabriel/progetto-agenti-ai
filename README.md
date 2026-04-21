# ☘︎ Orizon - Intelligent CO2 Travel Assistant

Orizon è un assistente intelligente progettato per aiutare viaggiatori e aziende a stimare l'impatto ambientale (CO2) dei loro spostamenti attraverso un'interfaccia chat naturale e intuitiva.

## 🚀 Visione del Progetto
L'obiettivo di Orizon è semplificare la consapevolezza ecologica. Invece di compilare moduli complessi, l'utente descrive il proprio viaggio a parole (es: *"Voglio andare da Milano a Parigi in treno con 20kg di bagaglio"*) e l'assistente si occupa di estrarre i dati e calcolare l'impronta di carbonio reale.

## ✨ Caratteristiche Principali
- **Interfaccia Chat Fluida**: UI moderna e "nature-oriented" sviluppata con React.
- **AI-Powered (Function Calling)**: Utilizza LLM (OpenAI) per estrarre automaticamente parametri come origine, destinazione, mezzo di trasporto e peso del bagaglio.
- **Integrazione EcoFreight**: Calcoli basati su dati reali tramite l'API di EcoFreight.
- **Memoria Conversazionale**: Sistema di persistenza locale per mantenere il contesto della chat tra i messaggi.
- **Fallback Intelligente**: Sistema di elaborazione locale integrato per funzionare anche in assenza di chiavi API esterne.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, CSS3 (Shadcn-inspired UI).
- **Backend**: Node.js, Express.
- **AI & API**: OpenAI SDK (Function Calling), Axios.
- **Persistenza**: File-based JSON Memory.

## 📂 Struttura del Progetto
```text
├── client/                 # Frontend React (Vite)
│   ├── src/                # Componenti e logica UI
│   └── preview.html        # Pagina di anteprima statica
├── server/                 # Backend Node.js
│   ├── controllers/        # Logica degli endpoint
│   ├── services/           # Integrazioni LLM e EcoFreight
│   └── data/               # Persistenza memoria (JSON)
├── package.json            # Dipendenze globali
└── .env.example            # Template variabili d'ambiente
```

## ⚙️ Installazione e Setup

### 1. Clona il repository
```bash
git clone https://github.com/tuo-username/orizon.git
cd orizon
```

### 2. Configura il Backend
```bash
# Installa le dipendenze
npm install

# Configura le variabili d'ambiente
cp .env.example .env
# Modifica il file .env con le tue API Key (OpenAI, EcoFreight)
```

### 3. Configura il Frontend
```bash
cd client
npm install
```

## 🚀 Esecuzione

### Avvia il Server (Backend)
Dalla root del progetto:
```bash
npm run start:server
```
Il server sarà attivo su `http://localhost:3001`.

### Avvia la Web App (Frontend)
Da una nuova finestra del terminale nella cartella `client/`:
```bash
npm run dev
```
L'app sarà disponibile su `http://localhost:5173` (o la prima porta libera).

## 🌍 Variabili d'Ambiente
Assicurati di impostare correttamente le seguenti variabili nel file `.env`:
- `OPENAI_API_KEY`: Per le funzionalità avanzate di conversazione.
- `ECOFREIGHT_API_KEY`: Per i calcoli reali della CO2.
- `ECOFREIGHT_API_URL`: Endpoint dell'API EcoFreight.

## 🌿 Design
Il design di Orizon segue i valori di sostenibilità:
- **Colori**: Toni di verde bosco, beige crema e bianco pulito.
- **Font**: Sans-serif professionale e leggibile.
- **Mood**: Calmo, professionale e orientato alla natura.

---
Sviluppato con ❤️ per un futuro più sostenibile.
