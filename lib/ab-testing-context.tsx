import React, { createContext, useContext, useState, useCallback } from 'react';
import { ABTest, TestVariation } from './ab-testing-types';

interface ABTestingContextType {
  tests: ABTest[];
  addTest: (test: ABTest) => Promise<void>;
  updateTest: (id: string, updates: Partial<ABTest>) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  getTestsForCampaign: (campaignId: string) => ABTest[];
  updateVariation: (testId: string, variationId: string, updates: Partial<TestVariation>) => Promise<void>;
  isLoading: boolean;
}

const ABTestingContext = createContext<ABTestingContextType | undefined>(undefined);

export function ABTestingProvider({ children }: { children: React.ReactNode }) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTest = useCallback(async (test: ABTest) => {
    try {
      setIsLoading(true);
      // In production, this would save to backend/database
      setTests((prev) => [...prev, test]);
      console.log('[ABTestingContext] Test added:', test.id);
    } catch (error) {
      console.error('[ABTestingContext] Failed to add test:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTest = useCallback(async (id: string, updates: Partial<ABTest>) => {
    try {
      setIsLoading(true);
      setTests((prev) =>
        prev.map((test) =>
          test.id === id
            ? { ...test, ...updates, updatedAt: Date.now() }
            : test
        )
      );
      console.log('[ABTestingContext] Test updated:', id);
    } catch (error) {
      console.error('[ABTestingContext] Failed to update test:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTest = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setTests((prev) => prev.filter((test) => test.id !== id));
      console.log('[ABTestingContext] Test deleted:', id);
    } catch (error) {
      console.error('[ABTestingContext] Failed to delete test:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTestsForCampaign = useCallback(
    (campaignId: string) => {
      return tests.filter((test) => test.campaignId === campaignId);
    },
    [tests]
  );

  const updateVariation = useCallback(
    async (testId: string, variationId: string, updates: Partial<TestVariation>) => {
      try {
        setIsLoading(true);
        setTests((prev) =>
          prev.map((test) =>
            test.id === testId
              ? {
                  ...test,
                  variations: test.variations.map((v) =>
                    v.id === variationId ? { ...v, ...updates } : v
                  ),
                  updatedAt: Date.now(),
                }
              : test
          )
        );
        console.log('[ABTestingContext] Variation updated:', variationId);
      } catch (error) {
        console.error('[ABTestingContext] Failed to update variation:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const value: ABTestingContextType = {
    tests,
    addTest,
    updateTest,
    deleteTest,
    getTestsForCampaign,
    updateVariation,
    isLoading,
  };

  return (
    <ABTestingContext.Provider value={value}>
      {children}
    </ABTestingContext.Provider>
  );
}

export function useABTesting() {
  const context = useContext(ABTestingContext);
  if (!context) {
    throw new Error('useABTesting must be used within ABTestingProvider');
  }
  return context;
}
