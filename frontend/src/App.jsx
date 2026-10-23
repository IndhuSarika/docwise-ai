
import { useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  FileUp,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import "./App.css";

const API = "http://127.0.0.1:8000";

const suggestions = [
  "Summarize this document",
  "What are the key findings?",
  "Explain the main concepts",
];

export default function App() {
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [activeSource, setActiveSource] = useState(null);

  async function uploadDocument(selectedFile) {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }

    setFile(selectedFile);
    setDocumentInfo(null);
    setMessages([]);
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API}/upload-pdf`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not upload the PDF.");
      }

      setDocumentInfo(data);
    } catch (err) {
      setError(
        `${err.message}. Make sure your FastAPI backend is running on port 8000.`
      );
    } finally {
      setUploading(false);
    }
  }

  async function askQuestion(text = question) {
    const cleanQuestion = text.trim();
    if (!cleanQuestion || asking) return;

    if (!documentInfo) {
      setError("Upload a PDF before asking questions.");
      return;
    }

    setError("");
    setQuestion("");
    setMessages((previous) => [
      ...previous,
      { role: "user", content: cleanQuestion },
    ]);
    setAsking(true);

    try {
      const response = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion, top_k: 5 }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to answer your question.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer || "No answer was returned.",
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      setError(`${err.message} Please check that the backend and Ollama are running.`);
    } finally {
      setAsking(false);
    }
  }

  function resetDocument() {
    setFile(null);
    setDocumentInfo(null);
    setMessages([]);
    setError("");
    setActiveSource(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="DocWise AI home">
          <span className="brand-icon"><BookOpen size={23} /></span>
          <span>docwise<span className="brand-ai">.ai</span></span>
        </a>

        <button className="new-chat" onClick={() => setMessages([])}>
          <MessageSquare size={17} /> New conversation
        </button>

        <div className="side-label">YOUR WORKSPACE</div>
        <div className="workspace-card">
          <div className="workspace-icon"><FileText size={19} /></div>
          <div className="workspace-copy">
            <strong>My documents</strong>
            <span>{documentInfo ? "1 document uploaded" : "No documents yet"}</span>
          </div>
          {documentInfo && <CheckCircle2 size={16} className="success-icon" />}
        </div>

        <div className="sidebar-bottom">
          <div className="privacy-icon"><Sparkles size={17} /></div>
          <div>
            <strong>Research smarter.</strong>
            <p>Answers grounded in your documents, with citations you can verify.</p>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Document assistant</strong></div>
          <div className="status-pill"><span className="status-dot" /> AI assistant</div>
        </header>

        <div className="content">
          <section className="welcome">
            <div className="eyebrow"><Sparkles size={14} /> YOUR DOCUMENT RESEARCH ASSISTANT</div>
            <h1>Understand your documents.<br /><span>Get answers that cite their sources.</span></h1>
            <p>Upload a PDF, ask questions in plain English, and explore answers grounded in the text.</p>
          </section>

          <section className="upload-card">
            <div className="section-heading">
              <div className="heading-icon"><FileUp size={19} /></div>
              <div>
                <h2>Your document</h2>
                <p>Upload a PDF to start your research session.</p>
              </div>
            </div>

            {!file ? (
              <button
                className="drop-zone"
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  uploadDocument(event.dataTransfer.files?.[0]);
                }}
              >
                <span className="upload-icon"><UploadCloud size={25} /></span>
                <strong>Click to upload <span>or drag and drop</span></strong>
                <small>PDF files only</small>
              </button>
            ) : (
              <div className="file-row">
                <div className="pdf-icon"><FileText size={22} /></div>
                <div className="file-details">
                  <strong>{file.name}</strong>
                  <span>
  {uploading
    ? "Uploading and processing document..."
    : documentInfo
      ? `${documentInfo.filename || file.name} · ${
          documentInfo.page_count ??
          (Array.isArray(documentInfo.pages)
            ? documentInfo.pages.length
            : "PDF")
        } pages · ${
          documentInfo.chunk_count ??
          (Array.isArray(documentInfo.chunks)
            ? documentInfo.chunks.length
            : "Processed")
        } chunks`
      : "Upload incomplete"}
</span>
                  {uploading && <div className="progress-track"><div className="progress-bar" /></div>}
                </div>
                {!uploading && (
                  <button className="icon-button" onClick={resetDocument} aria-label="Remove document">
                    <X size={17} />
                  </button>
                )}
                {documentInfo && <CheckCircle2 className="success-icon" size={20} />}
              </div>
            )}
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={(event) => uploadDocument(event.target.files?.[0])}
            />
            {documentInfo && (
              <div className="upload-success">
                <CheckCircle2 size={15} /> Document processed and ready for questions.
              </div>
            )}
          </section>

          <section className="chat-card">
            <div className="section-heading chat-heading">
              <div className="heading-icon purple"><Sparkles size={19} /></div>
              <div>
                <h2>Ask your document</h2>
                <p>Get clear answers with supporting source passages.</p>
              </div>
              <span className="powered-label">AI POWERED</span>
            </div>

            <div className="chat-body">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-icon"><MessageSquare size={23} /></div>
                  <h3>{documentInfo ? "Your document is ready" : "Your research starts here"}</h3>
                  <p>
                    {documentInfo
                      ? "Ask a question or choose a suggestion below."
                      : "Upload a PDF above, then ask a question about its content."}
                  </p>
                  <div className="suggestions">
                    {suggestions.map((item) => (
                      <button
                        key={item}
                        disabled={!documentInfo || asking}
                        onClick={() => askQuestion(item)}
                      >
                        {item} <span>↗</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="message-list">
                  {messages.map((message, index) => (
                    <div className={`message ${message.role}`} key={`${index}-${message.role}`}>
                      <div className="message-avatar">
                        {message.role === "assistant" ? <Sparkles size={16} /> : "You"}
                      </div>
                      <div className="message-content">
                        <div className="message-author">
                          {message.role === "assistant" ? "DocWise AI" : "You"}
                        </div>
                        <p>{message.content}</p>
                        {message.sources?.length > 0 && (
                          <div className="sources">
                            <div className="sources-title"><BookOpen size={14} /> Sources used</div>
                            {message.sources.map((source, sourceIndex) => (
                              <button
                                className={`source-card ${activeSource === `${index}-${sourceIndex}` ? "selected" : ""}`}
                                key={`${source.chunk_id ?? sourceIndex}-${source.page ?? source.page_number ?? ""}`}
                                onClick={() =>
                                  setActiveSource(
                                    activeSource === `${index}-${sourceIndex}`
                                      ? null
                                      : `${index}-${sourceIndex}`
                                  )
                                }
                              >
                                <span className="source-page">Page {source.page ?? source.page_number ?? "—"}</span>
                                <span className="source-preview">
                                  {source.text || source.content || "Source passage"}
                                  {activeSource === `${index}-${sourceIndex}` &&
                                    source.similarity != null && (
                                      <small>Similarity score: {Number(source.similarity).toFixed(3)}</small>
                                    )}
                                </span>
                                <span className="source-arrow">↗</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {asking && (
                    <div className="thinking"><span /><span /><span /> <small>Finding an answer in your document…</small></div>
                  )}
                </div>
              )}
            </div>

            <form
              className="question-form"
              onSubmit={(event) => {
                event.preventDefault();
                askQuestion();
              }}
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={documentInfo ? "Ask anything about your PDF…" : "Upload a PDF to start asking questions…"}
                disabled={!documentInfo || asking}
              />
              <button type="submit" disabled={!documentInfo || !question.trim() || asking} aria-label="Send question">
                <Send size={17} />
              </button>
            </form>
            <div className="chat-footnote">Answers are generated from retrieved passages. Always verify important details against the cited text.</div>
          </section>

          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button>
            </div>
          )}

          <footer className="footer"><span>DOCWISE AI</span> · Built for focused, source-grounded research</footer>
        </div>
      </main>
    </div>
  );
}
