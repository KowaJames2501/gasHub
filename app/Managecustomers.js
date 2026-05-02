import React, { useState, useEffect } from 'react';
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

export default function ManageCustomers() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState(new Date(2020, 0, 1)); 
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null); 

  const getHeaders = async () => {
    const token = await getItem("token");
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  const fetchCustomers = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/customers`, { headers });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const result = customers.filter(c => {
      const matchesSearch = !searchQuery || 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.phone?.includes(searchQuery);
      
      const createdTimestamp = new Date(c.created_at).getTime();
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      
      if (isNaN(createdTimestamp)) return matchesSearch;
      return matchesSearch && createdTimestamp >= start && createdTimestamp <= end;
    });
    setFilteredCustomers(result);
  }, [searchQuery, startDate, endDate, customers]);

  useEffect(() => { fetchCustomers(); }, []);

  const onDateChange = (event, selectedDate, type) => {
    if (Platform.OS === 'android') setShowPicker(null);
    if (selectedDate) {
      if (type === 'start') setStartDate(selectedDate);
      else setEndDate(selectedDate);
    }
  };

  /* =========================================================
     ✅ FIXED STATUS UPDATE (LOCAL STATE SYNC)
  ========================================================= */
  const handleStatusUpdate = async (customerId, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      
      // 1. Optimistic UI Update: Change local state immediately so user sees it
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCustomers(prevCustomers => 
        prevCustomers.map(customer => 
          customer.id === customerId 
            ? { ...customer, is_active: newStatus } 
            : customer
        )
      );

      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/updatecustomers/${customerId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: newStatus }) 
      });
      
      const data = await res.json();
      if (data.success) {
        triggerLocalNotification("Success", `User ${newStatus === 1 ? 'Activated' : 'Suspended'}`);
        fetchCustomers();
      } else {

        triggerLocalNotification("Error", "Update failed on server");
      }
    } catch (e) {
      fetchCustomers(); // Rollback
      triggerLocalNotification("Error", "Check your connection");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.mainWrapper}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Customers</Text>
          <TouchableOpacity 
            style={[styles.filterBtn, showFilter && styles.filterBtnActive]} 
            onPress={() => { LayoutAnimation.easeInEaseOut(); setShowFilter(!showFilter); }}
          >
            <MaterialCommunityIcons name="calendar-search" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* DATE FILTERS */}
        {showFilter && (
          <View style={styles.dateSelectionContainer}>
            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowPicker('start')}>
                <Text style={styles.dateLabel}>START DATE</Text>
                <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#666" />
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

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search name or phone..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollBody}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchCustomers} tintColor="#FF9500" />}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#FF9500" style={{ marginTop: 40 }} />
          ) : (
            filteredCustomers.map((item) => {
              const isActive = item.is_active === 1; 
              return (
                <View key={item.id} style={styles.card}>
                  <TouchableOpacity 
                    style={styles.cardRow} 
                    onPress={() => { LayoutAnimation.easeInEaseOut(); setExpandedId(expandedId === item.id ? null : item.id); }}
                  >
                    <View style={styles.avatarPlaceholder}>
                      {item.photo_url ? (
                        <Image source={{ uri: `${BASE_URL}${item.photo_url}` }} style={styles.avatarImg} />
                      ) : (
                        <MaterialCommunityIcons name="account" size={24} color="#555" />
                      )}
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{item.name || 'User'}</Text>
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
                      <View style={styles.detailsGrid}>
                         <Text style={styles.detailText}><MaterialCommunityIcons name="email" size={12}/> {item.email || 'N/A'}</Text>
                         <Text style={styles.detailText}><MaterialCommunityIcons name="map-marker" size={12}/> {item.location || 'N/A'}</Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.actionBtn, isActive ? styles.suspendBtn : styles.authBtn]} 
                        onPress={() => handleStatusUpdate(item.id, item.is_active)}
                      >
                        <MaterialCommunityIcons name={isActive ? "account-off" : "account-check"} size={20} color="#FFF" />
                        <Text style={styles.btnText}>{isActive ? 'SUSPEND CUSTOMER' : 'ACTIVATE CUSTOMER'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  mainWrapper: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 45, paddingBottom: 15 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  backBtn: { width: 40, height: 40, backgroundColor: '#151517', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  filterBtn: { width: 40, height: 40, backgroundColor: '#151517', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#FF9500' },
  dateSelectionContainer: { backgroundColor: '#0D0D0E', marginHorizontal: 20, borderRadius: 18, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#1A1A1B' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateBox: { flex: 0.45, backgroundColor: '#151517', padding: 10, borderRadius: 10, alignItems: 'center' },
  dateLabel: { color: '#555', fontSize: 9, fontWeight: '800', marginBottom: 4 },
  dateValue: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D0E', marginHorizontal: 20, borderRadius: 15, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#1A1A1B', marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#FFF' },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 50 },
  card: { backgroundColor: '#0D0D0E', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1A1A1B' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#151517', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  info: { flex: 1, marginLeft: 15 },
  name: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  phone: { color: '#666', fontSize: 13, marginTop: 2 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusTagText: { fontSize: 10, fontWeight: '800' },
  actionArea: { marginTop: 15 },
  detailsGrid: { marginBottom: 15, gap: 5 },
  detailText: { color: '#888', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#1A1A1B', marginBottom: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  suspendBtn: { backgroundColor: '#FF3B30' },
  authBtn: { backgroundColor: '#34C759' },
  btnText: { color: '#FFF', fontSize: 13, fontWeight: '800', marginLeft: 10 }
});