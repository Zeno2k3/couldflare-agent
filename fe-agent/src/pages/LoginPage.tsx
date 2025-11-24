import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MessageSquare } from 'lucide-react';

export const LoginPage: React.FC = () => {
 const [isRegister, setIsRegister] = useState(false);
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [fullName, setFullName] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const { login } = useAuth();
 const navigate = useNavigate();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
   if (isRegister) {
    // Register flow
    await authApi.register({
     email,
     password,
     full_name: fullName,
     role: 'user'
    });
    // Auto login after register or switch to login? 
    // Let's switch to login and fill data or auto login if backend returns user.
    // For now, let's just login immediately with the same credentials
    const loginRes = await authApi.login(email, password);
    login(loginRes.data.data);
   } else {
    // Login flow
    const response = await authApi.login(email, password);
    login(response.data.data);
   }
   navigate('/');
  } catch (err: any) {
   console.error(err);
   setError(err.response?.data?.error || (isRegister ? 'Đăng ký thất bại' : 'Đăng nhập thất bại'));
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
   <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
    <div className="flex flex-col items-center mb-8">
     <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
      <MessageSquare className="w-8 h-8 text-white" />
     </div>
     <h1 className="text-2xl font-bold text-gray-900">
      {isRegister ? 'Tạo tài khoản mới' : 'Đăng nhập'}
     </h1>
     <p className="text-gray-500 mt-2">
      {isRegister ? 'Tham gia ngay để chat với AI' : 'Chào mừng bạn quay trở lại!'}
     </p>
    </div>

    <form onSubmit={handleSubmit} className="space-y-6">
     {isRegister && (
      <Input
       id="fullname"
       type="text"
       label="Họ và tên"
       value={fullName}
       onChange={(e) => setFullName(e.target.value)}
       placeholder="Nguyễn Văn A"
       required
      />
     )}

     <Input
      id="email"
      type="email"
      label="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="name@example.com"
      required
     />

     <Input
      id="password"
      type="password"
      label="Mật khẩu"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="••••••••"
      required
      minLength={6}
     />

     {error && (
      <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
       {error}
      </div>
     )}

     <Button
      type="submit"
      className="w-full"
      disabled={loading}
     >
      {loading ? 'Đang xử lý...' : (isRegister ? 'Đăng ký' : 'Đăng nhập')}
     </Button>

     <div className="text-center text-sm text-gray-600">
      {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
      <button
       type="button"
       onClick={() => {
        setIsRegister(!isRegister);
        setError('');
       }}
       className="text-blue-600 hover:text-blue-700 font-medium"
      >
       {isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
      </button>
     </div>
    </form>
   </div>
  </div>
 );
};
