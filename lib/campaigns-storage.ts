import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Campaign } from './types';

const CAMPAIGNS_KEY = 'traffic_booster_campaigns';

export const campaignsStorageService = {
  async getCampaigns(): Promise<Campaign[]> {
    try {
      const data = await AsyncStorage.getItem(CAMPAIGNS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading campaigns:', error);
      return [];
    }
  },

  async addCampaign(campaign: Campaign): Promise<void> {
    try {
      const existing = await this.getCampaigns();
      const updated = [...existing, campaign];
      await AsyncStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding campaign:', error);
      throw error;
    }
  },

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<void> {
    try {
      const campaigns = await this.getCampaigns();
      const updated = campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c));
      await AsyncStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  },

  async deleteCampaign(id: string): Promise<void> {
    try {
      const campaigns = await this.getCampaigns();
      const updated = campaigns.filter((c) => c.id !== id);
      await AsyncStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CAMPAIGNS_KEY);
    } catch (error) {
      console.error('Error clearing campaigns:', error);
      throw error;
    }
  },
};
