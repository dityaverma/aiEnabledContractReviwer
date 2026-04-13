"""
POST /api/upload — PDF/DOCX/TXT text extraction
"""
import io
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

ALLOWED = {
    "text/plain": "txt",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}
MAX_MB = 10


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED:
        raise HTTPException(415, f"Unsupported type: {file.content_type}. Use PDF, DOCX or TXT.")
    data = await file.read()
    if len(data) > MAX_MB * 1024 * 1024:
        raise HTTPException(413, f"File exceeds {MAX_MB} MB limit.")

    fmt  = ALLOWED[file.content_type]
    text = ""

    try:
        if fmt == "txt":
            text = data.decode("utf-8", errors="replace")

        elif fmt == "pdf":
            import pdfplumber
            with pdfplumber.open(io.BytesIO(data)) as pdf:
                text = "\n\n".join(p.extract_text() or "" for p in pdf.pages)

        elif fmt == "docx":
            import docx
            doc  = docx.Document(io.BytesIO(data))
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())

    except ImportError as e:
        raise HTTPException(501, f"Parser not installed: {e}. Run: pip install pdfplumber python-docx")
    except Exception as e:
        raise HTTPException(500, f"Parse failed: {e}")

    if not text.strip():
        raise HTTPException(422, "No text extracted. Try pasting the text directly.")

    return {"filename": file.filename, "format": fmt, "chars": len(text), "text": text[:50_000]}
