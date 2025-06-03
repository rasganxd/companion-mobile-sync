
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useLocalAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing sync data on load
    checkInitialSyncStatus();
  }, []);

  const checkInitialSyncStatus = async () => {
    try {
      // Check if initial sync has been completed
      const hasSync = hasInitialSync();
      
      if (hasSync) {
        console.log('✅ Initial sync found, user can access app');
      } else {
        console.log('❌ No initial sync found, redirect to sync screen');
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear all sync data
      localStorage.removeItem('desktop_ip');
      localStorage.removeItem('last_sync');
      localStorage.removeItem('sales_rep_code');
      localStorage.removeItem('sync_version');
      
      navigate('/initial-sync');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const hasInitialSync = () => {
    return localStorage.getItem('desktop_ip') !== null && 
           localStorage.getItem('sales_rep_code') !== null;
  };

  return {
    isLoading,
    hasInitialSync,
    signOut
  };
};
