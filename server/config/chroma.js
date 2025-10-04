import { CloudClient } from 'chromadb';
import dotenv from 'dotenv';
dotenv.config();

const client = new CloudClient({
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
  auth: {
    provider: 'token',
    credentials: process.env.CHROMA_API_KEY
  }
});

const chromaCollectionPromise = client.getOrCreateCollection({ 
  name: "pdf_documents" 
});

export default chromaCollectionPromise;