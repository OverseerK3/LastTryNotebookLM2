import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import PDFViewer from './PDFViewer';
import { API_BASE_URL } from '../config/api';

const ViewAndChatScreen = ({ uploadedFile, uploadResponse, onBackToUpload }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const handleCitationClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const pdfUrl = uploadResponse?.fileUrl ? `${API_BASE_URL}${uploadResponse.fileUrl}` : null;

  return (
    <div className="w-full h-screen flex flex-col bg-black text-white">
      {/* Top Header */}
      <div className="bg-black border-b border-blue-900/30 px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center flex-col lg:flex-row gap-3 lg:gap-0">
          {/* File Info */}
          <div className="flex flex-col gap-2">
            <h1 className="text-lg font-medium max-w-md truncate">
              📚 {uploadedFile?.name || 'Document'}
            </h1>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-blue-950/40 text-blue-300/90 py-1 px-3 rounded-full text-xs border border-blue-900/30">
                📄 {uploadResponse?.pages || 0} pages
              </span>
              <span className="bg-blue-950/40 text-blue-300/90 py-1 px-3 rounded-full text-xs border border-blue-900/30">
                🧩 {uploadResponse?.chunks || 0} chunks
              </span>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={onBackToUpload}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ← Back to Upload
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        {/* Chat Interface */}
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-blue-900/20 flex flex-col bg-black h-1/2 lg:h-full">
          <ChatInterface onCitationClick={handleCitationClick} />
        </div>

        {/* PDF Viewer */}
        <div className="w-full lg:w-1/2 bg-gray-950 flex flex-col h-1/2 lg:h-full">
          <PDFViewer
            file={pdfUrl}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default ViewAndChatScreen;
