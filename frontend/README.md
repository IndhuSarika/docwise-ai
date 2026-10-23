# DocWise AI — Cited Document Research Assistant

DocWise AI is a document question-answering application that lets users upload PDF documents, ask natural-language questions, and receive AI-generated answers grounded in retrieved passages with page-level source references.

## Features

- PDF text extraction and chunking
- Semantic search using sentence embeddings
- Retrieval-augmented question answering (RAG)
- Local language model inference with Ollama
- Source passages with page numbers and similarity scores
- React-based document upload and chat interface
- FastAPI backend

## Technology Stack

**Frontend:** React, Vite, JavaScript, CSS, Lucide React  
**Backend:** Python, FastAPI, Uvicorn  
**Document processing:** PyMuPDF  
**Semantic retrieval:** Sentence Transformers, all-MiniLM-L6-v2  
**Language model:** Ollama, Llama 3.2 3B

## Architecture

1. A user uploads a PDF through the React frontend.
2. FastAPI extracts the document text and divides it into overlapping chunks.
3. Sentence Transformers generates embeddings for semantic retrieval.
4. Relevant passages are retrieved for each question.
5. Ollama generates an answer using the retrieved context.
6. The frontend displays the answer alongside supporting source passages.

## Local Setup

### Prerequisites

- Python 3.12
- Node.js and npm
- Ollama with the `llama3.2:3b` model

### Backend

```bash
cd backend
source .venv/bin/activate
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.

Alternatively, use the project's `start-docwise.sh` script to start both services together.

## Current Limitations

- Uploaded documents are stored in memory and need to be uploaded again after a backend restart.
- The current workflow is designed for local development.
- AI answers depend on the relevance and quality of retrieved passages and should be verified against the cited text.

## Future Improvements

- Persistent document storage
- Support for multiple documents
- Streaming AI responses
- Improved source highlighting
- Automated backend and frontend tests
- Deployment for public access

## Author

Developed as a personal AI/ML and full-stack project.
