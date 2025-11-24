import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatApi, type ChatHistory } from '../../services/api';
import { MessageSquare, Plus, LogOut, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
 currentChatId: number | null;
 onSelectChat: (id: number) => void;
 onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentChatId, onSelectChat, onNewChat }) => {
 const { user, logout } = useAuth();
 const [histories, setHistories] = useState<ChatHistory[]>([]);

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
      onClick={() => onSelectChat(history.id)}
      className={clsx(
       'group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
       currentChatId === history.id
        ? 'bg-gray-800 text-white'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      )}
     >
      <div className="flex items-center gap-3 overflow-hidden">
       <MessageSquare size={18} />
       <span className="truncate text-sm">{history.title || 'Cuộc trò chuyện mới'}</span>
      </div>
      <button
       onClick={(e) => handleDelete(e, history.id)}
       className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
      >
       <Trash2 size={16} />
      </button>
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
