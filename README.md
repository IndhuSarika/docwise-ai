# DocWise AI — Cited Document Research Assistant

A document question-answering application that lets users upload PDFs, ask questions, and receive AI-generated answers grounded in retrieved passages with page citations.

## Features
- PDF text extraction and chunking
- Semantic search using sentence embeddings
- Retrieval-augmented generation (RAG)
- Local AI inference using Ollama
- Answers with source passages and page numbers
- React frontend and FastAPI backend

## Technology Stack
- React, Vite, JavaScript, CSS
- Python, FastAPI, Uvicorn
- PyMuPDF
- Sentence Transformers (all-MiniLM-L6-v2)
- Ollama with Llama 3.2 3B

## Run Locally

Prerequisites: Python 3.12, Node.js, npm, and Ollama.

Pull the language model:
ollama pull llama3.2:3b

Start both services from the project root:
./start-docwise.sh

Frontend: http://localhost:5173/
Backend API docs: http://127.0.0.1:8000/docs

## Limitations
Uploaded documents are stored in memory and must be uploaded again after a backend restart. Answers depend on the relevance of retrieved passages and should be checked against cited text.

## Future Improvements
- Persistent document storage
- Multiple-document support
- Automated tests
- Source highlighting
- Deployment
