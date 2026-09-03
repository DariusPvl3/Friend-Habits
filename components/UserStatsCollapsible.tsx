import React, { useState, useMemo, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, LayoutAnimation, Platform, UIManager } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BarChart } from "react-native-chart-kit";
import { defaultStyles } from "@/constants/GlobalStyles";
import { generateChartData } from "@/services/statisticsService";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedMaterialIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

const screenWidth = Dimensions.get("window").width;

interface Props {
  stats: {
    longestStreak: number;
    topHabitName: string;
    averageProgress: number;
    totalCompletions: number;
    perfectDays: number;
  };
  progressHistory?: Record<string, number>;
  accountCreatedAt?: Date | null;
  currentColors: any;
}

export default function UserStatsCollapsible({ stats, progressHistory = {}, accountCreatedAt, currentColors }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [periodOffset, setPeriodOffset] = useState(0);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    setPeriodOffset(0);
  }, [timeframe]);

  const { chartData, periodLabel, periodAverage, periodPerfectDays } = React.useMemo(() => {
  const result = generateChartData(timeframe, progressHistory, accountCreatedAt, periodOffset);

  return {
    chartData: { labels: result.labels, datasets: result.datasets },
    periodLabel: result.periodLabel,
    periodAverage: result.periodAverage,
    periodPerfectDays: result.periodPerfectDays
  };
  }, [timeframe, progressHistory, accountCreatedAt, periodOffset]);

  const chartConfig = {
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    backgroundGradientFrom: currentColors.background,
    backgroundGradientTo: currentColors.background,
    color: (opacity = 1) => currentColors.tint,
    labelColor: (opacity = 1) => '#94A3B8',
    
    barPercentage: timeframe === 'year' ? 0.35 : 0.6, 
    fillShadowGradient: currentColors.tint,
    fillShadowGradientOpacity: 1,
    decimalPlaces: 1,
    
    propsForLabels: {
      fontSize: timeframe === 'year' ? 9 : 12,
    }
  };

  return (
    <View style={{ marginBottom: 0 }}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Text style={[defaultStyles.headerTitle, { color: currentColors.text, marginBottom: 0 }]}>
          User Statistics
        </Text>
        
        <AnimatedMaterialIcon
          name="chevron-down"
          size={28}
          color={currentColors.text}
          style={{ transform: [{ rotate: spin }] }} 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.statsCard, {backgroundColor: currentColors.cardBackground || 'rgba(148, 163, 184, 0.1)'}]}>
           
          {/* HERO STREAK SECTION */}
          <View style={styles.heroStreakContainer}>
            <Text style={styles.streakFlame}>🔥</Text>
            <View>
              <Text style={[styles.heroStreakNumber, { color: currentColors.text }]}>
                {stats.longestStreak} Days
              </Text>
              <Text style={styles.heroStreakSubtitle}>
                Best: {stats.topHabitName}
              </Text>
            </View>
          </View>

          {/* TIMEFRAME SWITCHER */}
          <View style={styles.segmentedControl}>
            {(['week', 'month', 'year'] as const).map((tf) => (
              <TouchableOpacity 
                key={tf}
                style={[
                  styles.segmentButton, 
                  timeframe === tf && { backgroundColor: currentColors.tint }
                ]}
                onPress={() => setTimeframe(tf)}
              >
                <Text style={[
                  styles.segmentText,
                  timeframe === tf ? { color: '#FFF' } : { color: currentColors.text }
                ]}>
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TIMEFRAME PAGINATION */}
          <View style={styles.paginationRow}>
            <TouchableOpacity onPress={() => setPeriodOffset(prev => prev + 1)}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={currentColors.tint} />
            </TouchableOpacity>

            <Text style={[styles.periodLabel, { color: currentColors.text }]}>
              {periodLabel}
            </Text>

            <TouchableOpacity 
              onPress={() => setPeriodOffset(prev => Math.max(0, prev - 1))}
              disabled={periodOffset === 0}
            >
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color={periodOffset === 0 ? 'rgba(148, 163, 184, 0.3)' : currentColors.tint} 
              />
            </TouchableOpacity>
          </View>

          {/* DYNAMIC BAR CHART */}
          <View style={styles.chartWrapper}>
            <BarChart
              data={chartData}
              width={screenWidth - 80} // Account for padding
              height={180}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={chartConfig}
              fromZero
              fromNumber={100}
              segments={4}
              showValuesOnTopOfBars
              
            />
          </View>

          {/* SUMMARY METRICS */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{periodAverage}%</Text>
              <Text style={styles.metricLabel}>Avg Progress</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{periodPerfectDays}</Text>
              <Text style={styles.metricLabel}>Perfect Days</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    marginBottom: 16,
    width: '100%'
  },
  statsCard: { padding: 16, borderRadius: 20 },
  
  heroStreakContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  streakFlame: { fontSize: 48 },
  heroStreakNumber: { fontSize: 28, fontWeight: 'bold' },
  heroStreakSubtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },

  segmentedControl: { flexDirection: 'row', backgroundColor: 'rgba(148, 163, 184, 0.2)', borderRadius: 12, padding: 4, marginBottom: 24 },
  segmentButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '600' },

  chartWrapper: { alignItems: 'center', marginBottom: 24 },

  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(148, 163, 184, 0.2)', paddingTop: 16 },
  metricBox: { alignItems: 'center', flex: 1 },
  metricValue: { fontSize: 20, fontWeight: 'bold', color: '#94A3B8', marginBottom: 4 },
  metricLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },

  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 16 },
  periodLabel: { fontSize: 16, fontWeight: '700' },
});