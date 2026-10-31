# DocWise AI — Test Report

## Current Regression Test Results

**Test run:** October 29, 2026  
**Environment:** macOS, Python virtual environment  
**Command:** `backend/.venv/bin/python -m pytest -q`

### Summary

| Metric | Result |
|---|---:|
| Tests passed | 15 |
| Tests failed | 0 |
| Duration | 7.37 seconds |
| Warnings | 5 |

### Tested Areas

- Health and home endpoints
- Search and ask requests before a document is uploaded
- Successful PDF upload and text extraction
- Rejection of non-PDF filenames and malformed or empty PDFs
- Rejection of uploads exceeding 10 MiB
- Search result page numbers and similarity-field compatibility
- Validation of `top_k` bounds
- Handling of Ollama connection failures, HTTP errors, and invalid JSON

### Warnings

Five PyMuPDF/SWIG deprecation warnings appeared during the run. The tests still passed.

### Remaining Work

The following areas have not yet been fully verified by this test suite:

- Password-protected PDFs and scanned PDFs
- Ollama timeouts and empty model answers
- Prompt-injection resistance
- Isolation of documents between users
- Persistent storage across restarts
- Deployment without requiring reviewers to install Ollama
- Cross-platform startup and deployment instructions
- Complete regression coverage against the original QA report

### Status

**Initial regression suite: PASS (15/15).**

This result applies only to the tests listed above. It does not certify that every original QA finding has been resolved.
