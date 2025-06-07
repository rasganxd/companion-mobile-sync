import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Lock, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
const Login = () => {
  const [salesRepCode, setSalesRepCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const {
    loginWithCredentials
  } = useAuth();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesRepCode.trim()) {
      toast.error('Código do vendedor é obrigatório');
      return;
    }
    if (!password.trim()) {
      toast.error('Senha é obrigatória');
      return;
    }
    setIsLoading(true);
    try {
      const success = await loginWithCredentials(salesRepCode, password);
      if (success) {
        toast.success('Login realizado com sucesso!');
        navigate('/home');
      } else {
        toast.error('Código do vendedor ou senha incorretos');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro inesperado durante o login');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      <div className="bg-gradient-to-r from-app-blue to-app-blue-dark shadow-md py-[12px]">
        <h1 className="font-bold text-center text-white text-base py-[10px]">
          SalesTrack Mobile - Login
        </h1>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LogIn size={24} className="text-app-blue" />
              Acesso ao Sistema
            </CardTitle>
            <p className="text-gray-600 text-sm">
              Digite suas credenciais para acessar o sistema
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Código do Vendedor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input type="text" value={salesRepCode} onChange={e => setSalesRepCode(e.target.value)} placeholder="Digite seu código" disabled={isLoading} className="pl-10 text-center text-lg font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Senha <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Digite sua senha" disabled={isLoading} className="pl-10" />
                </div>
              </div>

              <Button type="submit" className="w-full bg-app-blue hover:bg-app-blue-dark" disabled={isLoading || !salesRepCode.trim() || !password.trim()}>
                {isLoading ? <>
                    <LogIn size={16} className="animate-pulse mr-2" />
                    Entrando...
                  </> : <>
                    <LogIn size={16} className="mr-2" />
                    Entrar
                  </>}
              </Button>
            </form>

            
          </CardContent>
        </Card>
      </div>
      
      <div className="py-4 text-center text-gray-600 text-sm bg-white border-t">
        © 2025 SalesTrack Mobile
      </div>
    </div>;
};
export default Login;