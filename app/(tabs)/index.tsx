import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Scan = {
  id: string;
  created_at: string;
  total_items: number;
  total_revenue_lost: number;
  insight: string | null;
  items: unknown[];
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getLast7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function HomeScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [scanDates, setScanDates] = useState<Date[]>([]);
  const [lastScan, setLastScan] = useState<Scan | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [weeklyRes, lastScanRes] = await Promise.all([
        supabase
          .from('scans')
          .select('created_at, total_revenue_lost')
          .gte('created_at', sevenDaysAgo.toISOString()),
        supabase
          .from('scans')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (weeklyRes.data) {
        const total = weeklyRes.data.reduce(
          (sum, row) => sum + (row.total_revenue_lost ?? 0),
          0
        );
        setWeeklyRevenue(total);
        setScanDates(weeklyRes.data.map(row => new Date(row.created_at)));
      }

      if (lastScanRes.data) {
        setLastScan(lastScanRes.data as Scan);
      } else {
        setLastScan(null);
      }
    } catch (e) {
      console.error('[Home] fetchData error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const last7Days = getLast7Days();
  const today = new Date();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>{getGreeting()}</Text>

      {/* Hero card — weekly revenue lost */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Revenue lost this week</Text>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 8 }} />
        ) : (
          <Text style={styles.heroValue}>{formatCurrency(weeklyRevenue)}</Text>
        )}
      </View>

      {/* 7-day calendar strip */}
      <View style={styles.calendarStrip}>
        {last7Days.map((day, i) => {
          const hasScan = scanDates.some(sd => isSameDay(sd, day));
          const isToday = isSameDay(day, today);
          return (
            <View key={i} style={styles.dayCell}>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {DAY_LABELS[day.getDay()]}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  hasScan ? styles.dayDotFilled : styles.dayDotEmpty,
                  isToday && styles.dayDotToday,
                ]}
              />
            </View>
          );
        })}
      </View>

      {/* Last scan card */}
      {!loading && lastScan ? (
        <TouchableOpacity
          style={styles.lastScanCard}
          onPress={() =>
            router.push({
              pathname: '/results',
              params: { analysis: JSON.stringify({ items: lastScan.items, summary: { total_items: lastScan.total_items, total_revenue_lost: lastScan.total_revenue_lost, insight: lastScan.insight } }) },
            })
          }
          activeOpacity={0.75}
        >
          <Text style={styles.lastScanLabel}>Last scan</Text>
          <Text style={styles.lastScanDate}>{formatDate(lastScan.created_at)}</Text>
          <View style={styles.lastScanRow}>
            <Text style={styles.lastScanMeta}>{lastScan.total_items} items</Text>
            <Text style={styles.lastScanRevenue}>
              {formatCurrency(lastScan.total_revenue_lost)}
            </Text>
          </View>
          {lastScan.insight ? (
            <Text style={styles.lastScanInsight} numberOfLines={2}>
              {lastScan.insight}
            </Text>
          ) : null}
          <Text style={styles.lastScanCta}>View full breakdown →</Text>
        </TouchableOpacity>
      ) : !loading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No scans yet — tap the camera button at closing time.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 6,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  dayCell: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  dayLabelToday: {
    color: '#111',
    fontWeight: '600',
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayDotFilled: {
    backgroundColor: '#111',
  },
  dayDotEmpty: {
    backgroundColor: '#e0e0e0',
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: '#111',
  },
  lastScanCard: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 18,
    backgroundColor: '#fafafa',
  },
  lastScanLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
  },
  lastScanDate: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  lastScanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lastScanMeta: {
    fontSize: 14,
    color: '#666',
  },
  lastScanRevenue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#c00',
  },
  lastScanInsight: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  lastScanCta: {
    fontSize: 13,
    color: '#0066cc',
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
