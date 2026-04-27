import React, { useState, useRef } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Dimensions, 
  SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView, 
  Platform, ScrollView, Modal, ActivityIndicator, Pressable 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_URL } from '../utils/config';
import { triggerLocalNotification } from '../utils/notifications';

const { width } = Dimensions.get('window');

export default function ResetPasswordPage() {
  const router = useRouter();
  
  // Logic States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']); // Array for the UI
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI States
  const [modalVisible1, setModalVisible1] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const otpRefs = useRef([]);

  // --- LOGIC: SEND OTP ---
  const handleSendOTP = async () => {
    if (!email) {
      triggerLocalNotification('Failed', 'Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/sendOTP`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (response.ok) {
        triggerLocalNotification('Success', 'OTP sent, visit your email.'); 
        setModalVisible1(true);             
      } else {
        triggerLocalNotification('Failed', result.message || 'Failed to send OTP');
      }
    } catch (error) {
      triggerLocalNotification('Failed', 'OTP Request Failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC: VERIFY OTP ---
  const handleVerifyOTP = async () => {
    const combinedOtp = otp.join('');
    if (combinedOtp.length < 5) {
      triggerLocalNotification('Failed', 'Please enter full OTP to verify');
      return;
    }  
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/verifyOTP`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: combinedOtp, email }),
      });   
      const result = await response.json();
      if (response.ok) {
        triggerLocalNotification('Success', 'OTP verified, Enter new password');
        setModalVisible2(true);           
      } else {
        triggerLocalNotification('Failed', result.message || 'OTP verification failed.');
      }
    } catch (error) {
      triggerLocalNotification('Failed', 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC: NEW PASSWORD ---
  const handlenewPassword = async () => {
    const isValidPassword = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{5,}$/.test(pwd);
    
    if (!password || !confirmPassword) {
      triggerLocalNotification('Failed', 'All fields are required'); return;
    }
    if (!isValidPassword(password)) {
      triggerLocalNotification('Weak Password', 'Password must have 5 characters, with (1 capital, 1 small, 1 number, 1 sign)'); return;
    }
    if (password !== confirmPassword) {
      triggerLocalNotification('Mismatch', 'Passwords do not match'); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/newPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      
      triggerLocalNotification('Success', 'Password has been reset');
      setModalVisible2(false);
      setModalVisible1(false);
      router.push('/login');
    } catch (error) {
      triggerLocalNotification('Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 4) otpRefs.current[index + 1].focus();
  };

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerSection}>
            <View style={styles.iconContainer}>
              <View style={styles.glowEffect} />
              <MaterialCommunityIcons name="lock-reset" size={48} color="#FF9500" />
            </View>
            <Text style={styles.title}>Reset Access</Text>
            <Text style={styles.subtitle}>Enter your business email to receive a recovery code.</Text>
          </View>

          <View style={styles.inputBox}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#71717A" style={styles.inputIcon} />
            <TextInput 
              placeholder="Registered Email" 
              placeholderTextColor="#3F3F46" 
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={handleSendOTP}>
            {loading ? <ActivityIndicator color="#000" /> : (
              <>
                <Text style={styles.actionBtnText}>Send OTP</Text>
                <MaterialCommunityIcons name="send-outline" size={20} color="#000" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* --- MODAL 1: VERIFY OTP --- */}
      <Modal visible={modalVisible1} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Verification</Text>
            <Text style={styles.modalSubtitle}>Enter the 5-digit code sent to your email.</Text>
            
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput 
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  onChangeText={t => handleOtpChange(t, i)}
                  value={digit}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={handleVerifyOTP}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.actionBtnText}>Verify OTP</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setModalVisible1(false)} style={styles.cancelBtn}>
              <Text style={styles.resendText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MODAL 2: NEW PASSWORD --- */}
      <Modal visible={modalVisible2} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Secure Account</Text>
            <Text style={styles.modalSubtitle}>Create your new industrial-strength password.</Text>
            
            <View style={{ gap: 12 }}>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#71717A" style={styles.inputIcon} />
                <TextInput 
                  placeholder="New Password" 
                  placeholderTextColor="#3F3F46" 
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={20} color="#71717A" />
                </Pressable>
              </View>

              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color="#71717A" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Confirm Password" 
                  placeholderTextColor="#3F3F46" 
                  style={styles.input}
                  secureTextEntry={!showPasswordConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}>
                  <MaterialCommunityIcons name={showPasswordConfirm ? "eye-off" : "eye"} size={20} color="#71717A" />
                </Pressable>
              </View>
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={handlenewPassword}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.actionBtnText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 50 },
  backBtn: { width: 44, height: 44, backgroundColor: '#18181B', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  scrollContent: { paddingHorizontal: 30, paddingTop: 40 },
  centerSection: { alignItems: 'center', marginBottom: 40 },
  iconContainer: { width: 90, height: 90, borderRadius: 30, backgroundColor: '#121214', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  glowEffect: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF9500', opacity: 0.1 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 12 },
  subtitle: { color: '#71717A', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  formSection: { width: '100%' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121214', borderRadius: 16, paddingHorizontal: 16, height: 64, borderWidth: 1, borderColor: '#27272A' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '600' },
  actionBtn: { backgroundColor: '#FF9500', height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30, gap: 10 },
  actionBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#09090B', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, paddingBottom: 50, borderTopWidth: 1, borderColor: '#27272A' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#27272A', borderRadius: 2, alignSelf: 'center', marginBottom: 25 },
  modalTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  modalSubtitle: { color: '#71717A', fontSize: 14, textAlign: 'center', marginTop: 10, marginBottom: 32 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  otpInput: { width: (width - 120) / 6, height: 64, backgroundColor: '#121214', borderRadius: 14, borderWidth: 1, borderColor: '#27272A', textAlign: 'center', color: '#FF9500', fontSize: 22, fontWeight: '900' },
  cancelBtn: { marginTop: 20, alignItems: 'center' },
  resendText: { color: '#71717A', fontSize: 14, fontWeight: '600' }
});