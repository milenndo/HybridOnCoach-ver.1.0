import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Basic markdown parser for bolding and lists
  const formatText = (text: string) => {
    // Bold: **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Line breaks
    return formatted.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.startsWith('- ') ? (
          <span className="block pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-hybrid-accent">{line.substring(2)}</span>
        ) : (
          <span dangerouslySetInnerHTML={{ __html: line }}></span>
        )}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed shadow-md ${
          isUser
            ? 'bg-hybrid-accent text-hybrid-black font-medium rounded-tr-none'
            : 'bg-hybrid-dark text-gray-200 rounded-tl-none border border-gray-700'
        }`}
      >
        <div className="markdown-body">
            {isUser ? message.text : <div className="space-y-1">{formatText(message.text)}</div>}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;