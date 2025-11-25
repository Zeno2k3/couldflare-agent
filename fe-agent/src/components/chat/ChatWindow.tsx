import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatApi, type Message } from '../../services/api';
import { Send, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { MessageContent } from './MessageContent';
import { MarketCard } from './MarketCard';

interface ChatWindowProps {
  chatId: number | null;
  onChatCreated: (id: number) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, onChatCreated }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      loadMessages(chatId);
    } else {
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (id: number) => {
    try {
      const response = await chatApi.getMessages(id);
      if (response.data.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const content = input;
    setInput('');
    setIsLoading(true);

    // Optimistic update
    const tempUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      let currentChatId = chatId;

      // Create new chat history if not exists
      if (!currentChatId) {
        const historyRes = await chatApi.createHistory(user.id, content.substring(0, 30) + '...');
        currentChatId = historyRes.data.data.result.meta.last_row_id;
        onChatCreated(currentChatId!);
      }

      // Stream response
      const response = await fetch('https://be-worker.mquan592003.workers.dev/message/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          chat_history_id: currentChatId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let aiResponse = '';
      setStreamingContent('');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                console.error('AI Error:', parsed.error);
                const errorMessage: Message = {
                  id: Date.now() + 1,
                  role: 'assistant',
                  content: `Error: ${parsed.error}\nDetails: ${parsed.details || ''}`,
                  created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, errorMessage]);
                setStreamingContent('');
                return;
              }

              if (parsed.token) {
                aiResponse += parsed.token;
                setStreamingContent(aiResponse);
              }
              if (parsed.done) {
                // Finalize message
                const aiMessage: Message = {
                  id: Date.now() + 1,
                  role: 'assistant',
                  content: aiResponse,
                  created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, aiMessage]);
                setStreamingContent('');
              }
            } catch (e) {
              console.error('Error parsing SSE:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex h-screen bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">Investment AI</h1>
              <p className="text-xs text-gray-500 font-medium">Real-time market analysis</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
          {messages.length === 0 && !chatId && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-6">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                <Sparkles size={32} className="text-blue-600" />
              </div>
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Chào mừng bạn đến với Investment AI!</h2>
                <p className="text-gray-500">Đây là tổng quan thị trường hôm nay. Hãy hỏi tôi về cổ phiếu, xu hướng hoặc tư vấn danh mục.</p>
              </div>
              <div className="w-full max-w-md">
                <MarketCard />
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                'flex gap-4 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm',
                msg.role === 'user' ? 'bg-blue-600' : 'bg-white border border-gray-200'
              )}>
                {msg.role === 'user' ? (
                  <UserIcon size={16} className="text-white" />
                ) : (
                  <Sparkles size={16} className="text-blue-600" />
                )}
              </div>
              <div className={clsx(
                'px-5 py-4 rounded-2xl max-w-[85%] shadow-sm',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
              )}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <MessageContent content={msg.content} />
                )}
              </div>
            </div>
          ))}

          {streamingContent && (
            <div className="flex gap-4 max-w-3xl mx-auto animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles size={16} className="text-blue-600" />
              </div>
              <div className="px-5 py-4 rounded-2xl max-w-[85%] bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm">
                <MessageContent content={streamingContent} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi về cổ phiếu, xu hướng, hoặc tư vấn danh mục..."
                className="w-full pl-6 pr-14 py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-sm text-gray-700 placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md shadow-blue-200"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
