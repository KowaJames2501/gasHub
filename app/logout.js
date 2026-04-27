import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ImageBackground, TouchableOpacity, 
  SafeAreaView, Dimensions, StatusBar, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import  { triggerLocalNotification } from '../utils/notifications';
import { removeItem } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function LogoutPage() {
  const router = useRouter();

  
  const handleLogout = async () => {
    try {
      await removeItem('token');
      triggerLocalNotification('Logout Successful', 'You have been logged out successfully.');
      router.replace('/login'); 
      
    } catch (error) {
      triggerLocalNotification('Logout Error', 'Something went wrong while clearing your session.');
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
          <SafeAreaView style={styles.container}>
            
            {/* BRAND HEADER */}
            <View style={styles.brandHeader}>
              <View style={styles.logoBox}>
                <MaterialCommunityIcons name="fire" size={32} color="#FFF" />
              </View>
              <Text style={styles.title}>GasHub Session</Text>
              <Text style={styles.subtitle}>Are you sure you want to exit?</Text>
            </View>

            {/* LOGOUT CARD */}
            <View style={styles.formCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="logout-variant" size={40} color="#FF4D4D" />
              </View>

              <Text style={styles.infoText}>
                Logging out will end your current session. You will need to re-verify your credentials to access industrial data.
              </Text>

              {/* ACTION BUTTONS */}
              <TouchableOpacity 
                style={[styles.mainBtn, { opacity: 0.7 }]}
                onPress={handleLogout}    >
                  <Text style={styles.mainBtnText}>CONFIRM LOGOUT</Text>
                 </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => router.back()}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>GasHub Security Protocol v2.1</Text>

          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#FBFAFC' },
  backgroundImage: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  brandHeader: { alignItems: 'center', marginBottom: 30 },
  logoBox: {
    width: 60, height: 60, borderRadius: 20, backgroundColor: '#FF4D4D',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
  },
  title: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#AAA', marginTop: 5 },

  formCard: {
    width: width * 0.85,
    backgroundColor: 'rgba(154, 196, 240, 0.2)',
    borderRadius: 30,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    alignItems: 'center'
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FBFAFC',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 2, borderColor: '#FF4D4D'
  },
  infoText: {
    color: '#DDD', textAlign: 'center', fontSize: 15, 
    lineHeight: 22, marginBottom: 30, fontWeight: '500'
  },

  mainBtn: {
    backgroundColor: '#FF4D4D', width: '100%', height: 60,
    borderRadius: 18, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF4D4D', shadowOpacity: 0.3, shadowRadius: 10,
  },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },

  cancelBtn: { marginTop: 15, width: '100%', height: 50, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { color: '#AAA', fontSize: 14, fontWeight: '700' },

  footerText: { position: 'absolute', bottom: 40, color: '#555', fontSize: 12, fontWeight: 'bold' }
});