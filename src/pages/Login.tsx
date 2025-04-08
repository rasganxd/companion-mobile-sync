
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import AppButton from '@/components/AppButton';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Em uma implementação real, aqui teríamos uma chamada para API
    // Por enquanto, apenas redirecionamos para a página inicial
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-app-orange py-8">
        <h1 className="text-2xl font-bold text-center text-white">
          Sistema de Vendas Mobile
        </h1>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Login</h2>
            <p className="text-gray-500">Faça login para acessar o sistema</p>
          </div>
          
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuário</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border rounded py-2 px-3"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded py-2 px-3"
                required
              />
            </div>
            
            <AppButton
              type="submit"
              variant="purple"
              fullWidth
              className="mt-6"
            >
              Entrar
            </AppButton>
          </form>
        </div>
      </div>
      
      <div className="py-4 text-center text-gray-500 text-sm">
        © 2025 Companion Mobile Sync
      </div>
    </div>
  );
};

export default Login;
