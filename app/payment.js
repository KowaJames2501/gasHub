import React, { useState, useCallback, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, 
  SafeAreaView, StatusBar, TextInput, 
  KeyboardAvoidingView, Platform, ScrollView, 
  ActivityIndicator, RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_URL } from '../utils/config';
import { getItem } from '../utils/storage';
import { triggerLocalNotification } from '../utils/notifications';

export default function PaymentSettingsPage() {
  const router = useRouter();
  

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [provider, setProvider] = useState('');


  const fetchPaymentDetails = async () => {
    try {
        const token = await getItem('token');
        if (!token) {
          triggerLocalNotification('Unauthorized', 'Please log in again.');
          router.push('/login');
          return;
        }
      const response = await fetch(`${BASE_URL}/api/getPaymentDetails`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data) {
        setAccountName(data.account_name || '');
        setAccountNumber(data.account_number || '');
        setProvider(data.provider_name || '');
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPaymentDetails();
    setRefreshing(false);
  }, []);

  const handleSaveDetails = async () => {
    if (!accountName || !accountNumber || !provider) {
      triggerLocalNotification('Required', 'Please fill in all Mobile Money details.');
      return;
    }

    setLoading(true);
    try {
        const token = await getItem('token');
        if (!token) {
          triggerLocalNotification('Unauthorized', 'Please log in again.');
          router.push('/login');
          return;
        }
      const response = await fetch(`${BASE_URL}/api/updatePaymentDetails`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          accountName, 
          accountNumber, 
          accountType: 'Mobile Money', 
          provider 
        }),
      });

      if (response.ok) {
        triggerLocalNotification('Success', 'Payment credentials updated.');
        router.back();
      } else {
        triggerLocalNotification('Error', 'Update failed.');
      }
    } catch (error) {
      triggerLocalNotification('Network Error', 'Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment Settings</Text>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
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
            <View style={styles.centerSection}>
              <View style={styles.iconContainer}>
                <View style={styles.glowEffect} />
                <MaterialCommunityIcons name="cellphone-check" size={42} color="#FF9500" />
              </View>
              <Text style={styles.title}>Mobile Money</Text>
              <Text style={styles.subtitle}>
                Pull down to refresh your saved credentials or update them below.
              </Text>
            </View>


            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <View style={styles.inputBox}>
                  <MaterialCommunityIcons name="antenna" size={20} color="#71717A" style={styles.inputIcon} />
                  <TextInput 
                    placeholder="Provider (M-Pesa, Tigo Pesa...)"
                    placeholderTextColor="#3F3F46" 
                    style={styles.input}
                    value={provider}
                    onChangeText={setProvider}
                  />
                </View>

                <View style={styles.inputBox}>
                  <MaterialCommunityIcons name="account-circle-outline" size={20} color="#71717A" style={styles.inputIcon} />
                  <TextInput 
                    placeholder="Registered Full Name" 
                    placeholderTextColor="#3F3F46" 
                    style={styles.input}
                    value={accountName}
                    onChangeText={setAccountName}
                  />
                </View>

                <View style={styles.inputBox}>
                  <MaterialCommunityIcons name="phone-outline" size={20} color="#71717A" style={styles.inputIcon} />
                  <TextInput 
                    placeholder="Mobile Money Number" 
                    placeholderTextColor="#3F3F46" 
                    style={styles.input}
                    keyboardType="numeric"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.actionBtn, loading && { opacity: 0.7 }]} 
                onPress={handleSaveDetails} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#000" /> : (
                  <>
                    <Text style={styles.actionBtnText}>Save Securely</Text>
                    <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#000" />
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
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  
  headerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingVertical: 15,
    backgroundColor: '#09090B', 
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginLeft: 15 },
  backBtn: { 
    width: 44, 
    height: 44, 
    backgroundColor: '#18181B', 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#27272A' 
  },

  scrollContent: { paddingHorizontal: 30, paddingBottom: 60, paddingTop: 10 },
  
  centerSection: { alignItems: 'center', marginBottom: 35 },
  iconContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 28, 
    backgroundColor: '#121214', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#27272A' 
  },
  glowEffect: { 
    position: 'absolute', 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FF9500', 
    opacity: 0.15 
  },
  
  title: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: '#71717A', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  formSection: { width: '100%' },
  inputGroup: { gap: 14 },
  inputBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#121214', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 62, 
    borderWidth: 1, 
    borderColor: '#27272A' 
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '600' },

  actionBtn: { 
    backgroundColor: '#FF9500', 
    height: 62, 
    borderRadius: 18, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 40, 
    gap: 10 
  },
  actionBtnText: { color: '#000', fontSize: 16, fontWeight: '900' }
});