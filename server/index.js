// Import required packages
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { LlamaParseAPI } from './services/llamaParseAPI.js';
import { VectorStore } from './services/vectorStore.js';
import { ChatService } from './services/chatService.js';

// Load environment variables from .env file
dotenv.config();

// Initialize our services
const pdfParser = new LlamaParseAPI();
const vectorStore = new VectorStore();
const chatService = new ChatService();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - stuff that runs before our routes
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow requests from React app
  credentials: true
}));
app.use(express.json()); // Parse JSON requests

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Setup file upload (for PDF files)
const upload = multer({ 
  dest: 'uploads/', // Files will be saved in uploads folder
  limits: { 
    fileSize: 50 * 1024 * 1024 // Max file size: 50MB
  }
});

// Routes - different endpoints our app can handle

// Test route - just to check if server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Database status route - check what's stored in ChromaDB
app.get('/api/database-status', async (req, res) => {
  try {
    const dbInfo = await vectorStore.getCollectionInfo();
    res.json({
      success: true,
      database_info: dbInfo,
      services: {
        llamaparse: pdfParser.isConfigured(),
        chromadb: vectorStore.isConfigured(),
        gemini: chatService.isConfigured()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get database status: ' + error.message 
    });
  }
});

// NEW: Debug endpoint to inspect stored chunks
app.get('/api/debug/chunks', async (req, res) => {
  try {
    const collection = await vectorStore.collection || await vectorStore.initialize();
    const count = await collection.count();
    
    // Get a sample of chunks to inspect
    const sample = await collection.get({
      limit: 10,
      include: ['documents', 'metadatas']
    });
    
    res.json({
      success: true,
      total_chunks: count,
      sample_chunks: sample.ids.map((id, i) => ({
        id: id,
        preview: sample.documents[i].substring(0, 200) + '...',
        metadata: sample.metadatas[i]
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PDF Upload route - where users upload their PDF files
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if it's a PDF file
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Please upload a PDF file' });
    }

    console.log('📁 File uploaded:', req.file.originalname);
    console.log('📊 File size:', Math.round(req.file.size / 1024), 'KB');
    
    // Check if services are configured
    if (!pdfParser.isConfigured()) {
      return res.status(500).json({ 
        error: 'PDF parsing service not configured. Please check LLAMAPARSE_API_KEY in .env file' 
      });
    }
    
    if (!vectorStore.isConfigured()) {
      return res.status(500).json({ 
        error: 'ChromaDB not configured. Please check CHROMA_API_KEY, CHROMA_TENANT, and CHROMA_DATABASE in .env file' 
      });
    }

    // Step 1: Parse the PDF using LlamaParse
    console.log('🚀 Starting PDF parsing...');
    const parsedChunks = await pdfParser.parseDocument(req.file.path);
    
    // Step 2: Store the parsed chunks in ChromaDB
    console.log('💾 Storing chunks in ChromaDB...');
    const storeResult = await vectorStore.storeDocuments(parsedChunks, req.file.originalname);
    
    // Calculate pages simply
    const pageNumbers = parsedChunks.map(chunk => chunk.metadata.page_number);
    const totalPages = Math.max(...pageNumbers);
    
    console.log(`📊 Analysis: ${parsedChunks.length} chunks, ${totalPages} pages`);
    
    // Send success response
    res.json({ 
      success: true,
      message: 'PDF processed successfully!',
      filename: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      size: req.file.size,
      chunks: parsedChunks.length,
      pages: totalPages,
      stored_in_database: storeResult.chunks_stored
    });
    
  } catch (error) {
    console.error('❌ Upload/Parse error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process PDF: ' + error.message 
    });
  }
});

// Chat route - ask questions about the PDF
app.post('/api/chat', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'No question provided' });
    }

    console.log('💬 Question:', question);
    
    if (!chatService.isConfigured()) {
      return res.status(500).json({ 
        error: 'Gemini AI not configured. Check GEMINI_API_KEY in .env' 
      });
    }

    // Find relevant content and generate response
    const relevantChunks = await vectorStore.searchRelevant(question, 5);
    const aiResponse = await chatService.generateResponse(question, relevantChunks);
    
    // Send response
    res.json({ 
      success: true,
      answer: aiResponse.answer,
      citations: aiResponse.citations,
      tokensUsed: aiResponse.tokensUsed,
      sourcesUsed: aiResponse.sourcesUsed
    });
    
  } catch (error) {
    console.error('❌ Chat error:', error.message);
    res.status(500).json({ error: 'Chat failed: ' + error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`📁 Ready to accept PDF uploads and questions!`);
});
