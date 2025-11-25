import axios from 'axios';

const API_URL = 'https://be-worker.mquan592003.workers.dev';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface ChatHistory {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/user/login', { email, password }),
  register: (data: any) =>
    api.post('/user', data),
};

export const chatApi = {
  getAllHistories: (userId: number) =>
    api.get(`/chat-history/all/${userId}`),
  createHistory: (userId: number, title: string) =>
    api.post('/chat-history', { user_id: userId, title }),
  updateHistory: (id: number, title: string) =>
    api.put(`/chat-history/${id}`, { title }),
  deleteHistory: (userId: number, id: number) =>
    api.delete(`/chat-history/${userId}/${id}`),
  getMessages: (historyId: number) =>
    api.get(`/message/history/${historyId}`),
  getMarketData: () =>
    api.get('/market'),
};
