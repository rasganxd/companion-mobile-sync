
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface SalesRepProfile {
  id: string;
  sales_rep_id: string;
  name: string;
  email?: string;
  phone?: string;
  code: number;
}

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [salesRep, setSalesRep] = useState<SalesRepProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadSalesRepProfile(session.user.id);
      }
      
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadSalesRepProfile(session.user.id);
        } else {
          setSalesRep(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadSalesRepProfile = async (userId: string) => {
    try {
      // Query sales_reps table directly using the user ID
      const { data: salesRepData, error: salesRepError } = await supabase
        .from('sales_reps')
        .select('*')
        .eq('id', userId)
        .single();

      if (salesRepError && salesRepError.code !== 'PGRST116') {
        console.error('Error loading sales rep:', salesRepError);
        return;
      }

      if (salesRepData) {
        setSalesRep({
          id: salesRepData.id,
          sales_rep_id: salesRepData.id,
          name: salesRepData.name,
          email: salesRepData.email,
          phone: salesRepData.phone,
          code: salesRepData.code
        });
      }
    } catch (error) {
      console.error('Error loading sales rep profile:', error);
    }
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSalesRep(null);
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isAuthenticated = () => user !== null;

  return {
    user,
    salesRep,
    isLoading,
    isAuthenticated,
    signInWithEmailPassword,
    signOut,
    loadSalesRepProfile
  };
};
