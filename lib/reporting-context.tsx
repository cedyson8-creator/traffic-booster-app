import React, { createContext, useContext, useState, useCallback } from "react";
import {
  KPI,
  CustomDashboard,
  AlertThreshold,
  StakeholderReport,
  ReportingMetrics,
} from "./reporting-types";
import {
  createKPI,
  generateReportingMetrics,
  comparePerformances,
} from "./reporting-service";

interface ReportingContextType {
  kpis: KPI[];
  dashboards: CustomDashboard[];
  alerts: AlertThreshold[];
  stakeholderReports: StakeholderReport[];
  metrics: ReportingMetrics | null;
  addKPI: (name: string, metric: string, current: number, target: number) => void;
  updateKPI: (id: string, currentValue: number) => void;
  deleteKPI: (id: string) => void;
  createDashboard: (name: string, metrics: string[]) => void;
  deleteDashboard: (id: string) => void;
  addAlert: (metric: string, operator: string, value: number) => void;
  deleteAlert: (id: string) => void;
  addStakeholderReport: (email: string, frequency: string) => void;
  deleteStakeholderReport: (id: string) => void;
  generateMetrics: (campaigns: any[], segments: any[]) => void;
}

const ReportingContext = createContext<ReportingContextType | undefined>(undefined);

export function ReportingProvider({ children }: { children: React.ReactNode }) {
  const [kpis, setKpis] = useState<KPI[]>([
    createKPI("Monthly Visits", "visits", 45230, 50000, "visits"),
    createKPI("Conversion Rate", "conversion_rate", 2.8, 3.5, "%"),
    createKPI("Average ROI", "roi", 125, 150, "%"),
  ]);

  const [dashboards, setDashboards] = useState<CustomDashboard[]>([
    {
      id: "dash_1",
      name: "Executive Dashboard",
      description: "High-level metrics for executives",
      metrics: ["visits", "conversions", "revenue", "roi"],
      timeRange: "month",
      refreshInterval: 3600,
      isPublic: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]);

  const [alerts, setAlerts] = useState<AlertThreshold[]>([]);
  const [stakeholderReports, setStakeholderReports] = useState<StakeholderReport[]>([]);
  const [metrics, setMetrics] = useState<ReportingMetrics | null>(null);

  const addKPI = useCallback((name: string, metric: string, current: number, target: number) => {
    const newKPI = createKPI(name, metric as any, current, target);
    setKpis((prev) => [...prev, newKPI]);
  }, []);

  const updateKPI = useCallback((id: string, currentValue: number) => {
    setKpis((prev) =>
      prev.map((kpi) =>
        kpi.id === id
          ? {
              ...kpi,
              currentValue,
              lastUpdated: Date.now(),
              status:
                currentValue >= kpi.targetValue
                  ? "on_track"
                  : currentValue >= kpi.targetValue * 0.8
                    ? "at_risk"
                    : "off_track",
            }
          : kpi
      )
    );
  }, []);

  const deleteKPI = useCallback((id: string) => {
    setKpis((prev) => prev.filter((kpi) => kpi.id !== id));
  }, []);

  const createDashboard = useCallback((name: string, dashboardMetrics: string[]) => {
    const newDashboard: CustomDashboard = {
      id: `dash_${Date.now()}`,
      name,
      description: `Custom dashboard: ${name}`,
      metrics: dashboardMetrics as any,
      timeRange: "month",
      refreshInterval: 1800,
      isPublic: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDashboards((prev) => [...prev, newDashboard]);
  }, []);

  const deleteDashboard = useCallback((id: string) => {
    setDashboards((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const addAlert = useCallback((metric: string, operator: string, value: number) => {
    const newAlert: AlertThreshold = {
      id: `alert_${Date.now()}`,
      metric: metric as any,
      operator: operator as any,
      value,
      severity: value > 1000 ? "critical" : value > 500 ? "high" : "medium",
      enabled: true,
      notifyEmail: true,
      notifyPush: true,
      createdAt: Date.now(),
    };
    setAlerts((prev) => [...prev, newAlert]);
  }, []);

  const deleteAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addStakeholderReport = useCallback((email: string, frequency: string) => {
    const newReport: StakeholderReport = {
      id: `report_${Date.now()}`,
      name: `Report for ${email}`,
      recipientEmail: email,
      frequency: frequency as any,
      metrics: ["visits", "conversions", "roi"],
      includeCharts: true,
      includeInsights: true,
      includeRecommendations: true,
      isActive: true,
      nextSendAt: Date.now() + 86400000,
      createdAt: Date.now(),
    };
    setStakeholderReports((prev) => [...prev, newReport]);
  }, []);

  const deleteStakeholderReport = useCallback((id: string) => {
    setStakeholderReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const generateMetrics = useCallback((campaigns: any[], segments: any[]) => {
    const trendData: Record<string, Array<{ date: number; value: number }>> = {
      visits: Array.from({ length: 30 }, (_, i) => ({
        date: Date.now() - (30 - i) * 86400000,
        value: 40000 + Math.random() * 10000,
      })),
      conversions: Array.from({ length: 30 }, (_, i) => ({
        date: Date.now() - (30 - i) * 86400000,
        value: 1000 + Math.random() * 500,
      })),
      revenue: Array.from({ length: 30 }, (_, i) => ({
        date: Date.now() - (30 - i) * 86400000,
        value: 50000 + Math.random() * 20000,
      })),
    };

    const reportingMetrics = generateReportingMetrics(kpis, trendData as any, campaigns, segments);
    setMetrics(reportingMetrics);
  }, [kpis]);

  const value: ReportingContextType = {
    kpis,
    dashboards,
    alerts,
    stakeholderReports,
    metrics,
    addKPI,
    updateKPI,
    deleteKPI,
    createDashboard,
    deleteDashboard,
    addAlert,
    deleteAlert,
    addStakeholderReport,
    deleteStakeholderReport,
    generateMetrics,
  };

  return <ReportingContext.Provider value={value}>{children}</ReportingContext.Provider>;
}

export function useReporting() {
  const context = useContext(ReportingContext);
  if (!context) {
    throw new Error("useReporting must be used within ReportingProvider");
  }
  return context;
}
