import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, 
  StatusBar, TextInput, ScrollView, ActivityIndicator, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import{getItem} from '../utils/storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_URL } from '../utils/config';
import { triggerLocalNotification } from '../utils/notifications';

export default function AddStockPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [jina, setJina] = useState('');
  const [size, setSize] = useState('6'); 
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [photoUrl, setPhotoUrl] = useState(''); 

  const handleSaveStock = async () => {
    if (!jina || !quantity || !price) {
      triggerLocalNotification('Missing Data', 'Please enter Brand Name, Quantity, and Price.');
      return;
    }

    setLoading(true);
    try {
      const token = await getItem('token');
      const response = await fetch(`${BASE_URL}/api/addStock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          jina_la_mtungi: jina,
          quantity: parseInt(quantity),
          size: `${size}kg`,
          price: parseFloat(price),
          photo_url: photoUrl || null
        }),
      });

      if (response.ok) {
        triggerLocalNotification('Success', 'New stock added to your inventory.');
        router.back(); 
      } else {
        const errorData = await response.json();
        triggerLocalNotification('Error', errorData.message || 'Failed to save stock.');
      }
    } catch (error) {
      triggerLocalNotification('Connection Error', 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Stock</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.centerSection}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="package-variant-closed-plus" size={35} color="#FF9500" />
              </View>
              <Text style={styles.subtitle}>Enter the details for the new gas cylinders being added to your profile.</Text>
            </View>

            <View style={styles.formSection}>
              {/* BRAND NAME */}
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>Brand Name (Jina la Mtungi)</Text>
              </View>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="tag-outline" size={20} color="#71717A" style={styles.inputIcon} />
                <TextInput 
                  placeholder="e.g. Oryx, Taifa, Lake Gas" 
                  placeholderTextColor="#3F3F46" 
                  style={styles.input}
                  value={jina}
                  onChangeText={setJina}
                />
              </View>

              {/* SIZE SELECTION */}
              <Text style={styles.inputLabel}>Cylinder Size (Weight)</Text>
              <View style={styles.sizeRow}>
                {['6', '13', '15', '38'].map((s) => (
                  <TouchableOpacity 
                    key={s} 
                    style={[styles.sizeItem, size === s && styles.sizeItemActive]}
                    onPress={() => setSize(s)}
                  >
                    <Text style={[styles.sizeText, size === s && styles.sizeTextActive]}>{s}kg</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                {/* QUANTITY */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <View style={styles.inputBox}>
                    <TextInput 
                      placeholder="0" 
                      placeholderTextColor="#3F3F46" 
                      style={styles.input}
                      keyboardType="numeric"
                      value={quantity}
                      onChangeText={setQuantity}
                    />
                  </View>
                </View>

                {/* PRICE */}
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.inputLabel}>Retail Price (Tsh)</Text>
                  <View style={styles.inputBox}>
                    <TextInput 
                      placeholder="e.g. 54000" 
                      placeholderTextColor="#3F3F46" 
                      style={styles.input}
                      keyboardType="numeric"
                      value={price}
                      onChangeText={setPrice}
                    />
                  </View>
                </View>
              </View>

              {/* PHOTO URL (OPTIONAL) */}
              <Text style={styles.inputLabel}>Product Photo Link (Optional)</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="link-variant" size={20} color="#71717A" style={styles.inputIcon} />
                <TextInput 
                  placeholder="https://image-url.com" 
                  placeholderTextColor="#3F3F46" 
                  style={styles.input}
                  value={photoUrl}
                  onChangeText={setPhotoUrl}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity style={styles.actionBtn} onPress={handleSaveStock} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : (
                  <>
                    <Text style={styles.actionBtnText}>Confirm and Add</Text>
                    <MaterialCommunityIcons name="check-circle-outline" size={22} color="#000" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 10 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginLeft: 15 },
  closeBtn: { width: 40, height: 40, backgroundColor: '#18181B', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  scrollContent: { paddingHorizontal: 30, paddingBottom: 50 },
  centerSection: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#121214', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A', marginBottom: 15 },
  subtitle: { color: '#71717A', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  formSection: { width: '100%', gap: 18 },
  inputLabel: { color: '#71717A', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121214', borderRadius: 16, paddingHorizontal: 16, height: 60, borderWidth: 1, borderColor: '#27272A' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 15 },
  sizeRow: { flexDirection: 'row', gap: 10 },
  sizeItem: { flex: 1, height: 45, borderRadius: 12, backgroundColor: '#121214', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  sizeItemActive: { backgroundColor: '#FF9500', borderColor: '#FF9500' },
  sizeText: { color: '#71717A', fontWeight: '700' },
  sizeTextActive: { color: '#000' },
  actionBtn: { backgroundColor: '#FF9500', height: 60, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25, gap: 10 },
  actionBtnText: { color: '#000', fontSize: 16, fontWeight: '900' }
});