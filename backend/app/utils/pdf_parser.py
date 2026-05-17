import fitz  # PyMuPDF

async def parse_pdf(file):
    # Read file into memory
    content = await file.read()
    # Open the PDF from bytes
    doc = fitz.open(stream=content, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text