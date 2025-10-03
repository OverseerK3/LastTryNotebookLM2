import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export class LlamaParseAPI {
  constructor() {
    this.apiKey = process.env.LLAMA_PARSE_API_KEY;
    this.baseURL = 'https://api.cloud.llamaindex.ai/api/parsing';
    
    if (!this.apiKey) {
      throw new Error('LLAMA_PARSE_API_KEY is required in .env file');
    }
    
    console.log('🦙 LlamaParse initialized');
  }

  // Simple, effective PDF parsing - all-in-one method
  async parseDocument(filePath) {
    try {
      console.log('🚀 Parsing PDF with LlamaParse...');
      
      // Upload and get job ID
      const jobId = await this.upload(filePath);
      
      // Wait for completion and get results
      const content = await this.waitAndGetResult(jobId);
      
      // Convert to chunks for vector storage
      const chunks = this.createChunks(content);
      
      console.log(`✅ Success: ${chunks.length} chunks created`);
      return chunks;
      
    } catch (error) {
      console.error('❌ LlamaParse error:', error.message);
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  // Upload PDF file
  async upload(filePath) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const response = await axios.post(`${this.baseURL}/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        ...formData.getHeaders()
      }
    });

    console.log(`📤 Uploaded, Job ID: ${response.data.id}`);
    return response.data.id;
  }

  // Wait for processing and get results
  async waitAndGetResult(jobId) {
    const maxAttempts = 30;
    const waitTime = 10000; // 10 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Check status
        const statusResponse = await axios.get(`${this.baseURL}/job/${jobId}`, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });

        const { status } = statusResponse.data;
        console.log(`🔄 Attempt ${attempt}: ${status}`);

        if (status === 'SUCCESS') {
          // Get markdown result (easiest format to work with)
          const resultResponse = await axios.get(`${this.baseURL}/job/${jobId}/result/markdown`, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
          });
          
          console.log('📊 LlamaParse response type:', typeof resultResponse.data);
          console.log('📊 LlamaParse response keys:', Object.keys(resultResponse.data || {}));
          
          return resultResponse.data;
        }

        if (status === 'ERROR') {
          throw new Error('LlamaParse processing failed');
        }

        // Still processing, wait
        if (attempt < maxAttempts) {
          await this.sleep(waitTime);
        }

      } catch (error) {
        if (attempt === maxAttempts) throw error;
        await this.sleep(waitTime);
      }
    }

    throw new Error('PDF processing timeout');
  }

  // Create chunks from parsed content
  createChunks(content) {
    console.log('🔧 Processing content type:', typeof content);
    
    let textContent = '';
    
    // Handle different response formats from LlamaParse
    if (typeof content === 'string') {
      textContent = content;
    } else if (content && typeof content === 'object') {
      // Try common property names for text content
      if (content.markdown) {
        textContent = content.markdown;
      } else if (content.text) {
        textContent = content.text;
      } else if (content.content) {
        textContent = content.content;
      } else if (Array.isArray(content) && content.length > 0) {
        // If it's an array, join the text parts
        textContent = content.map(item => {
          if (typeof item === 'string') return item;
          if (item && item.text) return item.text;
          if (item && item.content) return item.content;
          return '';
        }).join('\n\n');
      } else {
        // Try to extract any string values from the object
        const stringValues = Object.values(content).filter(val => 
          typeof val === 'string' && val.length > 10
        );
        if (stringValues.length > 0) {
          textContent = stringValues.join('\n\n');
        } else {
          console.error('❌ Could not extract text from LlamaParse response:', content);
          throw new Error('Could not extract text content from LlamaParse response');
        }
      }
    } else {
      throw new Error('Invalid content format from LlamaParse');
    }
    
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text content found in LlamaParse response');
    }
    
    console.log('📄 Extracted text length:', textContent.length);

    // Split into paragraphs and create chunks
    const paragraphs = textContent.split('\n\n').filter(p => p.trim().length > 20);
    const chunks = [];
    
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      // If adding this paragraph would make chunk too large, save current chunk
      if (currentChunk.length + paragraph.length > 1000 && currentChunk.length > 0) {
        chunks.push(this.createChunkObject(currentChunk, chunkIndex));
        currentChunk = paragraph;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(this.createChunkObject(currentChunk, chunkIndex));
    }

    return chunks;
  }

  // Create chunk object with metadata
  createChunkObject(text, index) {
    // Simple page estimation: assume ~3 chunks per page
    const estimatedPage = Math.floor(index / 3) + 1;
    
    return {
      text: text.trim(),
      metadata: {
        page_number: estimatedPage,
        chunk_index: index,
        section: `Section ${index + 1}`,
        chunk_id: `chunk_${Date.now()}_${index}`
      }
    };
  }

  // Helper methods
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isConfigured() {
    return !!this.apiKey;
  }
}

export default LlamaParseAPI;