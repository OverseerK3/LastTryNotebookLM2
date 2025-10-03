import { GoogleGenerativeAI } from '@google/generative-ai';

export class ChatService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    });
    
    console.log('🤖 Gemini AI initialized');
  }

  // Generate AI response with document context
  async generateResponse(question, relevantChunks) {
    try {
      if (!relevantChunks || relevantChunks.length === 0) {
        return {
          answer: "I couldn't find relevant information in your document to answer this question. Please try asking about topics covered in your PDF.",
          citations: [],
          tokensUsed: 50,
          sourcesUsed: 0
        };
      }

      console.log(`🤖 Generating response for: "${question}"`);
      console.log(`📚 Using ${relevantChunks.length} chunks`);

      // Build context from chunks
      const context = relevantChunks
        .map(chunk => `[Page ${chunk.metadata.page}]: ${chunk.text}`)
        .join('\n\n');

      // Simple, effective prompt
      const prompt = `Answer this question based on the PDF content provided:

DOCUMENT CONTENT:
${context}

QUESTION: ${question}

INSTRUCTIONS:
- Answer clearly and directly
- When referencing information, mention the page number
- Only use information from the provided content
- If you can't answer fully, explain what's missing

ANSWER:`;

      // Get response from Gemini
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Extract cited pages
      const citedPages = this.findCitedPages(response, relevantChunks);
      const tokensUsed = Math.floor((prompt.length + response.length) / 4);

      console.log(`✅ Generated response (${response.length} chars)`);

      return {
        answer: response,
        citations: citedPages,
        tokensUsed: tokensUsed,
        sourcesUsed: relevantChunks.length
      };

    } catch (error) {
      console.error('❌ Gemini AI error:', error.message);
      throw new Error(`AI response generation failed: ${error.message}`);
    }
  }

  // Find which pages were referenced in the response
  findCitedPages(response, chunks) {
    const citations = new Set();
    
    // Look for page references in the response
    const pageMatches = response.match(/page\s+(\d+)/gi) || [];
    pageMatches.forEach(match => {
      const pageNum = parseInt(match.match(/\d+/)[0]);
      citations.add(pageNum);
    });

    // Also include pages from chunks that were used
    chunks.forEach(chunk => {
      if (chunk.metadata && chunk.metadata.page) {
        citations.add(chunk.metadata.page);
      }
    });

    return Array.from(citations).sort((a, b) => a - b);
  }

  // Check if service is configured
  isConfigured() {
    return !!process.env.GEMINI_API_KEY;
  }
}

export default ChatService;