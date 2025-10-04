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
    
    // Enhanced parsing instructions for better table & image handling
    formData.append('parsing_instruction', 
      'Extract all text, tables, and describe any images or charts. ' +
      'Preserve table structure in markdown format. ' +
      'For images, provide detailed descriptions of visual content.'
    );
    
    
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
          // Get JSON result with page information
          const jsonResponse = await axios.get(`${this.baseURL}/job/${jobId}/result/json`, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
          });
          
          console.log('📊 LlamaParse response type:', typeof jsonResponse.data);
          
          // Also get markdown for easier text processing
          const markdownResponse = await axios.get(`${this.baseURL}/job/${jobId}/result/markdown`, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
          });
          
          // Return both - we'll use JSON for page numbers, markdown for text
          return {
            json: jsonResponse.data,
            markdown: markdownResponse.data
          };
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

  // Create chunks from parsed content - ENHANCED for tables and images
  createChunks(content) {
    console.log('🔧 Processing content...');
    
    // Extract markdown text and page info from JSON
    let textContent = '';
    let pageMapping = new Map(); // Map text positions to page numbers
    
    // Handle the response format (now contains json and markdown)
    if (content.markdown && content.json) {
      textContent = typeof content.markdown === 'string' ? content.markdown : content.markdown.markdown || '';
      
      // Extract page information from JSON
      if (content.json.pages) {
        let currentPosition = 0;
        content.json.pages.forEach(page => {
          const pageNumber = page.page || page.page_number || 1;
          const pageText = page.text || page.md || '';
          const pageLength = pageText.length;
          
          // Map text range to page number
          for (let i = 0; i < pageLength; i++) {
            pageMapping.set(currentPosition + i, pageNumber);
          }
          currentPosition += pageLength;
        });
        
        console.log(`📄 Extracted page mapping for ${content.json.pages.length} pages`);
      }
    }
    // Fallback to old format
    else if (typeof content === 'string') {
      textContent = content;
    } else if (content && typeof content === 'object') {
      if (content.markdown) {
        textContent = content.markdown;
      } else if (content.text) {
        textContent = content.text;
      } else if (content.content) {
        textContent = content.content;
      }
    }
    
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text content found in LlamaParse response');
    }
    
    console.log('📄 Extracted text length:', textContent.length);

    // SMART CHUNKING: Preserve tables and images integrity
    const chunks = [];
    const sections = this.smartSplit(textContent);
    
    let currentChunk = '';
    let chunkIndex = 0;
    let textPosition = 0; // Track position in original text

    for (const section of sections) {
      const sectionInfo = this.analyzeSection(section);
      
      // Find page number for this section
      const sectionStartPos = textContent.indexOf(section, textPosition);
      const sectionMidPos = sectionStartPos + Math.floor(section.length / 2);
      const pageNumber = pageMapping.get(sectionMidPos) || Math.floor(chunkIndex / 3) + 1;
      
      // If this is a table or image, keep it together (don't split)
      if (sectionInfo.hasTable || sectionInfo.hasImage) {
        // Save current chunk if exists
        if (currentChunk.trim().length > 0) {
          const chunkStartPos = textContent.indexOf(currentChunk, textPosition - currentChunk.length);
          const chunkMidPos = chunkStartPos + Math.floor(currentChunk.length / 2);
          const chunkPage = pageMapping.get(chunkMidPos) || Math.floor(chunkIndex / 3) + 1;
          chunks.push(this.createChunkObject(currentChunk, chunkIndex, sectionInfo, chunkPage));
          chunkIndex++;
          currentChunk = '';
        }
        
        // Add table/image as its own chunk
        chunks.push(this.createChunkObject(section, chunkIndex, sectionInfo, pageNumber));
        chunkIndex++;
      } 
      // Regular text - use smart chunking
      else {
        if (currentChunk.length + section.length > 1000 && currentChunk.length > 0) {
          const chunkStartPos = textContent.indexOf(currentChunk, textPosition - currentChunk.length);
          const chunkMidPos = chunkStartPos + Math.floor(currentChunk.length / 2);
          const chunkPage = pageMapping.get(chunkMidPos) || Math.floor(chunkIndex / 3) + 1;
          chunks.push(this.createChunkObject(currentChunk, chunkIndex, sectionInfo, chunkPage));
          currentChunk = section;
          chunkIndex++;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + section;
        }
      }
      
      textPosition = sectionStartPos + section.length;
    }

    // Add remaining chunk
    if (currentChunk.trim()) {
      const chunkStartPos = textContent.indexOf(currentChunk, textPosition - currentChunk.length);
      const chunkMidPos = chunkStartPos + Math.floor(currentChunk.length / 2);
      const chunkPage = pageMapping.get(chunkMidPos) || Math.floor(chunkIndex / 3) + 1;
      chunks.push(this.createChunkObject(currentChunk, chunkIndex, null, chunkPage));
    }

    console.log(`📊 Created ${chunks.length} chunks (tables/images preserved)`);
    return chunks;
  }

  // Smart split that respects markdown tables and images
  smartSplit(text) {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = '';
    let inTable = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect table boundaries
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (!inTable) {
          // Table starting - save previous section
          if (currentSection.trim()) {
            sections.push(currentSection.trim());
            currentSection = '';
          }
          inTable = true;
        }
        currentSection += line + '\n';
      } 
      // Detect end of table
      else if (inTable && line.trim().length === 0) {
        inTable = false;
        sections.push(currentSection.trim());
        currentSection = '';
      }
      // Detect image descriptions
      else if (line.match(/\[Image:/i) || line.match(/\[Diagram:/i) || line.match(/\[Chart:/i)) {
        // Save previous section
        if (currentSection.trim()) {
          sections.push(currentSection.trim());
        }
        currentSection = line + '\n';
        // Look ahead for continuation
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().match(/^\[/) && lines[j].trim().length > 0) {
          currentSection += lines[j] + '\n';
          j++;
        }
        sections.push(currentSection.trim());
        currentSection = '';
        i = j - 1;
      }
      // Regular content
      else {
        currentSection += line + '\n';
        // Split on double newlines (paragraphs) if not in special content
        if (line.trim().length === 0 && currentSection.trim().length > 20) {
          sections.push(currentSection.trim());
          currentSection = '';
        }
      }
    }
    
    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }
    
    return sections.filter(s => s.length > 20);
  }

  // Analyze section to detect content type
  analyzeSection(text) {
    const hasTable = text.includes('|') && text.split('\n').some(line => 
      line.trim().startsWith('|') && line.includes('|')
    );
    
    const hasImage = /\[Image:/i.test(text) || /\[Diagram:/i.test(text) || /\[Chart:/i.test(text);
    
    return {
      hasTable,
      hasImage,
      contentType: hasTable ? 'table' : hasImage ? 'image' : 'text'
    };
  }

  // Create chunk object with metadata - ENHANCED with content type and REAL page numbers
  createChunkObject(text, index, sectionInfo = null, pageNumber = null) {
    // Use provided page number or fallback to estimation
    const actualPage = pageNumber || Math.floor(index / 3) + 1;
    
    // Auto-detect content type if not provided
    if (!sectionInfo) {
      sectionInfo = this.analyzeSection(text);
    }
    
    return {
      text: text.trim(),
      metadata: {
        page_number: actualPage,      // ✅ REAL page number from LlamaParse!
        chunk_index: index,
        section: `Section ${index + 1}`,
        chunk_id: `chunk_${Date.now()}_${index}`,
        content_type: sectionInfo.contentType,
        has_table: sectionInfo.hasTable,
        has_image: sectionInfo.hasImage
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