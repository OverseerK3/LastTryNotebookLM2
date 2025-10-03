// ChromaDB configuration following the reference example
import { CloudClient } from 'chromadb';
import dotenv from 'dotenv';

dotenv.config();

// Create the client
const client = new CloudClient({
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
  auth: {
    provider: 'token',
    credentials: process.env.CHROMA_API_KEY
  }
});

// Create the collection promise (following your reference file)
const chromaCollectionPromise = client.getOrCreateCollection({ 
  name: "pdf_documents" 
});

export default chromaCollectionPromise;