import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const ChatInterface = ({ onCitationClick }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Send message to backend
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        question: inputValue,
      });

      const aiMessage = {
        type: 'ai',
        content: response.data.answer,
        citations: response.data.citations || [],
        tokensUsed: response.data.tokensUsed || 0,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'ai',
        content: `⚠️ Sorry, I encountered an error: ${error.response?.data?.error || 'Please try again.'
          }`,
        citations: [],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* --------------- chat head ----------------------- */}
      <div className="p-5 px-6 border-b border-blue-900/30 bg-black/80 backdrop-blur">
        <h3 className="text-lg font-semibold text-white">💬 Chat with your document</h3>
        <p className="text-blue-400/60 text-sm mt-1">
          Ask questions....
        </p>
      </div>

      {/* ----------------- msg area --------------------- */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center">
            <div className="flex flex-col gap-3 w-full max-w-sm">
              {[
                'What is this document about?',
                'Summarize the main points',
                'What are the key findings?',
              ].map((que, idx) => (
                <button
                  key={idx}
                  className="bg-black/70 border border-blue-800 text-blue-100 p-3 px-5 rounded-xl text-sm text-left transition-all duration-200 hover:bg-blue-950 hover:border-blue-600/50 hover:shadow-md hover:shadow-blue-500/20"
                  onClick={() => setInputValue(que)}
                >
                  {que}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 px-6 flex flex-col gap-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex w-full ${message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                <div
                  className={`max-w-[80%] p-3 px-4 rounded-2xl text-sm leading-relaxed ${message.type === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20'
                      : 'bg-black/70 text-blue-100 border border-blue-800/20'
                    }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>

                  {/* ------------- page citations here ------------------ */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-blue-800/20 flex flex-wrap gap-2 items-center">
                      {message.citations.map((page, idx) => (
                        <button
                          key={idx}
                          className="bg-blue-600/90 text-white py-1 px-3 rounded-full text-xs transition-all duration-200 hover:bg-blue-500 hover:shadow-sm hover:shadow-blue-500/30"
                          onClick={() => onCitationClick(page)}
                        >
                          Page {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* ---------- load message ------------- */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 px-4 rounded-2xl text-sm leading-relaxed bg-black/70 text-blue-200 border border-blue-800/20">
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full mr-2"></div>
                    <span className="text-blue-300">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------ input area ---------------- */}
      <div className="p-5 px-6 border-t border-blue-900/30 bg-black/90 backdrop-blur">
        <div className="flex gap-3 items-end">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your document..."
            className="flex-1 bg-black/70 border border-blue-800/30 rounded-2xl p-3 px-4 text-white text-sm resize-none min-h-12 max-h-32 overflow-y-auto focus:outline-none focus:border-blue-500 focus:shadow-md focus:shadow-blue-500/20 placeholder:text-blue-300/40"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-full w-11 h-11 flex items-center justify-center transition-all duration-200 text-white text-lg font-bold hover:from-blue-500 hover:to-blue-600 hover:shadow-md hover:shadow-blue-500/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
            ) : (
              Send
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
