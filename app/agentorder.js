import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity, 
  SafeAreaView, StatusBar, ScrollView, Dimensions, Platform, RefreshControl, Modal, TextInput, KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getItem } from '../utils/storage';
import { triggerLocalNotification } from '../utils/notifications';
import { BASE_URL } from '../utils/config';
import SessionGuard from '../utils/session';

const { width, height } = Dimensions.get('window');

export default function CustomerOrderPage() {
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [cart, setCart] = useState({}); 
  const [suppliers, setSuppliers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  


  const fetchData = async () => {
    try {
      const token = await getItem("token");
      if (!token) {
        triggerLocalNotification("Authentication Error", "Please log in again."); 
        return;
      }
      const [supplierRes, profileRes] = await Promise.all([
        fetch(`${BASE_URL}/api/getsuppliers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const supplierData = await supplierRes.json();
      const profileData = await profileRes.json();
      if (supplierData.success) setSuppliers(supplierData.suppliers || []);
      if (profileData.success) setProfile(profileData.user);
    } catch (error) {
      triggerLocalNotification("Fetch Error", error);
    } finally {
      setRefreshing(false);
    }
  };


useEffect(() => {
  if (selectedSupplier?.id) {
    fetchSupplierPayment(selectedSupplier.id);
  }
}, [selectedSupplier]);

const fetchSupplierPayment = async (supplierId) => {
  try {
    const token = await getItem("token");
    const agentId = supplierId; 
    const res = await fetch(`${BASE_URL}/api/paymentdetails/${agentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    
    if (data.success) {
      setPaymentDetails(data.details);
    }
  } catch (e) {
    console.error("Payment Fetch Error:", e);
  }
};

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleSupplierPress = (supplier) => {
    if (selectedSupplier?.id === supplier.id) {
      setSelectedSupplier(null);
    } else {
      setSelectedSupplier(supplier);
    }
  };

  const incrementCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: { ...product, qty: (prev[product.id]?.qty || 0) + 1 }
    }));
  };

  const decrementCart = (productId) => {
    setCart(prev => {
      const current = prev[productId];
      if (!current) return prev;
      if (current.qty <= 1) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      return { ...prev, [productId]: { ...current, qty: current.qty - 1 } };
    });
  };

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = parseInt(item.price.toString().replace(/,/g, ''));
    return sum + (price * item.qty);
  }, 0);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    if (paymentMethod === 'mobile' && !paymentPhone) {
      triggerLocalNotification("Wait!", "Enter your payment phone number.");
      return;
    }
    try {
      const token = await getItem("token");
      const response = await fetch(`${BASE_URL}/api/agentplaceorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          supplier_id: selectedSupplier.id,
          items: cartItems.map(i => ({ id: i.id, qty: i.qty })),
          total: cartTotal,
          payment_method: paymentMethod, 
          payment_phone: paymentMethod === 'mobile' ? paymentPhone : null
        })
      });
      const data = await response.json();
      if (data.success) {
        triggerLocalNotification("Order Placed!", data.message);
        setCart({});
        setPaymentPhone('');
        setIsCartVisible(false);
      }
    } catch (e) {
      triggerLocalNotification("Order Error",e);
    }
  };

  return (
    <SessionGuard>
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hello, {profile?.name || 'Customer'}</Text>
            <Text style={styles.headerTitle}>Order Your Gas</Text>
          </View>
          <TouchableOpacity 
            style={styles.cartBtn} 
            onPress={() => cartItems.length > 0 && setIsCartVisible(true)}
          >
            <MaterialCommunityIcons name="cart-outline" size={24} color="#FF9500" />
            {cartItems.length > 0 && <View style={styles.cartBadge} />}
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9500" />}
        >
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>1. Choose a Delivery Supplier</Text>
            <FlatList
              horizontal
              data={suppliers}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.agentList}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => handleSupplierPress(item)}
                  style={[styles.agentCard, selectedSupplier?.id === item.id && styles.agentCardActive]}
                >
                  <View style={styles.avatar}>
                    {item.profile_url ? (
                      <Image source={{ uri: `${BASE_URL}/uploads/${item.profile_url}` }} style={styles.fullImg} />
                    ) : (
                      <MaterialCommunityIcons name="account-circle" size={38} color="#555" />
                    )}
                    <View style={[styles.statusDot, { backgroundColor: item.status === "online" ? "#34C759" : "#FF3" }]} />
                  </View>
                  <Text style={styles.agentName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.agentLoc}>{item.location}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.productHeaderRow}>
              <Text style={styles.sectionHeader}>2. Available Gas Brands</Text>
              {selectedSupplier && <Text style={styles.filterTag}>Active Supplier</Text>}
            </View>

            {selectedSupplier ? (
              <View style={styles.productGrid}>
                {selectedSupplier.products?.map((product) => {
                  const qty = cart[product.id]?.qty || 0;
                  return (
                    <View key={product.id} style={styles.productCard}>
                      <View style={styles.productImgContainer}>
                        {product.image ? (
                           <Image source={{ uri: `${BASE_URL}${product.image}` }} style={styles.productImg} resizeMode="contain" />
                        ) : (
                          <MaterialCommunityIcons name="gas-cylinder" size={35} color="#555" />
                        )}
                      </View>
                      
                      <Text style={styles.brandName} numberOfLines={1}>{product.jina_la_mtungi || product.name}</Text>
                      <Text style={styles.weightText}>{product.quantity}</Text>
                      
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceText}>TSh {product.price}</Text>
                        
                        {qty > 0 ? (
                          <View style={styles.qtyControlRow}>
                            <TouchableOpacity style={styles.controlBtn} onPress={() => decrementCart(product.id)}>
                              <MaterialCommunityIcons name="minus" size={14} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.controlQtyText}>{qty}</Text>
                            <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#FF9500' }]} onPress={() => incrementCart(product)}>
                              <MaterialCommunityIcons name="plus" size={14} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity style={styles.addBtn} onPress={() => incrementCart(product)}>
                            <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-search-outline" size={60} color="#27272A" />
                <Text style={styles.emptyText}>Select a supplier above to see products</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <Modal visible={isCartVisible} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.centeredDrawer}>
              <Text style={styles.drawerTitle}>Confirm Order</Text>
              <ScrollView style={{ maxHeight: height * 0.2 }}>
                {cartItems.map(item => (
                  <View key={item.id} style={styles.cartItemRow}>
                    <Text style={styles.cartItemName}>{item.jina_la_mtungi}</Text>
                    <Text style={styles.cartItemPrice}>{item.qty} x {item.price}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.paymentSection}>
                <View style={styles.paymentRow}>
                  <TouchableOpacity style={[styles.payOption, paymentMethod === 'cash' && styles.payOptionActive]} onPress={() => setPaymentMethod('cash')}>
                    <Text style={[styles.payText, paymentMethod === 'cash' && styles.payTextActive]}>Cash</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.payOption, paymentMethod === 'mobile' && styles.payOptionActive]} onPress={() => setPaymentMethod('mobile')}>
                    <Text style={[styles.payText, paymentMethod === 'mobile' && styles.payTextActive]}>Mobile</Text>
                  </TouchableOpacity>
                </View>

                {paymentMethod === 'mobile' && (
                  <View style={{ marginBottom: 10 }}>
                  <TextInput 
                    style={styles.phoneInput}
                    placeholder="Number used for payment"
                    placeholderTextColor="#71717A"
                    keyboardType="phone-pad"
                    value={paymentPhone}
                    onChangeText={setPaymentPhone}
                  />
                   {paymentDetails ? (
                    <Text style={{ color: '#71717A', fontSize: 11, marginTop: 5 }}>
                      {paymentDetails.providerName || 'N/A'}: <Text style={{ color: '#FF9500' }}>{paymentDetails.accountNumber || 'N/A'}</Text> {' '} ({paymentDetails.accountName || 'N/A'}) , 
                        </Text>
                         ) : (
                        <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 5 }}>
                        Supplier Has No Payment Details, Please Select Another Payment Method.
                          </Text>
                            )} 
                     </View>
                )}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalValue}>Total: TSh {cartTotal.toLocaleString()}</Text>
              </View>

              <TouchableOpacity style={styles.finalBossBtn} onPress={handlePlaceOrder}>
                <Text style={styles.finalBossText}>Place Order Now</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsCartVisible(false)} style={styles.cancelBtn}>
                <Text style={{ color: '#71717A' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
    </View>
    </SessionGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  welcomeText: { color: '#71717A', fontSize: 13 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  cartBtn: { backgroundColor: '#18181B', padding: 12, borderRadius: 15, borderWidth: 1, borderColor: '#27272A' },
  cartBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FF9500', width: 8, height: 8, borderRadius: 4 },
  scrollContent: { paddingBottom: 50 },
  sectionContainer: { marginTop: 15 },
  sectionHeader: { color: '#FFF', fontSize: 16, fontWeight: '700', paddingHorizontal: 20, marginBottom: 15 },
  agentList: { paddingLeft: 20 },
  agentCard: { backgroundColor: '#18181B', borderRadius: 20, padding: 12, marginRight: 12, alignItems: 'center', width: 105, borderWidth: 1, borderColor: '#27272A' },
  agentCardActive: { borderColor: '#F9500' },
  avatar: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center' },
  fullImg: { width: '100%', height: '100%', borderRadius: 22 },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#18181B' },
  agentName: { color: '#FFF', fontWeight: '600', fontSize: 12, marginTop: 8 },
  agentLoc: { color: '#71717A', fontSize: 10 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  productCard: { backgroundColor: '#18181B', width: (width / 2) - 22, borderRadius: 20, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#27272A' },
  productImgContainer: { width: '100%', height: 90, backgroundColor: '#FFF', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  productImg: { width: '80%', height: '80%' },
  brandName: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  weightText: { color: '#71717A', fontSize: 11, marginBottom: 10 },
  priceContainer: { gap: 8 }, 
  priceText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  addBtn: { backgroundColor: '#FF9500', padding: 8, borderRadius: 10, alignItems: 'center' },
  qtyControlRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A', borderRadius: 10, overflow: 'hidden', justifyContent: 'space-between' },
  controlBtn: { padding: 8, backgroundColor: '#3F3F46' },
  controlQtyText: { color: '#FFF', fontWeight: '900', fontSize: 13, paddingHorizontal: 5 },
  emptyState: { alignItems: 'center', marginTop: 40, width: '100%' },
  emptyText: { color: '#71717A', marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  centeredDrawer: { backgroundColor: '#18181B', width: '85%', borderRadius: 25, padding: 20, borderWidth: 1, borderColor: '#27272A' },
  drawerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 15 },
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cartItemName: { color: '#FFF' },
  cartItemPrice: { color: '#FF9500' },
  paymentSection: { marginVertical: 15 },
  paymentRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  payOption: { flex: 1, padding: 12, backgroundColor: '#27272A', borderRadius: 10, alignItems: 'center' },
  payOptionActive: { borderColor: '#FF9500', borderWidth: 1 },
  payText: { color: '#71717A', fontWeight: '700' },
  payTextActive: { color: '#FFF' },
  phoneInput: { backgroundColor: '#09090B', color: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#27272A' },
  totalRow: { marginBottom: 20 },
  totalValue: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  finalBossBtn: { backgroundColor: '#FF9500', padding: 15, borderRadius: 15, alignItems: 'center' },
  finalBossText: { color: '#FFF', fontWeight: '800' },
  cancelBtn: { marginTop: 15, alignItems: 'center' }
});