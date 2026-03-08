import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type BakeryItem = {
  name: string;
  quantity: number;
  unit_price: number;
  cost_to_make: number;
  total_revenue_lost: number;
};

type Scan = {
  id: string;
  created_at: string;
  total_items: number;
  total_revenue_lost: number;
  insight: string | null;
  items: BakeryItem[];
  photo_url: string | null;
};

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

export default function HistoryScreen() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;

      setScans(data as Scan[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load scans');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchScans();
    }, [fetchScans])
  );

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchScans} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (scans.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          No scans yet — take your first photo at closing time.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>History</Text>
      {scans.map(scan => {
        const isExpanded = expandedId === scan.id;
        return (
          <TouchableOpacity
            key={scan.id}
            style={styles.card}
            onPress={() => toggleExpand(scan.id)}
            activeOpacity={0.75}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardDate}>{formatDate(scan.created_at)}</Text>
              <Text style={styles.cardRevenue}>{formatCurrency(scan.total_revenue_lost)}</Text>
            </View>
            <Text style={styles.cardMeta}>{scan.total_items} items wasted</Text>
            {scan.insight ? (
              <Text style={styles.cardInsight} numberOfLines={isExpanded ? undefined : 2}>
                {scan.insight}
              </Text>
            ) : null}

            {isExpanded && Array.isArray(scan.items) && scan.items.length > 0 && (
              <View style={styles.itemList}>
                <Text style={styles.itemListTitle}>Breakdown</Text>
                {scan.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity} × {formatCurrency(item.unit_price)} ={' '}
                      {formatCurrency(item.total_revenue_lost)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.expandHint}>{isExpanded ? 'Collapse ▲' : 'Show breakdown ▼'}</Text>
          </TouchableOpacity>
        );
      })}
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
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#c00',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#111',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  cardRevenue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#c00',
  },
  cardMeta: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  cardInsight: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 8,
  },
  itemList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  itemListTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  itemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 13,
    color: '#666',
  },
  expandHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'right',
  },
});
