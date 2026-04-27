import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, TextInput, FlatList, ActivityIndicator, 
  RefreshControl, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_URL } from '../utils/config';
import { getItem } from '../utils/storage';
import { triggerLocalNotification } from '../utils/notifications';

export default function StockManagementPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStocks = async () => {
    try {
        const token = await getItem('token');
        if (!token) {
          triggerLocalNotification('Unauthorized', 'Please log in to view your stocks.');
          router.push('/login');
          return;
        }
      const response = await fetch(`${BASE_URL}/api/getMyStock`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      // console.log('Fetched Stocks:', data);
      if (response.ok) {
        setStocks(data);
      }
    } catch (error) {
      triggerLocalNotification('Error', 'Failed to load stock data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStocks();
  }, []);

  const updateStock = async (id, field, value) => {
    try {
      const token = await getItem('token');
      const response = await fetch(`${BASE_URL}/api/updateStock/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error();
      
      setStocks(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    } catch (error) {
      triggerLocalNotification('Failed', 'Could not sync update to server.');
    }
  };

  const renderStockItem = ({ item }) => (
    <View style={styles.stockCard}>
      <View style={styles.cardHeader}>
        {item.photo_url ? (
            <Image source={{ uri: `${BASE_URL}${item.photo_url}` }} style={styles.productImage} resizeMode="contain" />
        ) : (
            <MaterialCommunityIcons name="gas-cylinder" size={35} color="#555" />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.productName}>{item.jina_la_mtungi}</Text>
          <Text style={styles.productSize}>{item.size}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.quantity > 0 ? '#10B98120' : '#EF444420' }]}>
          <Text style={[styles.statusText, { color: item.quantity > 0 ? '#10B981' : '#EF4444' }]}>
            {item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardControls}>
        <View style={styles.controlBox}>
          <Text style={styles.controlLabel}>Unit Price (Tsh)</Text>
          <TextInput 
            style={styles.priceInput}
            keyboardType="numeric"
            defaultValue={item.price.toString()}
            onEndEditing={(e) => updateStock(item.id, 'price', e.nativeEvent.text)}
          />
        </View>

        <View style={styles.controlBox}>
          <Text style={styles.controlLabel}>Available Qty</Text>
          <View style={styles.qtyContainer}>
            <TouchableOpacity 
              onPress={() => updateStock(item.id, 'quantity', Math.max(0, item.quantity - 1))}
              style={styles.qtyBtn}
            >
              <MaterialCommunityIcons name="minus" size={20} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity 
              onPress={() => updateStock(item.id, 'quantity', item.quantity + 1)}
              style={styles.qtyBtn}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Live Stock Status</Text>
            <Text style={styles.headerSub}>Manage what customers see</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#71717A" style={{ marginLeft: 15 }} />
          <TextInput 
            placeholder="Search cylinders..."
            placeholderTextColor="#3F3F46"
            style={styles.searchInput}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator color="#FF9500" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={stocks.filter(s => s.jina_la_mtungi.toLowerCase().includes(searchQuery.toLowerCase()))}
            keyExtractor={item => item.id.toString()}
            renderItem={renderStockItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9500" />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="package-variant" size={60} color="#27272A" />
                <Text style={styles.emptyText}>No stock items found.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/addstock')}>
        <MaterialCommunityIcons name="plus" size={30} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#09090B' },
safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  headerSub: { color: '#71717A', fontSize: 13 },
  backBtn: { width: 45, height: 45, backgroundColor: '#18181B', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121214', marginHorizontal: 20, borderRadius: 15, borderWidth: 1, borderColor: '#27272A', marginBottom: 20 },
  searchInput: { flex: 1, height: 50, color: '#FFF', paddingHorizontal: 15, fontSize: 14 },

  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  stockCard: { backgroundColor: '#121214', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#27272A' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  productImage: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#18181B' },
  headerInfo: { flex: 1 },
  productName: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  productSize: { color: '#71717A', fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: '#27272A', marginVertical: 15 },
  cardControls: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  controlBox: { flex: 1 },
  controlLabel: { color: '#3F3F46', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
  priceInput: { backgroundColor: '#09090B', borderRadius: 12, height: 45, color: '#FF9500', paddingHorizontal: 12, fontWeight: '900', borderWidth: 1, borderColor: '#27272A' },
  
  qtyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#09090B', borderRadius: 12, height: 45, paddingHorizontal: 5, borderWidth: 1, borderColor: '#27272A' },
  qtyBtn: { width: 35, height: 35, backgroundColor: '#18181B', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  qtyValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, backgroundColor: '#FF9500', borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#FF9500', shadowOpacity: 0.3, shadowRadius: 10 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#3F3F46', marginTop: 10, fontWeight: '600' }
});