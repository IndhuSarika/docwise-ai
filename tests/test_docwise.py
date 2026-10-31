
import io
from unittest.mock import patch

import pymupdf
import pytest
from fastapi.testclient import TestClient

from backend import main
main.AI_PROVIDER = "ollama"


client = TestClient(main.app)


@pytest.fixture
def sample_pdf():
    """Create a small valid PDF with selectable text."""
    buffer = io.BytesIO()
    with pymupdf.open() as document:
        page = document.new_page()
        page.insert_text(
            (72, 72),
            "DocWise AI test document. The project uses semantic search.",
        )
        document_bytes = document.tobytes()

    buffer.write(document_bytes)
    buffer.seek(0)
    return buffer


@pytest.fixture(autouse=True)
def reset_document_store():
    """Prevent document state leaking between tests."""
    main.document_store.clear()
    yield
    main.document_store.clear()


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_home_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_search_before_upload_returns_400():
    response = client.post(
        "/search",
        json={"question": "What is this document about?"},
    )
    assert response.status_code == 400


def test_ask_before_upload_returns_400():
    response = client.post(
        "/ask",
        json={"question": "What is this document about?"},
    )
    assert response.status_code == 400


def test_upload_valid_pdf(sample_pdf):
    response = client.post(
        "/upload-pdf",
        files={
            "file": (
                "sample.pdf",
                sample_pdf.getvalue(),
                "application/pdf",
            )
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "sample.pdf"
    assert body["total_pages"] == 1
    assert body["total_chunks"] >= 1


def test_reject_non_pdf_filename():
    response = client.post(
        "/upload-pdf",
        files={
            "file": (
                "notes.txt",
                b"not a PDF",
                "text/plain",
            )
        },
    )
    assert response.status_code == 400


def test_reject_oversized_pdf():
    oversized_content = b"%PDF-" + (
        b"x" * (main.MAX_UPLOAD_SIZE + 1)
    )
    response = client.post(
        "/upload-pdf",
        files={
            "file": (
                "large.pdf",
                oversized_content,
                "application/pdf",
            )
        },
    )
    assert response.status_code == 413


def test_search_returns_similarity_compatibility_fields(sample_pdf):
    upload_response = client.post(
        "/upload-pdf",
        files={
            "file": (
                "sample.pdf",
                sample_pdf.getvalue(),
                "application/pdf",
            )
        },
    )
    assert upload_response.status_code == 200

    response = client.post(
        "/search",
        json={"question": "What does the project use?", "top_k": 5},
    )
    assert response.status_code == 200
    results = response.json()["results"]
    assert results

    for result in results:
        assert "page_number" in result
        assert "similarity_score" in result
        assert "similarity" in result
        assert "text" in result


def test_search_rejects_top_k_above_limit():
    response = client.post(
        "/search",
        json={"question": "Test question", "top_k": 11},
    )
    assert response.status_code == 422


def test_ask_handles_ollama_unavailable(sample_pdf):
    upload_response = client.post(
        "/upload-pdf",
        files={
            "file": (
                "sample.pdf",
                sample_pdf.getvalue(),
                "application/pdf",
            )
        },
    )
    assert upload_response.status_code == 200

    with patch(
        "backend.main.urlopen",
        side_effect=OSError("Ollama unavailable"),
    ):
        response = client.post(
            "/ask",
            json={"question": "What does the project use?"},
        )

    assert response.status_code == 503

def test_upload_rejects_malformed_pdf():
    response = client.post(
        "/upload-pdf",
        files={
            "file": (
                "broken.pdf",
                b"this is not a valid PDF",
                "application/pdf",
            )
        },
    )
    assert response.status_code == 400


def test_upload_rejects_empty_pdf():
    response = client.post(
        "/upload-pdf",
        files={
            "file": ("empty.pdf", b"", "application/pdf")
        },
    )
    assert response.status_code == 400


def test_search_rejects_top_k_below_limit():
    response = client.post(
        "/search",
        json={"question": "Test question", "top_k": 0},
    )
    assert response.status_code == 422


def test_ask_handles_ollama_http_error(sample_pdf):
    upload_response = client.post(
        "/upload-pdf",
        files={
            "file": (
                "sample.pdf",
                sample_pdf.getvalue(),
                "application/pdf",
            )
        },
    )
    assert upload_response.status_code == 200

    from urllib.error import HTTPError
    from unittest.mock import patch

    error = HTTPError(
        url="http://127.0.0.1:11434/api/chat",
        code=500,
        msg="Ollama internal error",
        hdrs=None,
        fp=None,
    )

    with patch("backend.main.urlopen", side_effect=error):
        response = client.post(
            "/ask",
            json={"question": "What does the project use?"},
        )

    assert response.status_code == 503


def test_ask_handles_invalid_ollama_json(sample_pdf):
    upload_response = client.post(
        "/upload-pdf",
        files={
            "file": (
                "sample.pdf",
                sample_pdf.getvalue(),
                "application/pdf",
            )
        },
    )
    assert upload_response.status_code == 200

    from unittest.mock import MagicMock, patch

    mock_response = MagicMock()
    mock_response.__enter__.return_value.read.return_value = b"not json"

    with patch("backend.main.urlopen", return_value=mock_response):
        response = client.post(
            "/ask",
            json={"question": "What does the project use?"},
        )

    assert response.status_code == 502


def test_documents_are_isolated_by_document_id(sample_pdf):
    first = client.post(
        "/upload-pdf",
        files={"file": ("first.pdf", sample_pdf.getvalue(), "application/pdf")},
    )
    assert first.status_code == 200
    first_id = first.json()["document_id"]

    second_pdf = io.BytesIO()
    with pymupdf.open() as document:
        page = document.new_page()
        page.insert_text((72, 72), "A completely different second document.")
        second_pdf.write(document.tobytes())

    second = client.post(
        "/upload-pdf",
        files={"file": ("second.pdf", second_pdf.getvalue(), "application/pdf")},
    )
    assert second.status_code == 200
    second_id = second.json()["document_id"]

    assert first_id != second_id

    first_search = client.post(
        "/search",
        json={
            "question": "What is this document about?",
            "document_id": first_id,
        },
    )
    second_search = client.post(
        "/search",
        json={
            "question": "What is this document about?",
            "document_id": second_id,
        },
    )

    assert first_search.status_code == 200
    assert second_search.status_code == 200
    assert first_search.json()["filename"] == "first.pdf"
    assert second_search.json()["filename"] == "second.pdf"
