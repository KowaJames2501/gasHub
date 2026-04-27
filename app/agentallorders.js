import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, SafeAreaView, StatusBar, 
  TouchableOpacity, RefreshControl, Dimensions, Platform, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getItem } from '../utils/storage';
import { BASE_URL } from '../utils/config';
import { triggerLocalNotification } from '../utils/notifications';
import SessionGuard from '../utils/session';

const { height } = Dimensions.get('window');

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const token = await getItem("token");
      if(!token) {
        triggerLocalNotification("Authentication Error", "Please log in to view your orders.");
        return;
      }

  
      const response = await fetch(`${BASE_URL}/api/myorder`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      // Ensure your backend only returns orders where 'show_to_customer' is 1
      if (data.success) setOrders(data.orders);
    } catch (error) {
      triggerLocalNotification("Fetch Orders Error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const handleCancelOrder = (orderId) => {
    triggerLocalNotification(
      "Cancel Order",
      "Are you sure you want to stop this order?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive", 
          onPress: async () => {
            try {
              const token = await getItem("token");
              const response = await fetch(`${BASE_URL}/api/cancelorder/${orderId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
              });
              const data = await response.json();
              if (data.success) {
                triggerLocalNotification("Success", "Order cancelled successfully");
                fetchOrders(); 
              }
            } catch (error) {
              console.error("Cancel Error:", error);
            }
          } 
        }
      ]
    );
  };

  const handleClearHistory = () => {
    triggerLocalNotification(
      "Clear History",
      "This will remove all orders from history to easy view, but our historical data will be kept. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive", 
          onPress: async () => {
            try {
              const token = await getItem("token");
              const response = await fetch(`${BASE_URL}/api/clear-order-history`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
              });
              const data = await response.json();
              if (data.success) {
                fetchOrders(); 
              }
            } catch (error) {
              console.error("Clear History Error:", error);
            }
          } 
        }
      ]
    );
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'completed') return { color: '#34C759', bg: '#34C75915' };
    if (s === 'pending') return { color: '#e9a03b', bg: '#FF950015' };
    if (s === 'cancelled') return { color: '#b11c14', bg: '#FF3B3015' };
    if (s === 'processing') return { color: '#1d64ce', bg: '#1d64ce15' };
    return { color: '#71717A', bg: '#27272A' };
  };

  return (
    <SessionGuard>
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Order History</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleClearHistory}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF3B30" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={onRefresh}>
              <MaterialCommunityIcons name="refresh" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF3B30" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#27272A" />
              <Text style={styles.emptyText}>No orders found.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusStyle = getStatusStyle(item.status);
            const isPending = item.status?.toLowerCase() === 'pending';

            return (
              <View style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>Order {item.id}</Text>
                    <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="moped" size={16} color="#71717A" />
                  <Text style={styles.detailText}>Supplier: {item.agent_name || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <MaterialCommunityIcons 
                    name={item.payment_method === 'mobile' ? "cellphone-check" : "cash"} 
                    size={16} color="#71717A" 
                  />
                  <Text style={styles.detailText}>
                    {item.payment_method === 'mobile' ? `Mobile (${item.transaction_ref})` : 'Cash'}
                  </Text>
                </View>

                <View style={styles.footer}>
                  <View>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>TSh {parseInt(item.total_amount).toLocaleString()}</Text>
                  </View>
                  
                  {isPending && (
                    <TouchableOpacity 
                      style={styles.cancelBtn} 
                      onPress={() => handleCancelOrder(item.id)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </View>
    </SessionGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { backgroundColor: '#18181B', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  orderCard: { backgroundColor: '#18181B', borderRadius: 24, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#27272A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  orderDate: { color: '#71717A', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, height: 24 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: '#27272A', marginVertical: 15 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  detailText: { color: '#E4E4E7', fontSize: 13 },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    marginTop: 15, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#27272A' 
  },
  totalLabel: { color: '#71717A', fontSize: 12 },
  totalValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  cancelBtn: { 
    backgroundColor: '#e76d66', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 59, 48, 0.2)' 
  },
  cancelBtnText: { color: '#FFF', fontWeight: '800', fontSize: 11 },
  emptyState: { alignItems: 'center', marginTop: height * 0.2 },
  emptyText: { color: '#3F3F46', marginTop: 10 }
});