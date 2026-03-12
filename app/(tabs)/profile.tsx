import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const STORAGE_KEY_BAKERY = 'dough:bakery_name';
const STORAGE_KEY_OWNER = 'dough:owner_name';
const STORAGE_KEY_REMINDER = 'dough:reminder_enabled';
const STORAGE_KEY_CLOSING_TIME = 'dough:closing_time';

const APP_VERSION = '0.1.0';

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

export default function ProfileScreen() {
  const [bakeryName, setBakeryName] = useState('Paris en Rose Bakery');
  const [ownerName, setOwnerName] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [closingHour, setClosingHour] = useState('05');
  const [closingMinute, setClosingMinute] = useState('00');
  const [closingPeriod, setClosingPeriod] = useState('PM');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [draftBakery, setDraftBakery] = useState('');
  const [draftOwner, setDraftOwner] = useState('');

  useEffect(() => {
    (async () => {
      const [bn, on, re, ct] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_BAKERY),
        AsyncStorage.getItem(STORAGE_KEY_OWNER),
        AsyncStorage.getItem(STORAGE_KEY_REMINDER),
        AsyncStorage.getItem(STORAGE_KEY_CLOSING_TIME),
      ]);
      if (bn !== null) setBakeryName(bn);
      if (on !== null) setOwnerName(on);
      if (re !== null) setReminderEnabled(re === 'true');
      if (ct !== null) {
        const parts = ct.split(':');
        if (parts.length === 3) {
          setClosingHour(parts[0]);
          setClosingMinute(parts[1]);
          setClosingPeriod(parts[2]);
        }
      }
    })();
  }, []);

  const saveInfo = async () => {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY_BAKERY, draftBakery),
      AsyncStorage.setItem(STORAGE_KEY_OWNER, draftOwner),
    ]);
    setBakeryName(draftBakery);
    setOwnerName(draftOwner);
    setEditModalVisible(false);
  };

  const toggleReminder = async (value: boolean) => {
    setReminderEnabled(value);
    await AsyncStorage.setItem(STORAGE_KEY_REMINDER, String(value));
  };

  const saveClosingTime = async (h: string, m: string, p: string) => {
    await AsyncStorage.setItem(STORAGE_KEY_CLOSING_TIME, `${h}:${m}:${p}`);
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Sign out is not yet implemented.', [{ text: 'OK' }]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Profile</Text>

      {/* Bakery info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bakery info</Text>
          <TouchableOpacity
            onPress={() => {
              setDraftBakery(bakeryName);
              setDraftOwner(ownerName);
              setEditModalVisible(true);
            }}
          >
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Bakery name</Text>
          <Text style={styles.rowValue}>{bakeryName}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.rowLabel}>Owner</Text>
          <Text style={styles.rowValue}>{ownerName || '—'}</Text>
        </View>
      </View>

      {/* App settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App settings</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Closing time reminder</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={toggleReminder}
            trackColor={{ false: '#e0e0e0', true: '#111' }}
            thumbColor="#fff"
          />
        </View>
        <View style={[styles.row, styles.rowLast, styles.rowColumn]}>
          <Text style={styles.rowLabel}>Closing time</Text>
          <View style={styles.timePicker}>
            {HOURS.map(h => (
              <TouchableOpacity
                key={h}
                style={[styles.timeChip, closingHour === h && styles.timeChipActive]}
                onPress={() => {
                  setClosingHour(h);
                  saveClosingTime(h, closingMinute, closingPeriod);
                }}
              >
                <Text style={[styles.timeChipText, closingHour === h && styles.timeChipTextActive]}>
                  {h}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.timeSep}>:</Text>
            {MINUTES.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.timeChip, closingMinute === m && styles.timeChipActive]}
                onPress={() => {
                  setClosingMinute(m);
                  saveClosingTime(closingHour, m, closingPeriod);
                }}
              >
                <Text style={[styles.timeChipText, closingMinute === m && styles.timeChipTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.timeChip, closingPeriod === p && styles.timeChipActive]}
                onPress={() => {
                  setClosingPeriod(p);
                  saveClosingTime(closingHour, closingMinute, p);
                }}
              >
                <Text style={[styles.timeChipText, closingPeriod === p && styles.timeChipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* POS integrations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>POS integrations</Text>
        {['Square', 'Clover'].map((pos, i, arr) => (
          <View key={pos} style={[styles.row, i === arr.length - 1 && styles.rowLast]}>
            <Text style={styles.rowLabel}>{pos}</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming soon</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Version</Text>
          <Text style={styles.rowValue}>{APP_VERSION}</Text>
        </View>
        <TouchableOpacity
          style={[styles.row, styles.rowLast]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Edit modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit bakery info</Text>
            <TouchableOpacity onPress={saveInfo}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Bakery name</Text>
            <TextInput
              style={styles.input}
              value={draftBakery}
              onChangeText={setDraftBakery}
              placeholder="e.g. Paris en Rose Bakery"
              placeholderTextColor="#bbb"
            />
            <Text style={styles.inputLabel}>Owner name</Text>
            <TextInput
              style={styles.input}
              value={draftOwner}
              onChangeText={setDraftOwner}
              placeholder="e.g. Marie Dupont"
              placeholderTextColor="#bbb"
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ebebeb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    paddingTop: 14,
    paddingBottom: 4,
  },
  editButton: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  rowLabel: {
    fontSize: 15,
    color: '#222',
  },
  rowValue: {
    fontSize: 15,
    color: '#888',
    maxWidth: '55%',
    textAlign: 'right',
  },
  timePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    paddingBottom: 4,
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  timeChipActive: {
    backgroundColor: '#111',
  },
  timeChipText: {
    fontSize: 14,
    color: '#444',
  },
  timeChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  timeSep: {
    fontSize: 16,
    color: '#aaa',
  },
  comingSoonBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  signOutText: {
    fontSize: 15,
    color: '#c00',
  },
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancel: {
    fontSize: 16,
    color: '#888',
  },
  modalSave: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
  },
  modalBody: {
    padding: 24,
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fafafa',
  },
});
