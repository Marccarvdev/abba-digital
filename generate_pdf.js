import fs from 'fs';
import path from 'path';

function generatePdf() {
    const objects = [];
    
    // 1: Catalog
    objects.push(Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"));
    
    // 2: Pages
    objects.push(Buffer.from("<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>"));
    
    // 3: Page
    objects.push(Buffer.from("<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 595.27 841.89 ] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>"));
    
    // Stream content
    const streamLines = [
        "BT",
        "/F1 22 Tf",
        "50 780 Td",
        "(ABBA DIGITAL - Portal da Educacao) Tj",
        "0 -40 Td",
        "/F1 16 Tf",
        "(Atividade: Exercicios de Numerais Multilingue) Tj",
        "0 -30 Td",
        "/F1 12 Tf",
        "(Soletrar os numerais de 0 a 9 em Portugues, Ingles e Alemao.) Tj",
        "0 -20 Td",
        "(Fios correspondentes: Azul (en), Vermelho (de), Preto (pt).) Tj",
        "0 -40 Td",
        "/F1 14 Tf",
        "(Status da Atividade: CONCLUIDA) Tj",
        "0 -25 Td",
        "/F1 12 Tf",
        "(Codigo de Acesso: ABBA-2026) Tj",
        "0 -20 Td",
        "(Data da Entrega: 28/05/2026) Tj",
        "0 -60 Td",
        "/F1 10 Tf",
        "(Gerado automaticamente pelo Antigravity AI Coding Assistant.) Tj",
        "ET"
    ];
    const streamContent = Buffer.from(streamLines.join("\n"));
    
    // 4: Content Stream
    objects.push(Buffer.concat([
        Buffer.from("<< /Length " + streamContent.length + " >>\nstream\n"),
        streamContent,
        Buffer.from("\nendstream")
    ]));
    
    // 5: Font descriptor
    objects.push(Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"));
    
    // Build file
    const pdfChunks = [];
    pdfChunks.push(Buffer.from("%PDF-1.4\n"));
    
    const offsets = [];
    for (let i = 0; i < objects.length; i++) {
        const currentLength = pdfChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        offsets.push(currentLength);
        const objNum = i + 1;
        pdfChunks.push(Buffer.from(`${objNum} 0 obj\n`));
        pdfChunks.push(objects[i]);
        pdfChunks.push(Buffer.from("\nendobj\n"));
    }
    
    const currentLengthForXref = pdfChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    pdfChunks.push(Buffer.from("xref\n"));
    pdfChunks.push(Buffer.from(`0 ${objects.length + 1}\n`));
    pdfChunks.push(Buffer.from("0000000000 65535 f\r\n"));
    
    for (let i = 0; i < offsets.length; i++) {
        const paddedOffset = String(offsets[i]).padStart(10, '0');
        pdfChunks.push(Buffer.from(`${paddedOffset} 00000 n\r\n`));
    }
    
    pdfChunks.push(Buffer.from("trailer\n"));
    pdfChunks.push(Buffer.from(`<< /Size ${objects.length + 1} /Root 1 0 R >>\n`));
    pdfChunks.push(Buffer.from("startxref\n"));
    pdfChunks.push(Buffer.from(`${currentLengthForXref}\n`));
    pdfChunks.push(Buffer.from("%%EOF\n"));
    
    const finalPdf = Buffer.concat(pdfChunks);
    
    const pathsToWrite = ["atividade-teste.pdf"];
    if (fs.existsSync("public") && fs.statSync("public").isDirectory()) {
        pathsToWrite.push(path.join("public", "atividade-teste.pdf"));
    }
    
    for (const p of pathsToWrite) {
        fs.writeFileSync(p, finalPdf);
        console.log(`PDF generated successfully at: ${path.resolve(p)}`);
    }
}

generatePdf();
