
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import AppButton from '@/components/AppButton';
import { KeyRound, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useMobileAuth } from '@/hooks/useMobileAuth';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useMobileAuth();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!username.trim()) {
      toast.error('Código do vendedor é obrigatório');
      return;
    }
    
    if (!password.trim()) {
      toast.error('Senha é obrigatória');
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        toast.success('Login realizado com sucesso!');
        navigate('/api-settings'); // Redirecionar para configuração da API
      } else {
        toast.error(result.error || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro inesperado ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <div className="bg-gradient-to-r from-app-blue to-app-blue-dark shadow-md py-8">
        <h1 className="text-2xl font-bold text-center text-white">
          Sistema de Vendas Mobile
        </h1>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm space-y-6 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-app-blue rounded-full flex items-center justify-center">
                <LogIn size={30} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Acesso ao Sistema</h2>
            <p className="text-gray-500 mt-2">Insira suas credenciais para continuar</p>
          </div>
          
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Código do Vendedor <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 py-2 border-gray-300 focus:border-app-blue focus:ring focus:ring-app-blue/30 transition-all duration-200"
                  placeholder="Digite seu código"
                  required
                  disabled={isLoading}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 py-2 border-gray-300 focus:border-app-blue focus:ring focus:ring-app-blue/30 transition-all duration-200"
                  placeholder="Digite sua senha"
                  required
                  disabled={isLoading}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <KeyRound size={16} />
                </div>
              </div>
              <p className="text-xs text-gray-500">Senha criada no sistema desktop</p>
            </div>
            
            <AppButton
              type="submit"
              variant="blue"
              fullWidth
              className="mt-6 py-2.5 transition-all duration-200 transform hover:translate-y-[-2px]"
              disabled={isLoading || !username.trim() || !password.trim()}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </AppButton>
          </form>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Use as credenciais criadas no sistema desktop.
            </p>
          </div>
        </div>
      </div>
      
      <div className="py-4 text-center text-gray-600 text-sm bg-white border-t">
        © 2025 Companion Mobile Sync
      </div>
    </div>
  );
};

export default Login;
