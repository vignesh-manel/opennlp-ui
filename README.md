# OpenNLP UI

A local developer tool for Apache OpenNLP. Load your own models, analyze text, and visually explore
NLP pipeline results — all running on your machine with no internet connection required.

## Features

- **Sentence Detection** — visualize sentence boundaries in your text
- **Tokenization** — see how text is split into tokens
- **POS Tagging** — color-coded part-of-speech labels on each token
- **Named Entity Recognition** — highlighted entity spans with type labels
- **Language Detection** — identify language with confidence scores
- Works with **any `.bin` model** you have locally, including custom-trained models

## How It Works

```
java -jar backend/target/opennlp-ui.jar
```

This starts a local server on `http://localhost:8080` and opens your browser automatically.
The frontend communicates with the backend over a local REST API. No data leaves your machine.

## Prerequisites

- Java 21+
- Maven 3.8+ (for building)
- Node.js 20+ and npm (for building frontend)

## Building

### 1. Build the frontend
```bash
cd frontend
npm install
npm run build
```
This places the built assets in `backend/src/main/resources/webapp/`.

### 2. Build the backend fat JAR
```bash
cd backend
mvn package
```

### 3. Run
```bash
java -jar backend/target/opennlp-ui.jar
```

## Development Mode

Run frontend and backend separately for hot-reload:

```bash
# Terminal 1 — backend
cd backend && mvn compile exec:java

# Terminal 2 — frontend dev server (proxies /api to backend)
cd frontend && npm run dev
```

Then open `http://localhost:5173`.

## Getting Models

Download pre-trained models from the [Apache OpenNLP models page](https://opennlp.apache.org/models.html):
- Sentence detection: `opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin`
- Tokenizer: `opennlp-en-ud-ewt-tokens-1.3-2.5.4.bin`
- POS tagger: `opennlp-en-ud-ewt-pos-1.3-2.5.4.bin`
- Language detection: `langdetect-183.bin`

Or use your own custom-trained `.bin` models.

## License

Apache License 2.0
