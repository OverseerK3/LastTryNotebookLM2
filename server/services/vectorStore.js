import getCollection from '../config/chroma.js';
import dotenv from 'dotenv';

dotenv.config();

export class VectorStore {
  constructor() {
    this.apiKey = process.env.CHROMA_API_KEY;
    this.tenant = process.env.CHROMA_TENANT;
    this.database = process.env.CHROMA_DATABASE;
    this.collection = null;
    this.collectionName = 'pdf_documents';
    
    console.log('🗄️ ChromaDB initialized');
  }

  // Initialize ChromaDB connection
  async initialize() {
    try {
      console.log('📚 Connecting to ChromaDB...');
      this.collection = await getCollection;
      console.log('✅ ChromaDB ready');
      return true;
    } catch (error) {
      console.error('❌ ChromaDB connection failed:', error.message);
      throw new Error(`ChromaDB setup failed: ${error.message}`);
    }
  }

  // Store document chunks in ChromaDB - ENHANCED with content type metadata
  async storeDocuments(chunks, filename) {
    try {
      if (!this.collection) await this.initialize();
      
      console.log(`💾 Storing ${chunks.length} chunks from "${filename}"`);
      
      // Count special content types
      const tables = chunks.filter(c => c.metadata.has_table).length;
      const images = chunks.filter(c => c.metadata.has_image).length;
      console.log(`   📊 Tables: ${tables}, 🖼️  Images: ${images}`);
      
      // Prepare data for ChromaDB with enhanced metadata
      const documents = chunks.map(chunk => chunk.text);
      const metadatas = chunks.map((chunk, index) => ({
        page: chunk.metadata.page_number,
        filename: filename,
        chunk_id: `${filename}_${index}`,
        section: chunk.metadata.section,
        content_type: chunk.metadata.content_type || 'text',  // NEW
        has_table: chunk.metadata.has_table || false,         // NEW
        has_image: chunk.metadata.has_image || false,         // NEW
        created_at: new Date().toISOString()
      }));
      const ids = chunks.map((_, index) => `${filename}_${Date.now()}_${index}`);

      // Store in ChromaDB
      await this.collection.add({
        documents: documents,
        metadatas: metadatas,
        ids: ids
      });

      console.log(`✅ Stored ${chunks.length} chunks successfully`);
      
      return {
        success: true,
        chunks_stored: chunks.length,
        filename: filename,
        tables_count: tables,
        images_count: images
      };

    } catch (error) {
      console.error('❌ Failed to store documents:', error.message);
      throw new Error(`Storage failed: ${error.message}`);
    }
  }

  // Search for relevant chunks - ENHANCED with content type logging
  async searchRelevant(question, limit = 5) {
    try {
      if (!this.collection) await this.initialize();
      
      console.log(`🔍 Searching for: "${question}"`);
      
      const results = await this.collection.query({
        queryTexts: [question],
        nResults: limit
      });

      // Format results
      const formattedResults = [];
      
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          formattedResults.push({
            text: results.documents[0][i],
            metadata: results.metadatas[0][i],
            similarity: results.distances ? 1 - results.distances[0][i] : 0.5
          });
        }
      }

      const pages = [...new Set(formattedResults.map(r => r.metadata.page))];
      const tableChunks = formattedResults.filter(r => r.metadata.has_table).length;
      const imageChunks = formattedResults.filter(r => r.metadata.has_image).length;
      
      console.log(`📋 Found ${formattedResults.length} chunks from pages: ${pages.join(', ')}`);
      console.log(`   📊 Tables: ${tableChunks}, 🖼️  Images: ${imageChunks}`);
      
      return formattedResults;

    } catch (error) {
      console.error('❌ Search failed:', error.message);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Get collection info for debugging
  async getCollectionInfo() {
    try {
      if (!this.collection) await this.initialize();
      
      const count = await this.collection.count();
      
      return {
        collection_name: this.collectionName,
        document_count: count,
        status: 'connected'
      };
    } catch (error) {
      return {
        collection_name: this.collectionName,
        document_count: 0,
        status: 'error: ' + error.message
      };
    }
  }

  // Check if configured
  isConfigured() {
    return !!(this.apiKey && this.tenant && this.database);
  }
}

export default VectorStore;