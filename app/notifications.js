import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, SafeAreaView, 
  TouchableOpacity, StatusBar, Platform, FlatList, ActivityIndicator, Modal, Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../utils/config'; 
import { getItem } from '../utils/storage';
import { triggerLocalNotification } from '../utils/notifications';

export default function NotificationPanel() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const fetchNotifications = async () => {
    try {
      if (!refreshing) setLoading(true);
      const token = await getItem('token');
      const response = await fetch(`${BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      const formatted = data.notifications.map(item => ({
        id: item.id.toString(),
        title: item.title,
        body: item.message,
        time: new Date(item.created_at).toLocaleString(),
        isRead: item.is_read === 1,
        icon: getIcon(item.type),
        type: item.type
      }));

      setNotifications(formatted);
    } catch (error) {
      console.log("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return 'check-circle-outline';
      case 'warning': return 'alert-outline';
      case 'error': return 'close-circle-outline';
      default: return 'bell-outline';
    }
  };

  const markAllRead = async () => {
    try {
      setLoading(true);
      const token = await getItem('token');
      const response = await fetch(`${BASE_URL}/api/readallnotifications`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        triggerLocalNotification("Success", data.message);
        fetchNotifications();
      }
    } catch (error) {
      triggerLocalNotification("Error", "Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  const openNotification = async (item) => {
    setSelectedNotification(item);
    setModalVisible(true);

    if (!item.isRead) {
      try {
        const token = await getItem('token');
        await fetch(`${BASE_URL}/api/notifications/${item.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
      } catch (error) {
        console.log("Mark as read error:", error);
      }
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = await getItem('token');
      const response = await fetch(`${BASE_URL}/api/deletenotifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        triggerLocalNotification("Deleted", data.message);
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      triggerLocalNotification("Error", "Could not delete notification");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => openNotification(item)} activeOpacity={0.7}>
      <View style={[styles.notiCard, !item.isRead && styles.unreadCard]}>
        <View style={[styles.iconBox, { backgroundColor: item.isRead ? '#18181B' : '#FF3B30' }]}>
          <MaterialCommunityIcons 
            name={item.icon} 
            size={22} 
            color={item.isRead ? '#71717A' : '#FFF'} 
          />
        </View>
        
        <View style={styles.content}>
          <View style={styles.cardHeader}>
            <Text style={[styles.notiTitle, !item.isRead && styles.unreadText]}>
              {item.title}
            </Text>
            <Text style={styles.notiTime}>{item.time}</Text>
          </View>
          <Text style={styles.notiBody} numberOfLines={2}>
            {item.body}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={() => deleteNotification(item.id)} 
          style={styles.deleteBtn}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={markAllRead}>
            <MaterialCommunityIcons name="check-all" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* LIST OR EMPTY STATE */}
        {loading && !refreshing ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#FF3B30" />
            <Text style={styles.emptySub}>Loading updates...</Text>
          </View>
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listBody}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-off-outline" size={80} color="#18181B" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No new notifications at the moment.</Text>
          </View>
        )}

        <Text style={styles.footerBranding}>GASHUB UPDATES • 2026</Text>

        {/* DETAILS MODAL (CENTERED POPUP) */}
        <Modal
          visible={modalVisible}
          animationType="fade" // Changed to fade for centered dialogs
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setModalVisible(false)} // Closes if backdrop clicked
          >
            {/* The actual popup card */}
            <Pressable style={styles.popupCard}>
              {selectedNotification && (
                <View style={styles.modalContentContainer}>
                  <View style={styles.modalHeaderRow}>
                    <MaterialCommunityIcons 
                        name={selectedNotification.icon} 
                        size={28} 
                        color="#FF3B30" 
                    />
                    <Text style={styles.modalTitle}>
                        {selectedNotification.title}
                    </Text>
                  </View>
                  <Text style={styles.modalTime}>
                    {selectedNotification.time}
                  </Text>
                  
                  {/* Message body container */}
                  <View style={styles.modalBodyContainer}>
                    <Text style={styles.modalBody}>
                        {selectedNotification.body}
                    </Text>
                  </View>
                  
                  {/* Action button */}
                  <TouchableOpacity 
                    style={styles.closeModalBtn} 
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeModalText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    height: 70,
    borderBottomWidth: 1,
    borderBottomColor: '#18181B'
  },
  backBtn: { backgroundColor: '#18181B', padding: 8, borderRadius: 12 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  listBody: { padding: 20, paddingBottom: 40 },
  
  notiCard: { 
    flexDirection: 'row', 
    backgroundColor: '#18181B', 
    borderRadius: 22, 
    padding: 15, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center'
  },
  unreadCard: {
    borderColor: 'rgba(255, 59, 48, 0.3)',
    backgroundColor: '#1C1919'
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, marginLeft: 15, marginRight: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notiTitle: { color: '#A1A1AA', fontSize: 15, fontWeight: '700' },
  unreadText: { color: '#FFF' },
  notiTime: { color: '#52525B', fontSize: 11, fontWeight: '600' },
  notiBody: { color: '#71717A', fontSize: 13, lineHeight: 18 },
  deleteBtn: { padding: 8 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 20 },
  emptySub: { color: '#52525B', fontSize: 14, marginTop: 5 },

  // Updated Modal Styles for Centered Placement
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)', // Slightly darker backdrop
    justifyContent: 'center', // 🔥 Centers vertically
    alignItems: 'center', // 🔥 Centers horizontally
    padding: 20, // Margin around the popup
  },
  popupCard: {
    backgroundColor: '#18181B',
    padding: 24,
    borderRadius: 28, // Rounded on all sides
    borderWidth: 1,
    borderColor: '#27272A',
    width: '100%', // Fills available padding width
    maxWidth: 400, // Keeps it sane on larger screens/tablets
    // Optional shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  modalContentContainer: { paddingBottom: 10 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 12,
    flex: 1
  },
  modalTime: {
    color: '#71717A',
    fontSize: 13,
    marginBottom: 20,
    fontWeight: '500'
  },
  modalBodyContainer: {
    backgroundColor: '#09090B',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 25,
    maxHeight: 300, // Adds scrolling if message is huge
  },
  modalBody: {
    color: '#D4D4D8',
    fontSize: 15,
    lineHeight: 22,
  },
  closeModalBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  closeModalText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1
  },
  footerBranding: { textAlign: 'center', color: '#18181B', fontSize: 10, fontWeight: '900', marginBottom: 20, letterSpacing: 3 }
});