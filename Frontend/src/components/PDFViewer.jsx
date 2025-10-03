import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Set up PDF.js worker with proper module path
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PDFViewer = ({ file, currentPage, onPageChange }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);

  // Debug the file prop
  useEffect(() => {
    console.log("📄 PDFViewer received file:", file);
    if (!file) {
      setError("No file provided");
    } else {
      setError(null);
    }
  }, [file]);

  // Sync with parent page state
  useEffect(() => {
    if (currentPage && currentPage !== pageNumber) {
      setPageNumber(currentPage);
    }
  }, [currentPage]);

  function onLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
    console.log(`📄 PDF loaded: ${numPages} pages`);
  }

  function onLoadError(error) {
    setError(error?.message || "Failed to load PDF");
    console.error("❌ PDF load error:", error);
  }

  // Navigation functions
  const goToPreviousPage = () => {
    const newPage = Math.max(1, pageNumber - 1);
    setPageNumber(newPage);
    if (onPageChange) onPageChange(newPage);
  };

  const goToNextPage = () => {
    const newPage = Math.min(numPages || pageNumber, pageNumber + 1);
    setPageNumber(newPage);
    if (onPageChange) onPageChange(newPage);
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {file ? (
        <>
          {/* Navigation Controls */}
          <div className="flex justify-center items-center p-4 px-6 bg-black/90 border-b border-blue-900/30 backdrop-blur">
            <div className="flex items-center gap-4">
              <button
                onClick={goToPreviousPage}
                className="bg-black/70 border border-blue-800/30 text-blue-100 py-2 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center hover:bg-blue-950/40 hover:border-blue-600/50 hover:shadow-md hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={pageNumber <= 1}
              >
                ←
              </button>

              <div className="flex items-center gap-2 text-blue-300/80 text-sm font-medium px-3">
                <span>
                  Page {pageNumber} <span className="text-blue-300/40">of</span>{" "}
                  {numPages || "?"}
                </span>
              </div>

              <button
                onClick={goToNextPage}
                className="bg-black/70 border border-blue-800/30 text-blue-100 py-2 px-4 rounded-xl transition-all duration-200 text-sm flex items-center justify-center hover:bg-blue-950/40 hover:border-blue-600/50 hover:shadow-md hover:shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={pageNumber >= numPages}
              >
                →
              </button>
            </div>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-auto flex justify-center items-start p-6 bg-black">
            <Document
              file={file}
              onLoadSuccess={onLoadSuccess}
              onLoadError={onLoadError}
              onSourceError={(e) =>
                setError(e?.message || "Invalid PDF source")
              }
              loading={
                <div className="flex flex-col items-center justify-center h-full text-blue-300 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-6"></div>
                  <p className="font-medium">Loading PDF...</p>
                </div>
              }
              className="flex flex-col items-center"
            >
              <Page
                pageNumber={pageNumber}
                className="flex justify-center mx-auto shadow-lg shadow-black/40 rounded-lg overflow-hidden border border-blue-900/20"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>

            {error && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-5xl mb-6 opacity-80 text-red-400">❌</div>
                <h4 className="text-lg mb-2 text-white font-medium">
                  Failed to load PDF
                </h4>
                <p className="text-blue-300/60 text-sm mb-2">{error}</p>
                <small className="text-blue-300/40 text-xs">
                  PDF URL: {file}
                </small>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center text-blue-200">
          <div className="text-6xl mb-6 opacity-80">📄</div>
          <h4 className="text-lg mb-2 font-medium text-white">
            No PDF to display
          </h4>
          <p className="text-blue-300/60 text-sm">
            Please upload a PDF file to view it here
          </p>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
