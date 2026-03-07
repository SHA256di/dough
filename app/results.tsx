import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type BakeryItem = {
  name: string;
  quantity: number;
  unit_price: number;
  cost_to_make: number;
  total_revenue_lost: number;
};

type AnalysisResult = {
  items: BakeryItem[];
  summary: {
    total_items: number;
    total_revenue_lost: number;
    insight: string;
  };
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function ResultsScreen() {
  const { analysis } = useLocalSearchParams<{ analysis: string }>();
  const router = useRouter();

  if (!analysis) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No analysis data.</Text>
      </View>
    );
  }

  let result: AnalysisResult;
  try {
    result = JSON.parse(analysis) as AnalysisResult;
  } catch {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid analysis data.</Text>
      </View>
    );
  }

  const { items, summary } = result;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.totalLabel}>Revenue lost</Text>
      <Text style={styles.totalValue}>{formatCurrency(summary.total_revenue_lost)}</Text>

      <Text style={styles.sectionTitle}>Items</Text>
      <View style={styles.itemList}>
        {items?.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>
              {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.total_revenue_lost)}
            </Text>
          </View>
        ))}
      </View>

      {summary.insight ? (
        <View style={styles.insightBox}>
          <Text style={styles.insightLabel}>Insight</Text>
          <Text style={styles.insightText}>{summary.insight}</Text>
        </View>
      ) : null}

      <Text style={styles.backHint} onPress={() => router.back()}>
        ← Back
      </Text>
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
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#c00',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  itemList: {
    marginBottom: 24,
  },
  itemRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 14,
    color: '#666',
  },
  insightBox: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 24,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 15,
    color: '#333',
  },
  backHint: {
    fontSize: 16,
    color: '#0066cc',
  },
  errorText: {
    fontSize: 16,
    color: '#c00',
    padding: 24,
  },
});
