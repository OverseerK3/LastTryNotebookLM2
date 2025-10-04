# 📊 Tables & Images Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS PDF                                 │
│                    (Contains: Text + Tables + Images)                    │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    🦙 LLAMAPARSE API (Step 1)                            │
│─────────────────────────────────────────────────────────────────────────│
│  • Receives PDF file                                                     │
│  • Extracts text with OCR                                                │
│  • Converts tables to markdown:                                          │
│    | Column 1 | Column 2 |                                               │
│    |----------|----------|                                               │
│    | Data 1   | Data 2   |                                               │
│  • Describes images:                                                     │
│    [Image: Bar chart showing sales from 2020-2024...]                    │
│  • Returns: Raw markdown text                                            │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            🔧 SMART CHUNKING (Step 2 - llamaParseAPI.js)                 │
│─────────────────────────────────────────────────────────────────────────│
│  smartSplit() function:                                                  │
│                                                                           │
│  Regular Text:    "Lorem ipsum dolor..."                                 │
│       ↓                                                                   │
│  Split at ~1000 chars into Chunk 1                                       │
│                                                                           │
│  Table Detected:  "| Name | Age |..."                                    │
│       ↓                                                                   │
│  Keep ENTIRE table together → Chunk 2 (marked as TABLE)                  │
│                                                                           │
│  Image Detected:  "[Image: Chart showing..."                             │
│       ↓                                                                   │
│  Keep ENTIRE description → Chunk 3 (marked as IMAGE)                     │
│                                                                           │
│  More text:       "The data shows..."                                    │
│       ↓                                                                   │
│  Continue chunking → Chunk 4                                             │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              📦 CHUNK CREATION WITH METADATA (Step 3)                    │
│─────────────────────────────────────────────────────────────────────────│
│                                                                           │
│  Chunk 1: {                                                              │
│    text: "Lorem ipsum dolor...",                                         │
│    metadata: {                                                           │
│      page_number: 1,                                                     │
│      content_type: "text",     ← 🆕 NEW                                  │
│      has_table: false,         ← 🆕 NEW                                  │
│      has_image: false          ← 🆕 NEW                                  │
│    }                                                                     │
│  }                                                                       │
│                                                                           │
│  Chunk 2: {                                                              │
│    text: "| Name | Age | City |...",                                     │
│    metadata: {                                                           │
│      page_number: 2,                                                     │
│      content_type: "table",    ← 🆕 TABLE!                               │
│      has_table: true,          ← 🆕 FLAG!                                │
│      has_image: false                                                    │
│    }                                                                     │
│  }                                                                       │
│                                                                           │
│  Chunk 3: {                                                              │
│    text: "[Image: Bar chart...",                                         │
│    metadata: {                                                           │
│      page_number: 3,                                                     │
│      content_type: "image",    ← 🆕 IMAGE!                               │
│      has_table: false,                                                   │
│      has_image: true           ← 🆕 FLAG!                                │
│    }                                                                     │
│  }                                                                       │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            🗄️ CHROMADB STORAGE (Step 4 - vectorStore.js)                │
│─────────────────────────────────────────────────────────────────────────│
│  Store with embeddings + metadata:                                       │
│                                                                           │
│  documents: ["Lorem ipsum...", "| Name | Age |...", "[Image: Bar..."]   │
│  embeddings: [vector1, vector2, vector3]  ← Semantic vectors            │
│  metadatas: [                                                            │
│    {page: 1, content_type: "text", has_table: false, has_image: false}, │
│    {page: 2, content_type: "table", has_table: true, has_image: false}, │
│    {page: 3, content_type: "image", has_table: false, has_image: true}  │
│  ]                                                                       │
│                                                                           │
│  📊 Console: "Stored 45 chunks (Tables: 3, Images: 2)"                   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │  (Time passes...)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   💬 USER ASKS QUESTION                                  │
│             "What are the sales figures in the table?"                   │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│          🔍 VECTOR SEARCH (Step 5 - vectorStore.js)                      │
│─────────────────────────────────────────────────────────────────────────│
│  1. Convert question to embedding vector                                 │
│  2. Find top 5 most similar chunks by cosine similarity                  │
│  3. Returns chunks with metadata                                         │
│                                                                           │
│  Results:                                                                │
│  Chunk 2: "| Product | Q1 | Q2 |..." (similarity: 0.87) ← TABLE!        │
│  Chunk 7: "Sales analysis shows..." (similarity: 0.76)                   │
│  Chunk 9: "[Image: Sales chart..." (similarity: 0.71) ← IMAGE!          │
│  Chunk 15: "Revenue breakdown..." (similarity: 0.68)                     │
│  Chunk 3: "Market trends..." (similarity: 0.65)                          │
│                                                                           │
│  📊 Console: "Found 5 chunks (Tables: 1, Images: 1)"                     │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│       🤖 GEMINI AI GENERATION (Step 6 - chatService.js)                  │
│─────────────────────────────────────────────────────────────────────────│
│  Build enhanced prompt:                                                  │
│                                                                           │
│  DOCUMENT CONTENT:                                                       │
│  [Page 2 - TABLE DATA]: | Product | Q1 | Q2 | Q3 |      ← LABELED!      │
│                         |---------|----|----|-----|                      │
│                         | Widget  | 100| 150| 200 |                      │
│                         | Gadget  | 80 | 120| 180 |                      │
│  ---                                                                     │
│  [Page 7]: Sales analysis shows strong growth...                        │
│  ---                                                                     │
│  [Page 9 - IMAGE/VISUAL]: [Image: Bar chart showing   ← LABELED!        │
│   quarterly sales growth with Widget at 100, 150, 200                   │
│   and Gadget at 80, 120, 180]                                            │
│  ---                                                                     │
│  [Page 15]: Revenue breakdown by quarter...                             │
│  ---                                                                     │
│  [Page 3]: Market trends indicate...                                    │
│                                                                           │
│  INSTRUCTIONS:                                                           │
│  - When you see "TABLE DATA", interpret as markdown table format        │
│  - When you see "IMAGE/VISUAL", treat as visual description             │
│  - For table data: analyze rows/columns, extract values                 │
│  - For images: reference the visual descriptions                        │
│  - Always cite page numbers                                             │
│                                                                           │
│  QUESTION: What are the sales figures in the table?                     │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ✨ GEMINI PROCESSES & RESPONDS                        │
│─────────────────────────────────────────────────────────────────────────│
│  Gemini now understands:                                                 │
│  • This is a markdown TABLE                                              │
│  • Can extract specific cells                                            │
│  • Can compare columns                                                   │
│  • Can reference the visual chart                                        │
│                                                                           │
│  Response generated:                                                     │
│  "Based on the table on page 2, the sales figures are:                  │
│   - Widget: Q1: 100, Q2: 150, Q3: 200                                    │
│   - Gadget: Q1: 80, Q2: 120, Q3: 180                                     │
│   This shows consistent growth across both products, which is also       │
│   visualized in the chart on page 9."                                    │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     📱 RESPONSE TO USER                                  │
│─────────────────────────────────────────────────────────────────────────│
│  {                                                                       │
│    answer: "Based on the table on page 2...",                           │
│    citations: [2, 7, 9, 15, 3],                                          │
│    tokensUsed: 450,                                                      │
│    sourcesUsed: 5,                                                       │
│    containedTables: true,    ← 🆕 User knows tables were used!          │
│    containedImages: true     ← 🆕 User knows images were used!          │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════

KEY IMPROVEMENTS:

✅ STEP 2: Smart chunking preserves table structure (no splits mid-table)
✅ STEP 3: Content type metadata tracked (table/image/text)
✅ STEP 4: Metadata stored in ChromaDB for filtering
✅ STEP 5: Search results show content type distribution
✅ STEP 6: Gemini receives labeled chunks with context-specific instructions
✅ RESULT: Accurate answers leveraging structured data!

═══════════════════════════════════════════════════════════════════════════
