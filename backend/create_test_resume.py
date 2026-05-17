# Create a minimal PDF directly
pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 800 >>
stream
BT
/F1 16 Tf
50 750 Td
(John Doe - Full Stack Developer) Tj
0 -30 Td
/F1 10 Tf
(Email: john@example.com | Phone: (555) 123-4567) Tj
0 -30 Td
/F1 12 Tf
(PROFESSIONAL SUMMARY) Tj
0 -20 Td
/F1 10 Tf
(Experienced Full Stack Developer with 5+ years in Python, JavaScript, React, PostgreSQL) Tj
0 -30 Td
/F1 12 Tf
(TECHNICAL SKILLS) Tj
0 -20 Td
/F1 10 Tf
(Languages: Python, JavaScript, TypeScript, SQL, Java) Tj
0 -15 Td
(Frontend: React, Vue.js, Tailwind CSS, Framer Motion, HTML/CSS) Tj
0 -15 Td
(Backend: FastAPI, Node.js, Express, Django, Flask) Tj
0 -15 Td
(Databases: PostgreSQL, MongoDB, Redis, MySQL) Tj
0 -15 Td
(DevOps: Docker, Kubernetes, CI/CD, AWS, Google Cloud) Tj
0 -30 Td
/F1 12 Tf
(WORK EXPERIENCE) Tj
0 -20 Td
/F1 10 Tf
(Senior Full Stack Developer - Tech Corp 2021-Present) Tj
0 -15 Td
(Led development of microservices architecture serving millions) Tj
0 -15 Td
(Implemented CI/CD pipeline reducing deployment time by 60%) Tj
0 -15 Td
(Mentored team of 5 junior developers on best practices) Tj
0 -30 Td
/F1 12 Tf
(EDUCATION) Tj
0 -20 Td
/F1 10 Tf
(B.S. Computer Science - University of Technology, 2019) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
0000000301 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1152
%%EOF
"""

try:
    # Write the PDF
    with open("c:\\Users\\jaga\\OneDrive\\Desktop\\AI- virual mock interview\\test_resume.pdf", "wb") as f:
        f.write(pdf_content)
    
    print("✅ Test resume created at: c:\\Users\\jaga\\OneDrive\\Desktop\\AI- virual mock interview\\test_resume.pdf")
    print("📄 File size:", len(pdf_content), "bytes")
except Exception as e:
    print(f"❌ Error creating PDF: {e}")
