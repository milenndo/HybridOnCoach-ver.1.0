import React, { useState, useRef, useEffect } from 'react';
import { Message, PlannerFormData } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import ChatMessage from './ChatMessage';

interface ChatViewProps {
  onPlanRequest: (data: Partial<PlannerFormData>) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onPlanRequest }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      text: "I'm ready. Let's get to work. Ask me about training programming, Hyrox strategy, recovery protocols, or nutrition. No filter, just results.",
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass last 10 messages for context
      const historyContext = messages.slice(-10).map(m => ({ role: m.role, text: m.text }));
      const response = await sendMessageToGemini(userMsg.text, historyContext);
      
      const botText = response.text;
      const planRequest = response.planRequest;

      // Even if there is a plan request, we usually display the text first
      if (botText) {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: botText,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, botMsg]);
      }

      // If the AI decided to call the function, trigger the transition
      if (planRequest) {
        // Add a small system note that we are moving
        const systemMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'model',
            text: "**Initializing Program Builder...**",
            timestamp: Date.now(),
        }
        setMessages(prev => [...prev, systemMsg]);
        
        // Short delay for effect then switch
        setTimeout(() => {
            onPlanRequest(planRequest);
        }, 1000);
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Error connecting to the coaching mainframe. Please check your connection.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-hybrid-black">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-hybrid-dark px-4 py-3 rounded-2xl rounded-tl-none border border-gray-700 text-hybrid-accent text-sm">
              <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Analyzing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-hybrid-dark border-t border-gray-800 shrink-0">
        <div className="relative flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask coach..."
            className="w-full bg-hybrid-black text-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-1 focus:ring-hybrid-accent resize-none border border-gray-700 placeholder-gray-600 text-base md:text-sm"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 w-10 h-10 flex items-center justify-center bg-hybrid-accent hover:bg-hybrid-accent-hover text-hybrid-black rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-2 text-center">
          AI generates responses for educational purposes.
        </p>
      </div>
    </div>
  );
};

export default ChatView;