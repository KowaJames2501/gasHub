import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ImageBackground, TouchableOpacity, 
  TextInput, SafeAreaView, Dimensions, KeyboardAvoidingView, 
  Platform, StatusBar, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import  { triggerLocalNotification } from '../utils/notifications';

import { BASE_URL } from '../utils/config';

const { width, height } = Dimensions.get('window');

export default function RegisterPage() {
  const router = useRouter();
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const { name, email, password, confirmPassword } = form;
    if (!name || !email || !password || !confirmPassword) {
      triggerLocalNotification('Missing Info', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      triggerLocalNotification('Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/register`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      if (data.success === true) {
        triggerLocalNotification('Success', data.message );
        router.push('/login');
      } else {
        triggerLocalNotification('Error', data.message);
      }
    } catch (error) {
      triggerLocalNotification('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" />
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070' }} 
        style={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : null}
            style={styles.keyboardView}
          >
            <SafeAreaView style={styles.container}>
              
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
              </TouchableOpacity>

              <ScrollView 
                keyboardShouldPersistTaps="handled" 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.brandHeader}>
                  <View style={styles.logoBox}>
                    <MaterialCommunityIcons name="fire" size={32} color="#FFF" />
                  </View>
                  <Text style={styles.title}>Join GasHub</Text>
                  <Text style={styles.subtitle}>Create an industrial-grade account</Text>
                </View>

                <View style={styles.formCard}>
                  
                  {/* Full Name */}
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="account-outline" size={20} color="#FF4D4D" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#999"
                      value={form.name}
                      onChangeText={(val) => setForm({...form, name: val})}
                    />
                  </View>

                  {/* Email */}
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="email-outline" size={20} color="#FF4D4D" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email Address"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={form.email}
                      onChangeText={(val) => setForm({...form, email: val})}
                    />
                  </View>

                  {/* Password */}
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color="#FF4D4D" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      value={form.password}
                      onChangeText={(val) => setForm({...form, password: val})}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <MaterialCommunityIcons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#FF4D4D" 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color="#FF4D4D" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showConfirmPassword}
                      value={form.confirmPassword}
                      onChangeText={(val) => setForm({...form, confirmPassword: val})}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <MaterialCommunityIcons 
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#FF4D4D" 
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={[styles.mainBtn, loading && { opacity: 0.7 }]}
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    <Text style={styles.mainBtnText}>{loading ? 'PROCESSING...' : 'CREATE ACCOUNT'}</Text>
                  </TouchableOpacity>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/login')}>
                      <Text style={styles.footerLink}>Sign In</Text>
                    </TouchableOpacity>
                  </View>

                </View>

                <Text style={styles.terms}>
                  By proceeding, you agree to our <Text style={{color: '#FF4D4D'}}>Terms of Security</Text> & Privacy Policy.
                </Text>

              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#FBFAFC', maxWidth: 400, alignSelf: 'center', width: '100%' },
  backgroundImage: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
  keyboardView: { flex: 1 },
  container: { flex: 1 },
  backBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#1C1C1E',
    justifyContent: 'center', alignItems: 'center', marginLeft: 20, marginTop: 10
  },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 50 },
  brandHeader: { alignItems: 'center', marginTop: 30, marginBottom: 40 },
  logoBox: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#FF4D4D',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
  },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#AAA', marginTop: 5 },
  formCard: {
    backgroundColor: 'rgba(154, 196, 240, 0.36)',
    borderRadius: 30, padding: 25, borderWidth: 1, borderColor: 'rgba(28, 28, 30, 0.5)'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFAFC',
    borderRadius: 18,
    paddingHorizontal: 15,
    height: 62,
    marginBottom: 15,
    borderWidth: 2, // Slightly thicker for industrial look
    borderColor: '#FF4D4D', // Static Red Border
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#1A1A1A', fontSize: 15, fontWeight: '500' },
  mainBtn: {
    backgroundColor: '#FF4D4D', height: 62, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
  },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#FF4D4D', fontWeight: '800', fontSize: 14 },
  terms: {
    color: '#888', fontSize: 12, textAlign: 'center', marginTop: 30,
    lineHeight: 18, fontWeight: '600'
  }
});