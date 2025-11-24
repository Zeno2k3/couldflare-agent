import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatApi, type Message } from '../../services/api';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

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
              console.log('SSE Data:', parsed); // Debug log

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
    <div className="flex-1 flex flex-col h-screen bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && !chatId && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Bot size={64} className="mb-4 text-gray-300" />
            <p className="text-xl font-medium">Bắt đầu cuộc trò chuyện mới với AI Agent</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              'flex gap-4 max-w-3xl mx-auto',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600'
            )}>
              {msg.role === 'user' ? <UserIcon size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
            </div>
            <div className={clsx(
              'px-4 py-3 rounded-2xl max-w-[80%]',
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-gray-100 text-gray-800 rounded-tl-none'
            )}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {streamingContent && (
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl max-w-[80%] bg-gray-100 text-gray-800 rounded-tl-none">
              <p className="whitespace-pre-wrap leading-relaxed">{streamingContent}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-2">
            AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
          </p>
        </div>
      </div>
    </div>
  );
};
