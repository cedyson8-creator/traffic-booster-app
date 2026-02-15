import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { cn } from '@/lib/utils';

export interface DashboardFilterOptions {
  dateRange: 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  trafficSource?: 'all' | 'organic' | 'paid' | 'direct' | 'referral';
  campaign?: string;
}

interface DashboardFiltersProps {
  onFilterChange: (filters: DashboardFilterOptions) => void;
  initialFilters?: DashboardFilterOptions;
}

export function DashboardFilters({ onFilterChange, initialFilters }: DashboardFiltersProps) {
  const [filters, setFilters] = useState<DashboardFilterOptions>(
    initialFilters || {
      dateRange: 'month',
      trafficSource: 'all',
    }
  );

  const handleDateRangeChange = (range: 'today' | 'week' | 'month' | 'custom') => {
    const newFilters = { ...filters, dateRange: range };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTrafficSourceChange = (source: 'all' | 'organic' | 'paid' | 'direct' | 'referral') => {
    const newFilters = { ...filters, trafficSource: source };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCampaignChange = (campaign: string) => {
    const newFilters = { ...filters, campaign };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row gap-2 px-4">
        {/* Date Range Filters */}
        <FilterButton
          label="Today"
          active={filters.dateRange === 'today'}
          onPress={() => handleDateRangeChange('today')}
        />
        <FilterButton
          label="Week"
          active={filters.dateRange === 'week'}
          onPress={() => handleDateRangeChange('week')}
        />
        <FilterButton
          label="Month"
          active={filters.dateRange === 'month'}
          onPress={() => handleDateRangeChange('month')}
        />

        {/* Traffic Source Filters */}
        <FilterButton
          label="All Sources"
          active={filters.trafficSource === 'all'}
          onPress={() => handleTrafficSourceChange('all')}
        />
        <FilterButton
          label="Organic"
          active={filters.trafficSource === 'organic'}
          onPress={() => handleTrafficSourceChange('organic')}
        />
        <FilterButton
          label="Paid"
          active={filters.trafficSource === 'paid'}
          onPress={() => handleTrafficSourceChange('paid')}
        />
        <FilterButton
          label="Direct"
          active={filters.trafficSource === 'direct'}
          onPress={() => handleTrafficSourceChange('direct')}
        />
      </View>
    </ScrollView>
  );
}

interface FilterButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterButton({ label, active, onPress }: FilterButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        className={cn(
          'px-4 py-2 rounded-full border',
          active
            ? 'bg-primary border-primary'
            : 'bg-surface border-border'
        )}
      >
        <Text
          className={cn(
            'text-sm font-semibold',
            active ? 'text-background' : 'text-foreground'
          )}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
