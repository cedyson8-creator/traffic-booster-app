import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AudienceSegment,
  SegmentPerformance,
  AudienceProfile,
} from "./segmentation-types";
import {
  createSegment,
  estimateSegmentSize,
  calculateEngagementScore,
  calculateConversionRate,
  generateSegmentPerformance,
  suggestLookalikeSegment,
  compareSegments,
} from "./segmentation-service";

interface SegmentationContextType {
  segments: AudienceSegment[];
  performances: Record<string, SegmentPerformance[]>;
  audienceProfiles: AudienceProfile[];
  addSegment: (segment: AudienceSegment) => Promise<void>;
  updateSegment: (segment: AudienceSegment) => Promise<void>;
  deleteSegment: (segmentId: string) => Promise<void>;
  getSegment: (segmentId: string) => AudienceSegment | undefined;
  getSegmentPerformance: (segmentId: string) => SegmentPerformance[];
  addAudienceProfile: (profile: AudienceProfile) => Promise<void>;
  removeAudienceProfile: (profileId: string) => Promise<void>;
  suggestLookalike: (segmentId: string) => Promise<AudienceSegment | null>;
  compareSegmentsScore: (segment1Id: string, segment2Id: string) => number;
  loadSegments: () => Promise<void>;
}

const SegmentationContext = createContext<SegmentationContextType | undefined>(
  undefined
);

export function SegmentationProvider({ children }: { children: ReactNode }) {
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [performances, setPerformances] = useState<Record<string, SegmentPerformance[]>>({});
  const [audienceProfiles, setAudienceProfiles] = useState<AudienceProfile[]>([]);

  // Load segments from storage
  const loadSegments = async () => {
    try {
      const stored = await AsyncStorage.getItem("@segments");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSegments(parsed);

        // Generate performance data for each segment
        const perfData: Record<string, SegmentPerformance[]> = {};
        for (const segment of parsed) {
          const perf = generateSegmentPerformance(segment, segment.size);
          perfData[segment.id] = [perf];
        }
        setPerformances(perfData);
      }

      const storedProfiles = await AsyncStorage.getItem("@audience_profiles");
      if (storedProfiles) {
        setAudienceProfiles(JSON.parse(storedProfiles));
      }
    } catch (error) {
      console.error("Failed to load segments:", error);
    }
  };

  // Save segments to storage
  const saveSegments = async (newSegments: AudienceSegment[]) => {
    try {
      await AsyncStorage.setItem("@segments", JSON.stringify(newSegments));
      setSegments(newSegments);
    } catch (error) {
      console.error("Failed to save segments:", error);
    }
  };

  // Add new segment
  const addSegment = async (segment: AudienceSegment) => {
    const updatedSegment = {
      ...segment,
      size: estimateSegmentSize(segment),
      engagement: calculateEngagementScore(segment),
      conversionRate: calculateConversionRate(segment),
    };

    const newSegments = [...segments, updatedSegment];
    await saveSegments(newSegments);

    // Generate performance data
    const perf = generateSegmentPerformance(updatedSegment, updatedSegment.size);
    setPerformances({
      ...performances,
      [updatedSegment.id]: [perf],
    });
  };

  // Update segment
  const updateSegment = async (updatedSegment: AudienceSegment) => {
    const newSegments = segments.map((s) =>
      s.id === updatedSegment.id
        ? {
            ...updatedSegment,
            size: estimateSegmentSize(updatedSegment),
            engagement: calculateEngagementScore(updatedSegment),
            conversionRate: calculateConversionRate(updatedSegment),
            updatedAt: Date.now(),
          }
        : s
    );
    await saveSegments(newSegments);
  };

  // Delete segment
  const deleteSegment = async (segmentId: string) => {
    const newSegments = segments.filter((s) => s.id !== segmentId);
    await saveSegments(newSegments);

    const newProfiles = audienceProfiles.filter((p) => p.segmentId !== segmentId);
    await AsyncStorage.setItem("@audience_profiles", JSON.stringify(newProfiles));
    setAudienceProfiles(newProfiles);

    const newPerformances = { ...performances };
    delete newPerformances[segmentId];
    setPerformances(newPerformances);
  };

  // Get segment by ID
  const getSegment = (segmentId: string) => {
    return segments.find((s) => s.id === segmentId);
  };

  // Get segment performance
  const getSegmentPerformance = (segmentId: string) => {
    return performances[segmentId] || [];
  };

  // Add audience profile
  const addAudienceProfile = async (profile: AudienceProfile) => {
    const newProfiles = [...audienceProfiles, profile];
    await AsyncStorage.setItem("@audience_profiles", JSON.stringify(newProfiles));
    setAudienceProfiles(newProfiles);
  };

  // Remove audience profile
  const removeAudienceProfile = async (profileId: string) => {
    const newProfiles = audienceProfiles.filter((p) => p.segmentId !== profileId);
    await AsyncStorage.setItem("@audience_profiles", JSON.stringify(newProfiles));
    setAudienceProfiles(newProfiles);
  };

  // Suggest lookalike segment
  const suggestLookalike = async (segmentId: string) => {
    const baseSegment = getSegment(segmentId);
    if (!baseSegment) return null;

    const lookalike = suggestLookalikeSegment(baseSegment);
    return lookalike;
  };

  // Compare segments
  const compareSegmentsScore = (segment1Id: string, segment2Id: string) => {
    const seg1 = getSegment(segment1Id);
    const seg2 = getSegment(segment2Id);

    if (!seg1 || !seg2) return 0;
    return compareSegments(seg1, seg2);
  };

  useEffect(() => {
    loadSegments();
  }, []);

  return (
    <SegmentationContext.Provider
      value={{
        segments,
        performances,
        audienceProfiles,
        addSegment,
        updateSegment,
        deleteSegment,
        getSegment,
        getSegmentPerformance,
        addAudienceProfile,
        removeAudienceProfile,
        suggestLookalike,
        compareSegmentsScore,
        loadSegments,
      }}
    >
      {children}
    </SegmentationContext.Provider>
  );
}

export function useSegmentation() {
  const context = useContext(SegmentationContext);
  if (!context) {
    throw new Error("useSegmentation must be used within SegmentationProvider");
  }
  return context;
}
