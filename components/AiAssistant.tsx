
import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, User } from 'lucide-react';
import { AqiData, ChatMessage } from '../types';
import { sendChatMessage } from '../services/aqiService';

interface AiAssistantProps {
  aqiData: AqiData | null;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ aqiData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: aqiData 
        ? `Hi! I'm Atmos. I see the AQI in ${aqiData.city} is ${aqiData.aqi}. How can I help you stay healthy today?` 
        : "Hi! I'm Atmos AI. Search for a city, and I can give you personalized air quality advice!"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Refresh welcome message context if data changes and conversation hasn't started
    if (aqiData && messages.length === 1 && messages[0].id === 'welcome') {
       setMessages([{
        id: 'welcome',
        role: 'model',
        text: `Hi! I'm Atmos. I see the AQI in ${aqiData.city} is ${aqiData.aqi}. How can I help you stay healthy today?`
       }]);
    }
  }, [aqiData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Call Backend API
      const responseText = await sendChatMessage(userMsg.text, messages, aqiData);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Sorry, I'm having trouble connecting to the server. Please ensure the backend is running." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestedQuestions = [
    "Is it safe to jog outside?",
    "Do I need a mask today?",
    "How does PM2.5 affect me?",
    "Ventilation advice?"
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        } bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-500/50`}
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-[90vw] md:w-[380px] h-[600px] max-h-[80vh] bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-2xl z-50 flex flex-col transition-all duration-300 origin-bottom-right overflow-hidden ${
        isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'
      }`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between bg-indigo-500/5 dark:bg-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white leading-tight">Atmos AI</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/30">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 mt-1">
                  <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-slate-700/50'
              }`}>
                {msg.text}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={14} className="text-slate-500 dark:text-slate-400" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
             <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 rounded-bl-sm border border-slate-100 dark:border-slate-700/50 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {aqiData && messages.length < 3 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
             {suggestedQuestions.map((q, i) => (
               <button
                 key={i}
                 onClick={() => { setInput(q); handleSend(); }} // Simple trigger for UX
                 onClickCapture={(e) => {
                    setInput(q); 
                 }}
                 className="flex-shrink-0 px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/30 rounded-full text-xs text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors whitespace-nowrap"
               >
                 {q}
               </button>
             ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/50">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 border border-transparent focus-within:border-indigo-500 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about air quality..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-500"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AiAssistant;
