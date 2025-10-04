import { GoogleGenerativeAI } from '@google/generative-ai';

export class ChatService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    });
    
    console.log('Gemini AI initialized');
  }

  // -------- gen ai response with document context --------
  async generateResponse(question, relevantChunks) {
    try {
      if (!relevantChunks || relevantChunks.length === 0) {
        return {
          answer: "I couldn't find relevant information in your document to answer this question. Please try asking about PDF topics.",
          citations: [],
          tokensUsed: 50,
          sourcesUsed: 0
        };
      }

      console.log(`Generating response for: "${question}"`);
      console.log(`Using ${relevantChunks.length} chunks`);

      const hasTableData = relevantChunks.some(c => c.metadata.has_table);
      const hasImageData = relevantChunks.some(c => c.metadata.has_image);
      
      if (hasTableData) console.log('Context includes table data');
      if (hasImageData) console.log('Context includes image descriptions');

      const context = relevantChunks            // Build context with content type indicators
        .map(chunk => {
          let prefix = `[Page ${chunk.metadata.page}`;
          if (chunk.metadata.has_table) prefix += ' - TABLE DATA';
          if (chunk.metadata.has_image) prefix += ' - IMAGE/VISUAL';
          prefix += ']: ';
          
          return prefix + chunk.text;
        })
        .join('\n\n---\n\n');

        // extra propmpt to how to behave gemini
      const prompt = `You are analyzing content from a PDF document. The content may include regular text, markdown tables, and image/chart descriptions.

DOCUMENT CONTENT:
${context}

QUESTION: ${question}

INSTRUCTIONS:
- Answer clearly and directly based ONLY on the provided content
- When you see "TABLE DATA", interpret it as structured data in markdown table format
- When you see "IMAGE/VISUAL", treat it as a description of visual content (charts, diagrams, images)
- For table data: analyze rows and columns, provide insights about the data
- For images: reference the visual descriptions provided
- Always mention the page number when citing information
- If the content includes tables, you can summarize or extract specific values
- If the content includes image descriptions, explain what the visual shows
- If you cannot fully answer, explain what information is missing

ANSWER:`;
      // --------- res of gemini --------
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      const citedPages = this.findCitedPages(response, relevantChunks);
      const tokensUsed = Math.floor((prompt.length + response.length) / 4);

      console.log(`Generated response (${response.length} chars)`);

      return {
        answer: response,
        citations: citedPages,
        tokensUsed: tokensUsed,
        sourcesUsed: relevantChunks.length,
        containedTables: hasTableData,
        containedImages: hasImageData
      };

    } catch (error) {
      console.error(' Gemini AI error:', error.message);
      throw new Error(`AI response generation failed: ${error.message}`);
    }
  }

  // Find which pages were used in the answer
  findCitedPages(response, chunks) {
    //  Simply return the actual pages from chunks that were used these are the real pages where the answer came from
    const citations = new Set();
  
    chunks.forEach(chunk => {
      if (chunk.metadata && chunk.metadata.page) {
        citations.add(chunk.metadata.page);
      }
    });
    const citedPages = Array.from(citations).sort((a, b) => a - b);
    console.log(`Citations from pages: ${citedPages.join(', ')}`);
    
    return citedPages;
  }
  isConfigured() {
    return !!process.env.GEMINI_API_KEY;
  }
}

export default ChatService;