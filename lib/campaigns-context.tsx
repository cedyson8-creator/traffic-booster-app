import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Campaign } from './types';
import { campaignsStorageService } from './campaigns-storage';
import { mockCampaigns } from './mock-data';

interface CampaignsContextType {
  campaigns: Campaign[];
  addCampaign: (campaign: Campaign) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  isLoading: boolean;
}

const CampaignsContext = createContext<CampaignsContextType | undefined>(undefined);

export function CampaignsProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const saved = await campaignsStorageService.getCampaigns();
      // Combine mock data with saved campaigns
      const combined = [...mockCampaigns, ...saved];
      setCampaigns(combined);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      // Fallback to mock data
      setCampaigns(mockCampaigns);
    } finally {
      setIsLoading(false);
    }
  };

  const addCampaign = async (campaign: Campaign) => {
    try {
      await campaignsStorageService.addCampaign(campaign);
      setCampaigns((prev) => [...prev, campaign]);
    } catch (error) {
      console.error('Error adding campaign:', error);
      throw error;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      await campaignsStorageService.updateCampaign(id, updates);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      await campaignsStorageService.deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  };

  return (
    <CampaignsContext.Provider
      value={{
        campaigns,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        isLoading,
      }}
    >
      {children}
    </CampaignsContext.Provider>
  );
}

export function useCampaigns() {
  const context = useContext(CampaignsContext);
  if (!context) {
    throw new Error('useCampaigns must be used within CampaignsProvider');
  }
  return context;
}
