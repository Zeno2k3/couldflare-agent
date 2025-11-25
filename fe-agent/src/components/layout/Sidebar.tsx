import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatApi, type ChatHistory } from '../../services/api';
import { MessageSquare, Plus, LogOut, Trash2, Edit2, Check, X } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  currentChatId: number | null;
  onSelectChat: (id: number) => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentChatId, onSelectChat, onNewChat }) => {
  const { user, logout } = useAuth();
  const [histories, setHistories] = useState<ChatHistory[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (user) {
      loadHistories();
    }
  }, [user]);

  const loadHistories = async () => {
    if (!user) return;
    try {
      const response = await chatApi.getAllHistories(user.id);
      if (response.data.data) {
        setHistories(response.data.data.reverse());
      }
    } catch (error) {
      console.error('Failed to load histories:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!user || !confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) return;

    try {
      await chatApi.deleteHistory(user.id, id);
      setHistories(histories.filter(h => h.id !== id));
      if (currentChatId === id) {
        onNewChat();
      }
    } catch (error) {
      console.error('Failed to delete history:', error);
    }
  };

  const startEdit = (e: React.MouseEvent, history: ChatHistory) => {
    e.stopPropagation();
    setEditingId(history.id);
    setEditTitle(history.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const saveEdit = async (id: number) => {
    if (!editTitle.trim()) return;

    try {
      await chatApi.updateHistory(id, editTitle);
      setHistories(histories.map(h =>
        h.id === id ? { ...h, title: editTitle } : h
      ));
      setEditingId(null);
      setEditTitle('');
    } catch (error) {
      console.error('Failed to update history:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {histories.map((history) => (
          <div
            key={history.id}
            onClick={() => editingId !== history.id && onSelectChat(history.id)}
            className={clsx(
              'group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
              currentChatId === history.id
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
          >
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              <MessageSquare size={18} className="flex-shrink-0" />
              {editingId === history.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, history.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <span className="truncate text-sm flex-1">{history.title || 'Cuộc trò chuyện mới'}</span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {editingId === history.id ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdit(history.id);
                    }}
                    className="p-1 hover:text-green-400 transition-colors"
                    title="Lưu"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEdit();
                    }}
                    className="p-1 hover:text-red-400 transition-colors"
                    title="Hủy"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => startEdit(e, history)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-400 transition-opacity"
                    title="Sửa"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, history.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};
