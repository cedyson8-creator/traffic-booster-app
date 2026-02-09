import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Website } from './types';
import { storageService } from './storage';
import { mockWebsites } from './mock-data';

interface WebsitesContextType {
  websites: Website[];
  addWebsite: (website: Website) => Promise<void>;
  updateWebsite: (id: string, updates: Partial<Website>) => Promise<void>;
  deleteWebsite: (id: string) => Promise<void>;
  isLoading: boolean;
}

const WebsitesContext = createContext<WebsitesContextType | undefined>(undefined);

export function WebsitesProvider({ children }: { children: React.ReactNode }) {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load websites on mount
  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      setIsLoading(true);
      const saved = await storageService.getWebsites();
      // Combine mock data with saved websites
      const combined = [...mockWebsites, ...saved];
      setWebsites(combined);
    } catch (error) {
      console.error('Error loading websites:', error);
      // Fallback to mock data
      setWebsites(mockWebsites);
    } finally {
      setIsLoading(false);
    }
  };

  const addWebsite = async (website: Website) => {
    try {
      await storageService.addWebsite(website);
      setWebsites((prev) => [...prev, website]);
    } catch (error) {
      console.error('Error adding website:', error);
      throw error;
    }
  };

  const updateWebsite = async (id: string, updates: Partial<Website>) => {
    try {
      await storageService.updateWebsite(id, updates);
      setWebsites((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
      );
    } catch (error) {
      console.error('Error updating website:', error);
      throw error;
    }
  };

  const deleteWebsite = async (id: string) => {
    try {
      await storageService.deleteWebsite(id);
      setWebsites((prev) => prev.filter((w) => w.id !== id));
    } catch (error) {
      console.error('Error deleting website:', error);
      throw error;
    }
  };

  return (
    <WebsitesContext.Provider
      value={{
        websites,
        addWebsite,
        updateWebsite,
        deleteWebsite,
        isLoading,
      }}
    >
      {children}
    </WebsitesContext.Provider>
  );
}

export function useWebsites() {
  const context = useContext(WebsitesContext);
  if (!context) {
    throw new Error('useWebsites must be used within WebsitesProvider');
  }
  return context;
}
