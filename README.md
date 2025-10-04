# NotebookLM Clone

A full-stack application that allows users to upload PDF documents and interact with them through an AI-powered chat interface. Built with React, Node.js, and integrated with LlamaParse for document processing, ChromaDB for vector storage, and Google Gemini for AI responses.

## Features

- PDF upload and parsing with support for tables and images
- AI-powered chat interface for querying document content
- Vector-based semantic search for accurate information retrieval
- Page citations with clickable references
- Side-by-side PDF viewer and chat interface
- Real-time document analysis and question answering

## Tech Stack

**Frontend:**
- React with Vite
- TailwindCSS for styling
- Axios for API calls
- react-pdf for PDF rendering
- react-dropzone for file uploads

**Backend:**
- Node.js with Express
- LlamaParse API for PDF parsing
- ChromaDB for vector embeddings
- Google Gemini AI for chat responses
- Multer for file handling

## Prerequisites

Before you begin, ensure you have the following:

- Node.js (v16 or higher)
- npm or yarn package manager
- API keys for:
  - LlamaParse (from LlamaIndex)
  - ChromaDB (tenant and database credentials)
  - Google Gemini API

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/LastTryNotebookLM2.git
cd LastTryNotebookLM2
```

2. Install frontend dependencies:
```bash
cd Frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../server
npm install
```

## Configuration

1. Create a `.env` file in the `server` directory:
```env
LLAMA_PARSE_API_KEY=your_llamaparse_key
CHROMA_API_KEY=your_chroma_key
CHROMA_TENANT=your_tenant_id
CHROMA_DATABASE=your_database_name
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

2. For production deployment, create `Frontend/.env.production`:
```env
VITE_API_URL=https://your-backend-url.com
```

## Running Locally

1. Start the backend server:
```bash
cd server
node inex.js OR npm run dev ( if dev script is there )
```
The server will run on http://localhost:3000

2. In a new terminal, start the frontend:
```bash
cd Frontend
npm run dev
```
The frontend will run on http://localhost:5173

3. Open your browser and navigate to http://localhost:5173

## Usage

1. Upload a PDF document using the drag-and-drop interface or file selector
2. Wait for the document to be processed (parsing and vectorization)
3. Once processing is complete, you'll see the PDF viewer on the right and chat interface on the left
4. Ask questions about your document in the chat
5. The AI will respond with answers and provide page citations
6. Click on page citations to jump to the relevant section in the PDF viewer


## Project Structure

```
LastTryNotebookLM2/
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── PDFViewer.jsx
│   │   │   ├── UploadScreen.jsx
│   │   │   └── ViewAndChatScreen.jsx
│   │   ├── config/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/
│   ├── services/
│   │   ├── llamaParseAPI.js
│   │   ├── vectorStore.js
│   │   └── chatService.js
│   ├── config/
│   │   └── chroma.js
│   ├── index.js
│   └── package.json
└── README.md
```

## How It Works

1. **PDF Upload**: User uploads a PDF file through the frontend
2. **Parsing**: LlamaParse extracts text, tables, and image descriptions from the PDF
3. **Chunking**: Content is intelligently split into chunks while preserving table and image integrity
4. **Vectorization**: Chunks are converted to embeddings and stored in ChromaDB
5. **Query**: User asks a question in the chat interface
6. **Search**: ChromaDB performs semantic search to find relevant chunks
7. **Generation**: Google Gemini generates an answer based on the retrieved context
8. **Citation**: Page numbers are extracted and displayed with the answer

## Troubleshooting

**CORS errors:**
- Ensure backend CORS is configured to allow your frontend origin
- Check that environment variables are set correctly

**PDF upload fails:**
- Verify LlamaParse API key is valid
- Check file size is under 50MB
- Ensure uploads directory exists and has write permissions

**Chat responses are inaccurate:**
- Check ChromaDB connection is active
- Verify Gemini API key is valid
- Try uploading a simpler PDF to test

## License

ISC


## Acknowledgments

- LlamaIndex for the LlamaParse API
- Google for Gemini AI
- Chroma for the vector database
- React and Vite teams for the excellent development tools
