import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  TextInput, SafeAreaView, StatusBar, RefreshControl, 
  ActivityIndicator, Image, Platform, LayoutAnimation, UIManager,
  Modal, Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { getItem } from '../utils/storage';
import { BASE_URL } from "../utils/config";
import { triggerLocalNotification } from "../utils/notifications";

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ManageAgents() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const [previewImage, setPreviewImage] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState(new Date(2024, 0, 1)); 
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null); 

  const getHeaders = async () => {
    const token = await getItem("token");
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  const fetchAgents = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/agents`, { headers });
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAgents();
  }, []);

  useEffect(() => {
    const result = agents.filter(a => {
      const matchesSearch = !searchQuery || 
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.phone?.includes(searchQuery);
      
      const createdTimestamp = new Date(a.created_at).getTime();
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      
      if (isNaN(createdTimestamp)) return matchesSearch;
      return matchesSearch && createdTimestamp >= start && createdTimestamp <= end;
    });
    setFilteredAgents(result);
  }, [searchQuery, startDate, endDate, agents]);

  useEffect(() => { fetchAgents(); }, []);

  const onDateChange = (event, selectedDate, type) => {
    if (Platform.OS === 'android') setShowPicker(null);
    if (selectedDate) {
      if (type === 'start') setStartDate(selectedDate);
      else setEndDate(selectedDate);
    }
  };

  const handleAction = async (agentId, payload, actionName) => {
    try {
      // 1. Optimistic Update
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, ...payload } : agent
      ));

      const headers = await getHeaders();
      const res = await fetch(`${BASE_URL}/api/updateagents/${agentId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();
      if (data.success) {
        triggerLocalNotification("Success", `Agent ${actionName} successful`);
      } else {
        // 2. Rollback if server fails
        fetchAgents();
        triggerLocalNotification("Error", data.message || "Update rejected");
      }
    } catch (e) {
      // 3. Rollback on network error
      fetchAgents();
      triggerLocalNotification("Error", "Network sync failed");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      <Modal visible={!!previewImage} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPreviewImage(null)}>
            <MaterialCommunityIcons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      <View style={styles.mainWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Agents</Text>
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
            placeholder="Search agents..."
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
            filteredAgents.map((item) => {
              const isApproved = item.role === 'ag';
              const isSuspended = item.is_active === 0;

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
                        <MaterialCommunityIcons name="account-tie" size={24} color="#555" />
                      )}
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{item.name || 'Agent'}</Text>
                      <Text style={styles.phone}>{item.phone || 'No Phone'}</Text>
                    </View>
                    <View style={[styles.statusTag, { backgroundColor: isApproved ? (isSuspended ? '#FF3B3020' : '#34C75920') : '#FF950020' }]}>
                      <Text style={[styles.statusTagText, { color: isApproved ? (isSuspended ? '#FF3B30' : '#34C759') : '#FF9500' }]}>
                        {!isApproved ? 'PENDING' : (isSuspended ? 'SUSPENDED' : 'ACTIVE')}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {expandedId === item.id && (
                    <View style={styles.actionArea}>
                      <View style={styles.divider} />
                      <Text style={styles.sectionTitle}>Verification Documents</Text>
                      <View style={styles.docsRow}>
                        <TouchableOpacity style={styles.docItem} onPress={() => item.business_license && setPreviewImage(`${BASE_URL}${item.business_license}`)}>
                          <Text style={styles.docLabel}>License</Text>
                          {item.business_license ? (
                            <Image source={{ uri: `${BASE_URL}${item.business_license}` }} style={styles.docImage} resizeMode="cover" />
                          ) : (
                            <View style={styles.noDoc}><Text style={styles.noDocText}>Missing</Text></View>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.docItem} onPress={() => item.national_id && setPreviewImage(`${BASE_URL}${item.national_id}`)}>
                          <Text style={styles.docLabel}>National ID</Text>
                          {item.national_id ? (
                            <Image source={{ uri: `${BASE_URL}${item.national_id}` }} style={styles.docImage} resizeMode="cover" />
                          ) : (
                            <View style={styles.noDoc}><Text style={styles.noDocText}>Missing</Text></View>
                          )}
                        </TouchableOpacity>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.btnRow}>
                        {!isApproved ? (
                          <TouchableOpacity 
                            style={[styles.actionBtn, styles.approveBtn]} 
                            onPress={() => handleAction(item.id, { role: 'ag', is_active: 1 }, "Approval")}
                          >
                            <MaterialCommunityIcons name="check-decagram" size={18} color="#FFF" />
                            <Text style={styles.btnText}>APPROVE AGENT</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity 
                            style={[styles.actionBtn, isSuspended ? styles.activateBtn : styles.suspendBtn]} 
                            onPress={() => handleAction(item.id, { is_active: isSuspended ? 1 : 0 }, isSuspended ? "Activation" : "Suspension")}
                          >
                            <MaterialCommunityIcons name={isSuspended ? "play-outline" : "pause-circle-outline"} size={18} color="#FFF" />
                            <Text style={styles.btnText}>{isSuspended ? 'ACTIVATE' : 'SUSPEND'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 45, paddingTop: 45, paddingBottom: 15 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  backBtn: { width: 42, height: 42, backgroundColor: '#151517', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  filterBtn: { width: 42, height: 42, backgroundColor: '#151517', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#FF9500' },
  dateSelectionContainer: { backgroundColor: '#0D0D0E', marginHorizontal: 20, borderRadius: 18, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#1A1A1B' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateBox: { flex: 0.45, backgroundColor: '#151517', padding: 10, borderRadius: 10, alignItems: 'center' },
  dateLabel: { color: '#555', fontSize: 9, fontWeight: '800', marginBottom: 4 },
  dateValue: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D0E', marginHorizontal: 20, borderRadius: 16, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#1A1A1B', marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#FFF' },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 50 },
  card: { backgroundColor: '#0D0D0E', borderRadius: 24, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#1A1A1B' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#151517', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  info: { flex: 1, marginLeft: 15 },
  name: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  phone: { color: '#666', fontSize: 13, marginTop: 2 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusTagText: { fontSize: 9, fontWeight: '900' },
  actionArea: { marginTop: 15 },
  divider: { height: 1, backgroundColor: '#1A1A1B', marginBottom: 15 },
  sectionTitle: { color: '#666', fontSize: 10, fontWeight: '800', marginBottom: 12, letterSpacing: 1 },
  docsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  docItem: { flex: 0.48 },
  docLabel: { color: '#AAA', fontSize: 11, marginBottom: 6 },
  docImage: { width: '100%', height: 120, borderRadius: 12, backgroundColor: '#151517' },
  noDoc: { width: '100%', height: 120, borderRadius: 12, backgroundColor: '#151517', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#333' },
  noDocText: { color: '#444', fontSize: 12 },
  btnRow: { flexDirection: 'row' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, flex: 1 },
  approveBtn: { backgroundColor: '#FF9500' },
  suspendBtn: { backgroundColor: '#FF3B30' },
  activateBtn: { backgroundColor: '#34C759' },
  btnText: { color: '#FFF', fontSize: 13, fontWeight: '900', marginLeft: 8 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  modalCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 50 },
  fullImage: { width: width, height: height * 0.8 }
});