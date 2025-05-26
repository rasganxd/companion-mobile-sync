
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import AppButton from '@/components/AppButton';
import { KeyRound, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
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
    
    if (password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);

    try {
      // Convert username to number since code field is integer
      const codeNumber = parseInt(username);
      if (isNaN(codeNumber)) {
        toast.error('Código deve ser um número válido');
        return;
      }

      // Query the sales_reps table to authenticate the user
      const { data: salesRep, error: salesRepError } = await supabase
        .from('sales_reps')
        .select('*')
        .eq('code', codeNumber)
        .eq('active', true)
        .single();

      if (salesRepError || !salesRep) {
        toast.error('Vendedor não encontrado ou inativo');
        return;
      }

      // Create email based on sales rep data
      const tempEmail = salesRep.email || `salesrep_${salesRep.code}@company.local`;

      // Try to sign in with the provided password - NO FALLBACKS
      const { data: authResult, error: authError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: password,
      });

      if (authError) {
        console.error('Authentication failed:', authError.message);
        
        // Provide specific error messages
        if (authError.message.includes('Invalid login credentials')) {
          toast.error('Código ou senha incorretos');
        } else if (authError.message.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Entre em contato com o administrador.');
        } else {
          toast.error('Erro de autenticação. Verifique suas credenciais.');
        }
        return;
      }

      if (!authResult.user) {
        toast.error('Falha na autenticação');
        return;
      }

      // Store the authenticated sales rep data
      localStorage.setItem('authenticated_sales_rep', JSON.stringify(salesRep));
      
      toast.success(`Bem-vindo, ${salesRep.name}!`);
      navigate('/home');
      
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
                  minLength={6}
                  disabled={isLoading}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <KeyRound size={16} />
                </div>
              </div>
              <p className="text-xs text-gray-500">Mínimo de 6 caracteres</p>
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
              Problemas para acessar? Entre em contato com o administrador.
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
