// src/utils/pdfUtils.js

import fs from 'fs';
import { getDocument } from 'pdfjs-dist'; 


async function extractTextFromPDF(buffer) {
    const data = new Uint8Array(buffer);
    const doc = await getDocument({ data }).promise;

    const allPageData = [];
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map(item => item.str).join(' ');

        allPageData.push({
            pageNumber: i,
            content: text
        });
    }
    
    return allPageData;
}
export function chunkPDFData(pageDataArray, documentName, chunkSize = 1000, overlap = 100) {
    const finalChunks = [];
    pageDataArray.forEach(page => {
        const text = page.content;
        const pageNumber = page.pageNumber;
        let start = 0;

        while (start < text.length) {
            let end = start + chunkSize;
            let isLastChunk = false; 

            if (end >= text.length) {
                end = text.length;
                isLastChunk = true; 
            }

            const chunkContent = text.slice(start, end).trim();

            if (chunkContent.length > 0) {
                finalChunks.push({
                    documentName,
                    page: pageNumber.toString(),
                    section: null,
                    chunkText: chunkContent
                });
            }

          
            if (isLastChunk) break; 
            
           
            start = end - overlap; 
        }
    });

    console.log(`Created ${finalChunks.length} clean chunks from ${documentName}`);
    return finalChunks;
}



export const parsePDF = async (buffer, documentName) => {
    try {
        const pageDataArray = await extractTextFromPDF(buffer); 

        if (!pageDataArray || pageDataArray.length === 0) {
            throw new Error("No text extracted from PDF");
        }

       
        const chunks = chunkPDFData(pageDataArray, documentName);

        return chunks;
        
    } catch (error) {
        console.error("PDF Parsing Error (Final):", error);
        throw new Error("Failed to parse PDF");
    }
};