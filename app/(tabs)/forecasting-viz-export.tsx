import { ScrollView, Text, View, Pressable, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';

interface Forecast {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

interface TrendData {
  slope: number;
  growthRate: number;
  volatility: number;
  seasonality: number;
}

export default function ForecastingVisualization() {
  const colors = useColors();
  const [daysAhead, setDaysAhead] = useState(7);
  const [isExporting, setIsExporting] = useState(false);

  const forecasts: Forecast[] = [
    { date: 'Today', predicted: 1200, lower: 1020, upper: 1380 },
    { date: '+1d', predicted: 1250, lower: 1062, upper: 1437 },
    { date: '+2d', predicted: 1305, lower: 1109, upper: 1500 },
    { date: '+3d', predicted: 1365, lower: 1160, upper: 1569 },
    { date: '+4d', predicted: 1430, lower: 1215, upper: 1644 },
    { date: '+5d', predicted: 1500, lower: 1275, upper: 1725 },
    { date: '+6d', predicted: 1575, lower: 1338, upper: 1811 },
    { date: '+7d', predicted: 1655, lower: 1406, upper: 1903 },
  ];

  const trend: TrendData = {
    slope: 0.045,
    growthRate: 5.2,
    volatility: 0.12,
    seasonality: 0.35,
  };

  const handleExport = async (format: 'csv' | 'json' | 'html') => {
    setIsExporting(true);
    try {
      const data = {
        title: 'Usage Forecasting Report',
        type: 'forecast',
        generatedAt: new Date().toISOString(),
        forecasts: forecasts.slice(0, daysAhead),
        trend,
      };

      let content = '';
      let filename = `forecast_report_${Date.now()}`;

      if (format === 'csv') {
        content = 'Date,Predicted,Lower Bound,Upper Bound\n';
        forecasts.slice(0, daysAhead).forEach(f => {
          content += `${f.date},${f.predicted},${f.lower},${f.upper}\n`;
        });
        filename += '.csv';
      } else if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename += '.json';
      } else if (format === 'html') {
        content = `<!DOCTYPE html>
<html>
<head>
  <title>Forecasting Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .trend { margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Usage Forecasting Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <div class="trend">
    <h2>Trend Analysis</h2>
    <p>Growth Rate: ${trend.growthRate.toFixed(1)}%</p>
    <p>Volatility: ${(trend.volatility * 100).toFixed(0)}%</p>
    <p>Seasonality: ${(trend.seasonality * 100).toFixed(0)}%</p>
  </div>
  <h2>Forecast</h2>
  <table>
    <tr><th>Date</th><th>Predicted</th><th>Lower Bound</th><th>Upper Bound</th></tr>
    ${forecasts.slice(0, daysAhead).map(f => `<tr><td>${f.date}</td><td>${f.predicted}</td><td>${f.lower}</td><td>${f.upper}</td></tr>`).join('')}
  </table>
</body>
</html>`;
        filename += '.html';
      }

      Alert.alert('Export Ready', `${filename} ready to download. Format: ${format.toUpperCase()}`);
    } catch (error) {
      Alert.alert('Export Error', 'Could not prepare export. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const maxValue = Math.max(...forecasts.map(f => f.upper));

  const getBarWidth = (value: number) => {
    return (value / maxValue) * 100;
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Usage Forecasting</Text>
            <Text className="text-sm text-muted">Predict future API usage based on trends</Text>
          </View>

          {/* Trend Analysis */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">📊 Trend Analysis</Text>
            <View
              className="p-4 rounded-lg gap-3"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">Growth Rate</Text>
                  <Text className="text-2xl font-bold text-foreground">{trend.growthRate.toFixed(1)}%</Text>
                  <Text className="text-xs text-success mt-1">↗ Increasing</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">Volatility</Text>
                  <Text className="text-2xl font-bold text-foreground">{(trend.volatility * 100).toFixed(0)}%</Text>
                  <Text className="text-xs text-muted mt-1">Moderate variance</Text>
                </View>
              </View>

              <View className="border-t border-border pt-3 flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">Seasonality</Text>
                  <Text className="text-lg font-bold text-foreground">{(trend.seasonality * 100).toFixed(0)}%</Text>
                  <Text className="text-xs text-muted mt-1">Weekly pattern</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted mb-1">Slope</Text>
                  <Text className="text-lg font-bold text-foreground">{trend.slope.toFixed(3)}</Text>
                  <Text className="text-xs text-muted mt-1">Per day</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Forecast Chart */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">📈 {daysAhead}-Day Forecast</Text>
              <View className="flex-row gap-2">
                {[7, 14, 30].map(days => (
                  <Pressable
                    key={days}
                    onPress={() => setDaysAhead(days)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: daysAhead === days ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: daysAhead === days ? colors.background : colors.foreground,
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {days}d
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View
              className="p-4 rounded-lg gap-4"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              {forecasts.slice(0, daysAhead).map((forecast, idx) => (
                <View key={idx} className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-foreground w-12">{forecast.date}</Text>
                    <View className="flex-1 mx-2">
                      {/* Confidence Interval */}
                      <View
                        className="h-6 rounded relative"
                        style={{
                          backgroundColor: colors.border,
                          width: `${getBarWidth(forecast.upper)}%`,
                        }}
                      >
                        {/* Predicted Value */}
                        <View
                          className="h-6 rounded absolute"
                          style={{
                            backgroundColor: colors.primary,
                            width: `${(forecast.predicted / forecast.upper) * 100}%`,
                          }}
                        />
                      </View>
                    </View>
                    <Text className="text-sm font-bold text-foreground w-16 text-right">
                      {forecast.predicted}
                    </Text>
                  </View>
                  <View className="flex-row justify-between px-1">
                    <Text className="text-xs text-muted">{forecast.lower}</Text>
                    <Text className="text-xs text-muted">{forecast.upper}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Capacity Planning */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">🎯 Capacity Planning</Text>
            <View
              className="p-4 rounded-lg gap-3"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <View className="gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">Recommended Capacity (7d)</Text>
                  <Text className="text-lg font-bold text-foreground">1,903 calls/day</Text>
                </View>
                <View
                  className="h-2 rounded-full"
                  style={{
                    backgroundColor: colors.success,
                    width: '100%',
                  }}
                />
              </View>

              <View className="gap-2 pt-2 border-t border-border">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">Current Quota</Text>
                  <Text className="text-lg font-bold text-foreground">2,500 calls/day</Text>
                </View>
                <Text className="text-xs text-success">✓ 24% headroom available</Text>
              </View>
            </View>
          </View>

          {/* Export Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">📥 Export Forecast</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleExport('csv')}
                disabled={isExporting}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                  opacity: isExporting ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    color: colors.background,
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  CSV
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleExport('json')}
                disabled={isExporting}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                  opacity: isExporting ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    color: colors.background,
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  JSON
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleExport('html')}
                disabled={isExporting}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                  opacity: isExporting ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    color: colors.background,
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  HTML
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Insights */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">💡 Insights</Text>
            <View className="gap-2">
              <View
                className="p-3 rounded-lg flex-row gap-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-lg">📈</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">Growing Trend</Text>
                  <Text className="text-xs text-muted mt-1">
                    Usage is growing at {trend.growthRate.toFixed(1)}% per day. Plan capacity accordingly.
                  </Text>
                </View>
              </View>

              <View
                className="p-3 rounded-lg flex-row gap-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-lg">🔄</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">Weekly Pattern</Text>
                  <Text className="text-xs text-muted mt-1">
                    {(trend.seasonality * 100).toFixed(0)}% seasonality detected. Usage varies by day of week.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
