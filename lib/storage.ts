import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Website } from './types';

const WEBSITES_KEY = 'traffic_booster_websites';

export const storageService = {
  async getWebsites(): Promise<Website[]> {
    try {
      const data = await AsyncStorage.getItem(WEBSITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading websites:', error);
      return [];
    }
  },

  async addWebsite(website: Website): Promise<void> {
    try {
      const existing = await this.getWebsites();
      const updated = [...existing, website];
      await AsyncStorage.setItem(WEBSITES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding website:', error);
      throw error;
    }
  },

  async updateWebsite(id: string, updates: Partial<Website>): Promise<void> {
    try {
      const websites = await this.getWebsites();
      const updated = websites.map((w) => (w.id === id ? { ...w, ...updates } : w));
      await AsyncStorage.setItem(WEBSITES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating website:', error);
      throw error;
    }
  },

  async deleteWebsite(id: string): Promise<void> {
    try {
      const websites = await this.getWebsites();
      const updated = websites.filter((w) => w.id !== id);
      await AsyncStorage.setItem(WEBSITES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting website:', error);
      throw error;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(WEBSITES_KEY);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};
