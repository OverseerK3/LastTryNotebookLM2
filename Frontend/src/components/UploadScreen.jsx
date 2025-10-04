import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const UploadScreen = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const uploadFile = async (file) => {
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploadSuccess(file, response.data);
    } catch (error) {
      setUploadError(error.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) uploadFile(file);
    },
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black bg-gradient-to-br from-black via-gray-950 to-gray-900 p-6">
      <div className="max-w-2xl w-full text-center">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            NotebookLM Clone
          </h1>
          <p className="text-blue-300/70 text-base md:text-lg">
            Upload a PDF to start chatting with your content
          </p>
        </div>

        {/* ------------- upload ------------  */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-6 md:p-16 
            bg-gray-900/50 cursor-pointer backdrop-blur-sm 
            transition-all duration-300
            ${isDragActive 
              ? 'border-blue-500 bg-blue-950/20 scale-105' 
              : 'border-blue-800/40 hover:border-blue-600/60 hover:bg-gray-900/70'
            }
            ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-6">
            {/* Loading State */}
            {isUploading ? (
              <>
                <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <h3 className="text-lg md:text-xl font-medium text-white">
                  Processing your PDF...
                </h3>
                <p className="text-blue-300/60 text-sm">
                  This may take a moment
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl md:text-7xl mb-3 opacity-90">📄</div>
                <h3 className="text-lg md:text-xl font-medium text-white">
                  {isDragActive ? 'Drop your PDF here' : 'Drag & drop a PDF'}
                </h3>
                <p className="text-blue-300/60 text-sm">
                  or click to select
                </p>
                <button className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-medium p-4 rounded-lg transition-all duration-200">
                  Select PDF File
                </button>
              </>
            )}
          </div>
        </div>

        {/* --------- error -------------- */}
        {uploadError && (
          <div className="bg-red-900/40 border border-red-600/40 text-red-300 text-sm rounded-lg p-4 mt-6 backdrop-blur-sm">
            {uploadError}
          </div>
        )}

        {/* --------- info --------------- */}
        <div className="flex flex-wrap justify-center gap-6 mt-10 text-blue-300/60 text-sm">
          <div className="flex items-center gap-2">
            <span>LlamaParse & ChromaDB & Gemini AI </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadScreen;
