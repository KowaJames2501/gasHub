import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  TextInput, SafeAreaView, StatusBar, RefreshControl, 
  ActivityIndicator, Image, Platform, LayoutAnimation, UIManager 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { getItem } from '../utils/storage';
import { BASE_URL } from "../utils/config";
import { triggerLocalNotification } from "../utils/notifications";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ManageSuppliers() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState(new Date(2020, 0, 1)); 
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null); 

  const getHeaders = async () => {
    const token = await getItem("token");
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  const fetchSuppliers = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/suppliers`, { headers });
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.suppliers);
      }
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const result = suppliers.filter(s => {
      const matchesSearch = !searchQuery || 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.phone?.includes(searchQuery);
      
      const createdTimestamp = new Date(s.created_at).getTime();
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      
      if (isNaN(createdTimestamp)) return matchesSearch;
      return matchesSearch && createdTimestamp >= start && createdTimestamp <= end;
    });
    setFilteredSuppliers(result);
  }, [searchQuery, startDate, endDate, suppliers]);

  useEffect(() => { fetchSuppliers(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSuppliers();
  }, []);

  const onDateChange = (event, selectedDate, type) => {
    if (Platform.OS === 'android') setShowPicker(null);
    if (selectedDate) {
      if (type === 'start') setStartDate(selectedDate);
      else setEndDate(selectedDate);
    }
  };

  /* =========================================================
     ✅ OPTIMISTIC UI SYNC FOR BACKEND
  ========================================================= */
  const handleStatusUpdate = async (supplierId, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      
      // Instant UI Change
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, is_active: newStatus } : s));

      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/updatesupplier/${supplierId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: newStatus }) 
      });
      
      const data = await res.json();
      if (data.success) {
        triggerLocalNotification("Success", `Supplier ${newStatus === 1 ? 'Activated' : 'Suspended'}`);
      } else {
        fetchSuppliers(); // Rollback
        triggerLocalNotification("Error", data.message || "Update failed");
      }
    } catch (e) {
      fetchSuppliers(); // Rollback
      triggerLocalNotification("Error", "Network connection failed");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.mainWrapper}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Suppliers</Text>
          <TouchableOpacity 
            style={[styles.filterBtn, showFilter && styles.filterBtnActive]} 
            onPress={() => { LayoutAnimation.easeInEaseOut(); setShowFilter(!showFilter); }}
          >
            <MaterialCommunityIcons name="calendar-search" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {showFilter && (
          <View style={styles.dateSelectionContainer}>
            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowPicker('start')}>
                <Text style={styles.dateLabel}>START DATE</Text>
                <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#333" />
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowPicker('end')}>
                <Text style={styles.dateLabel}>END DATE</Text>
                <Text style={styles.dateValue}>{endDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
            {showPicker && (
              <DateTimePicker
                value={showPicker === 'start' ? startDate : endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="dark"
                onChange={(e, date) => onDateChange(e, date, showPicker)}
              />
            )}
          </View>
        )}

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search suppliers..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollBody}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9500" />}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#FF9500" style={{ marginTop: 40 }} />
          ) : (
            filteredSuppliers.map((item) => {
              const isActive = item.is_active === 1; 
              return (
                <View key={item.id} style={styles.card}>
                  <TouchableOpacity 
                    style={styles.cardRow} 
                    onPress={() => { LayoutAnimation.easeInEaseOut(); setExpandedId(expandedId === item.id ? null : item.id); }}
                  >
                    <View style={styles.avatarPlaceholder}>
                       <MaterialCommunityIcons name="truck-fast" size={24} color="#FF9500" />
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{item.name || 'Supplier'}</Text>
                      <Text style={styles.phone}>{item.phone || 'No Phone'}</Text>
                    </View>
                    <View style={[styles.statusTag, { backgroundColor: isActive ? '#34C75920' : '#FF3B3020' }]}>
                      <Text style={[styles.statusTagText, { color: isActive ? '#34C759' : '#FF3B30' }]}>
                        {isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {expandedId === item.id && (
                    <View style={styles.actionArea}>
                      <View style={styles.divider} />
                      <View style={styles.detailsList}>
                        <Text style={styles.detailItem}><MaterialCommunityIcons name="email" size={14}/> {item.email || 'No Email'}</Text>
                        <Text style={styles.detailItem}><MaterialCommunityIcons name="map-marker" size={14}/> {item.location || 'No Location'}</Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.actionBtn, isActive ? styles.suspendBtn : styles.authBtn]} 
                        onPress={() => handleStatusUpdate(item.id, item.is_active)}
                      >
                        <MaterialCommunityIcons name={isActive ? "account-off" : "account-check"} size={20} color="#FFF" />
                        <Text style={styles.btnText}>{isActive ? 'SUSPEND SUPPLIER' : 'ACTIVATE SUPPLIER'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => router.push('/newsupplier')}>
          <MaterialCommunityIcons name="plus" size={32} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  mainWrapper: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  backBtn: { width: 44, height: 44, backgroundColor: '#151517', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  filterBtn: { width: 44, height: 44, backgroundColor: '#151517', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#FF9500' },
  dateSelectionContainer: { backgroundColor: '#0D0D0E', marginHorizontal: 20, borderRadius: 18, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#1A1A1B' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateBox: { flex: 0.45, backgroundColor: '#151517', padding: 10, borderRadius: 10, alignItems: 'center' },
  dateLabel: { color: '#555', fontSize: 9, fontWeight: '800', marginBottom: 4 },
  dateValue: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D0E', marginHorizontal: 20, borderRadius: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#1A1A1B', marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#FFF' },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: '#0D0D0E', borderRadius: 22, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#1A1A1B' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#151517', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 15 },
  name: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  phone: { color: '#666', fontSize: 13, marginTop: 2 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusTagText: { fontSize: 10, fontWeight: '900' },
  actionArea: { marginTop: 15 },
  detailsList: { marginBottom: 15, gap: 6 },
  detailItem: { color: '#888', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#1A1A1B', marginBottom: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14 },
  suspendBtn: { backgroundColor: '#FF3B30' },
  authBtn: { backgroundColor: '#34C759' },
  btnText: { color: '#FFF', fontSize: 13, fontWeight: '900', marginLeft: 10 },
  fab: { 
    position: 'absolute', bottom: 30, right: 20, 
    width: 64, height: 64, borderRadius: 32, 
    backgroundColor: '#FF9500', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF9500', shadowOpacity: 0.4, shadowRadius: 10, elevation: 10
  }
});