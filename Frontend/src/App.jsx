import React, { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import ViewAndChatScreen from './components/ViewAndChatScreen';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('upload'); // 'upload' or 'chat'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadResponse, setUploadResponse] = useState(null);

  // --------- Handle successful PDF upload --------------
  const handleUploadSuccess = (file, response) => {
    console.log('📄 Upload successful:', response);
    setUploadedFile(file);
    setUploadResponse(response);
    setCurrentScreen('chat'); // Switch to chat screen
  };

  // ------------- Handle back to upload ------------------
  const handleBackToUpload = () => {
    setCurrentScreen('upload');
    setUploadedFile(null);
    setUploadResponse(null);
  };

  return (
    <div className="app">
      {currentScreen === 'upload' ? (
        <UploadScreen onUploadSuccess={handleUploadSuccess} />
      ) : (
        <ViewAndChatScreen
          uploadedFile={uploadedFile}
          uploadResponse={uploadResponse}
          onBackToUpload={handleBackToUpload}
        />
      )}
    </div>
  );
}

export default App;
