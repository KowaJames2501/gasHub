import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  TextInput, SafeAreaView, StatusBar, Image, 
  Platform, KeyboardAvoidingView, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { pickFile } from '../utils/filepicker'; 
import { getItem } from '../utils/storage';
import { BASE_URL } from '../utils/config';
import { triggerLocalNotification } from '../utils/notifications';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export default function AddStockPage() {
  const router = useRouter();
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [jina, setJina] = useState('');
  const [size, setSize] = useState('6'); 
  const [customSize, setCustomSize] = useState(''); 
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState(null);

  // Fetch logic wrapped for re-use
  const getProfile = async () => {
    try {
      const token = await getItem('token');
      const res = await fetch(`${BASE_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setJina(data.user.name);
      }
    } catch (e) {
      triggerLocalNotification("Error", "Failed to sync profile data.");
    } finally {
      setFetchingProfile(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getProfile();
  }, []);

  const handlePhotoSelection = async () => {
    const fileData = await pickFile(); 
    if (fileData) {
      setPhoto(fileData);
    }
  };

  const handleSaveStock = async () => {
    const finalSize = size === 'custom' ? customSize : size;

    if (!jina || !quantity || !price || !photo || !finalSize) {
      triggerLocalNotification("Missing Information", "Please fill all fields and upload a product photo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getItem('token');
      const formData = new FormData();
      
      formData.append('jina_la_mtungi', jina);
      formData.append('quantity', quantity);
      formData.append('size', `${finalSize}kg`);
      formData.append('price', price);
      
      formData.append('photo', {
        uri: photo.uri,
        name: photo.name,
        type: photo.type,
      });

      const response = await fetch(`${BASE_URL}/api/addStock`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        triggerLocalNotification("Success", "Stock updated successfully.");
        getProfile(); 
        router.back();
      } else {
        triggerLocalNotification("Update Failed", result.message);
      }
    } catch (error) {
      triggerLocalNotification("Network Error", "Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Inventory Intake</Text>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF9500"
                colors={["#FF9500"]}
              />
            }
          >
            
            {/* BRAND NAME - AUTO-FETCHED */}
            <Text style={styles.sectionLabel}>Cylinder Brand</Text>
            <View style={[styles.inputBox, styles.disabledInput]}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#3F3F46" style={styles.inputIcon} />
              {fetchingProfile ? (
                <ActivityIndicator size="small" color="#FF9500" />
              ) : (
                <TextInput style={[styles.input, { color: '#71717A' }]} value={jina} editable={false} />
              )}
            </View>

            {/* ACTUAL PHOTO UPLOAD */}
            <Text style={styles.sectionLabel}>Product Appearance</Text>
            <TouchableOpacity 
              style={[styles.uploadArea, photo && styles.uploadAreaActive]} 
              onPress={handlePhotoSelection}
            >
              {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.previewImg} />
              ) : (
                <View style={styles.placeholderBox}>
                  <MaterialCommunityIcons name="camera" size={32} color="#FF9500" />
                  <Text style={styles.placeholderText}>Tap to capture/select cylinder photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* SIZE SELECTION */}
            <Text style={styles.sectionLabel}>Weight (kg)</Text>
            <View style={styles.sizeRow}>
              {['6', '13', '15', '38'].map((s) => (
                <TouchableOpacity 
                  key={s} 
                  style={[styles.sizeBtn, size === s && styles.sizeBtnActive]}
                  onPress={() => { setSize(s); setCustomSize(''); }}
                >
                  <Text style={[styles.sizeBtnText, size === s && styles.sizeBtnTextActive]}>{s}kg</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={[styles.sizeBtn, size === 'custom' && styles.sizeBtnActive]}
                onPress={() => setSize('custom')}
              >
                <Text style={[styles.sizeBtnText, size === 'custom' && styles.sizeBtnTextActive]}>Other</Text>
              </TouchableOpacity>
            </View>

            {size === 'custom' && (
              <View style={[styles.inputBox, { marginTop: 10 }]}>
                <TextInput 
                  placeholder="Enter custom weight" 
                  placeholderTextColor="#3F3F46" 
                  style={styles.input}
                  keyboardType="numeric"
                  value={customSize}
                  onChangeText={setCustomSize}
                />
              </View>
            )}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Stock Count</Text>
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
              <View style={{ flex: 1.5 }}>
                <Text style={styles.sectionLabel}>Retail Price (Tsh)</Text>
                <View style={styles.inputBox}>
                  <TextInput 
                    placeholder="e.g. 55000" 
                    placeholderTextColor="#3F3F46" 
                    style={styles.input}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.mainBtn, (isSubmitting || fetchingProfile) && { opacity: 0.7 }]} 
              onPress={handleSaveStock}
              disabled={isSubmitting || fetchingProfile}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.mainBtnText}>Confirm and Add Stock</Text>
                  <MaterialCommunityIcons name="plus-box" size={22} color="#000" />
                </>
              )}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 10 },
  backBtn: { width: 44, height: 44, backgroundColor: '#18181B', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginLeft: 15 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  sectionLabel: { color: '#52525B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginTop: 25, marginBottom: 10, letterSpacing: 1 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121214', borderRadius: 16, paddingHorizontal: 16, height: 60, borderWidth: 1, borderColor: '#27272A' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '600' },
  disabledInput: { backgroundColor: '#09090B', borderColor: '#18181B' },
  uploadArea: { width: '100%', height: 180, backgroundColor: '#121214', borderRadius: 24, borderWidth: 1, borderColor: '#27272A', borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  uploadAreaActive: { borderStyle: 'solid', borderColor: '#FF950040' },
  previewImg: { width: '100%', height: '100%' },
  placeholderBox: { alignItems: 'center', gap: 10 },
  placeholderText: { color: '#71717A', fontSize: 12, fontWeight: '600' },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeBtn: { flex: 1, height: 48, backgroundColor: '#121214', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  sizeBtnActive: { backgroundColor: '#FF9500', borderColor: '#FF9500' },
  sizeBtnText: { color: '#71717A', fontWeight: '800', fontSize: 12 },
  sizeBtnTextActive: { color: '#000' },
  row: { flexDirection: 'row', gap: 15 },
  mainBtn: { backgroundColor: '#FF9500', height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 35, gap: 12 },
  mainBtnText: { color: '#000', fontSize: 17, fontWeight: '900' }
});