import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ImageBackground, TouchableOpacity, 
  TextInput, SafeAreaView, KeyboardAvoidingView, 
  Platform, StatusBar, ScrollView, useWindowDimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_URL } from '../utils/config';
import { saveItem } from '../utils/storage';
import { triggerLocalNotification } from '../utils/notifications';

export default function LoginPage() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const responsiveWidth = screenWidth > 400 ? 400 : '100%';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      triggerLocalNotification('Missing Credentials', 'Please enter both email and password.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json();
      if (data.success) {
        await saveItem('token', data.token); 
        await saveItem('user_role', data.user.role);
        
        const role = data.user.role;
        const routes = { ad: '/(admin)', ct: '/homepage', sp: '/(supplier)', ag: '/(agent)' };
        triggerLocalNotification('Access Granted!', `Hello ${data.user.name}, Welcome Aboard!`);
        router.replace(routes[role] || '/homepage');
      } else {
        triggerLocalNotification('Login Failed', data.message);
      }
    } catch (error) {
      triggerLocalNotification('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerWrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070' }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <SafeAreaView style={styles.safeArea}>
              {/* This inner view maintains your 400px width constraint */}
              <View style={[styles.mainContainer, { width: responsiveWidth }]}>
                
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
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Secure access to your GasHub account</Text>
                  </View>

                  <View style={styles.formCard}>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="email-outline" size={20} color="#FF4D4D" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>

                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons name="lock-outline" size={20} color="#FF4D4D" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <MaterialCommunityIcons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color="#FF4D4D" 
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.forgotPass} onPress={() => router.push('/resetpassword')}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.mainBtn, loading && { opacity: 0.7 }]}
                      onPress={handleLogin}
                      disabled={loading}
                    >
                      <Text style={styles.mainBtnText}>{loading ? 'VERIFYING...' : 'SIGN IN'}</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                      <View style={styles.line} />
                      <Text style={styles.dividerText}>GAS HUB</Text>
                      <View style={styles.line} />
                    </View>

                    <View style={styles.footer}>
                      <Text style={styles.footerText}>New to GasHub? </Text>
                      <TouchableOpacity onPress={() => router.push('/signup')}>
                        <Text style={styles.footerLink}>Create Account</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  backgroundImage: { 
    flex: 1, 
    width: '100%', 
    height: '100%' 
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.75)' 
  },
  keyboardView: { 
    flex: 1 
  },
  safeArea: { 
    flex: 1 
  },
  // Centering the logic
  mainContainer: {
    flex: 1,
    alignSelf: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: Platform.OS === 'android' ? 40 : 10 // Account for StatusBar
  },
  scrollContent: { 
    paddingHorizontal: 25, 
    paddingBottom: 50 
  },
  brandHeader: { 
    alignItems: 'center', 
    marginTop: 30, 
    marginBottom: 30 
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#AAA', marginTop: 5, textAlign: 'center' },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Lightened slightly for better visibility
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFAFC',
    borderRadius: 18,
    paddingHorizontal: 15,
    height: 60,
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: '#FF4D4D',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#1A1A1A', fontSize: 15, fontWeight: '500' },
  forgotPass: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#FF4D4D', fontWeight: '700', fontSize: 13 },
  mainBtn: {
    backgroundColor: '#FF4D4D',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  dividerText: { marginHorizontal: 15, color: '#AAA', fontSize: 12, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#AAA', fontSize: 14 },
  footerLink: { color: '#FF4D4D', fontWeight: '800', fontSize: 14 }
});