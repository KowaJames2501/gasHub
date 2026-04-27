import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, SafeAreaView, 
  TouchableOpacity, StatusBar, Platform, Dimensions, Modal, TextInput 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getItem, removeItem } from '../utils/storage';
import { BASE_URL } from '../utils/config';
import { triggerLocalNotification } from '../utils/notifications';

const { width } = Dimensions.get('window');

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await getItem("token");
        if (token) {
          const response = await fetch(`${BASE_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) setProfile(data.user);
        }
      } catch (e) {
        console.error("Profile Load Error:", e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleWipeHistory = () => {
    triggerLocalNotification(
      "Wipe Order History Completely",
      "Delete Completed Orders. Pending and Processing orders will remain. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Wipe Data", 
          style: "destructive", 
          onPress: async () => {
            try {
              const token = await getItem("token");
              const response = await fetch(`${BASE_URL}/api/wipeorders`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              const data = await response.json();  
              if (data.success) {
                triggerLocalNotification("Success", data.message);
              } else {
                triggerLocalNotification("Error", data.message);
              }
            } catch (e) {
              triggerLocalNotification("Error", "Request failed.");
            }
          } 
        }
      ]
    );
  };

  const openDeleteModal = () => {
    setConfirmPassword('');
    setIsDeleteModalVisible(true);
  };

  const processAccountDeletion = async () => {
    if (!confirmPassword) {
      triggerLocalNotification("Error", "Please enter your password to confirm.");
      return;
    }

    try {
      setIsDeleting(true);
      const token = await getItem("token");
      
      const response = await fetch(`${BASE_URL}/api/deleteaccount`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ password: confirmPassword })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsDeleteModalVisible(false);
        await removeItem('token');
        await removeItem('user_role');
        router.replace("/");
      } else {
        triggerLocalNotification("Error", data.message || "Incorrect password.");
      }
    } catch (e) {
      triggerLocalNotification("Error", "Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    router.push("/logout");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Settings</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          <Text style={styles.sectionLabel}>Profile Management</Text>
          <View style={styles.glassCard}>
            <SettingLink 
              icon="account-edit-outline" 
              label="Update Details" 
              subLabel={profile?.email || "Manage your information"}
              onPress={() => router.push("/profile")} 
            />
            <View style={styles.divider} />
            <SettingLink 
              icon="lock-reset" 
              label="Update Password" 
              onPress={() => router.push("/passwordupdate")} 
            />
          </View>

          <Text style={[styles.sectionLabel, { color: '#EF4444' }]}>Danger Zone</Text>
          <View style={[styles.glassCard, { borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
            <SettingLink 
              icon="broom" 
              label="Wipe Local History" 
              subLabel="Clear cache and local settings"
              onPress={handleWipeHistory} 
            />
            <View style={styles.divider} />
            <SettingLink 
              icon="account-remove-outline" 
              label="Delete Account" 
              subLabel="Permanent removal of data"
              onPress={openDeleteModal} 
            />
          </View>

          <Text style={styles.sectionLabel}>Support</Text>
          <View style={styles.glassCard}>
            <SettingLink icon="help-circle-outline" label="Help Center" onPress={() => router.push("/help")}/>
            <View style={styles.divider} />
            <SettingLink icon="file-document-outline" label="Privacy Policy" onPress={() => router.push("/privacy")}/>
          </View> 

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={22} color="#FFF" />
            <Text style={styles.logoutText}>SIGN OUT OF GASHUB</Text>
          </TouchableOpacity>

          <Text style={styles.footerBranding}>GAS HUB LTD © 2026  || App version 2.0.4</Text>
        </ScrollView>
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="alert-decagram" size={50} color="#FF3B30" />
            <Text style={styles.modalTitle}>Confirm Deletion</Text>
            <Text style={styles.modalSub}>Enter your password to permanently delete your GasHub account.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Password"
              placeholderTextColor="#71717A"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoFocus
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.confirmDeleteBtn, isDeleting && { opacity: 0.5 }]} 
                onPress={processAccountDeletion}
                disabled={isDeleting}
              >
                <Text style={styles.confirmDeleteText}>
                  {isDeleting ? "Deleting..." : "Delete Forever"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SettingLink = ({ icon, label, subLabel, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.iconCircle}>
      <MaterialCommunityIcons name={icon} size={20} color="#FF3B30" />
    </View>
    <View style={{ flex: 1, marginLeft: 15 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      {subLabel && <Text style={styles.rowSubLabel}>{subLabel}</Text>}
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#3F3F46" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 60 },
  backBtn: { backgroundColor: '#18181B', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel: { color: '#71717A', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 25, marginBottom: 12, marginLeft: 5 },
  glassCard: { backgroundColor: '#18181B', borderRadius: 24, borderWidth: 1, borderColor: '#27272A', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  iconCircle: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#09090B', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  rowLabel: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  rowSubLabel: { color: '#71717A', fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#27272A', marginLeft: 70 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, backgroundColor: '#FF3B30', padding: 18, borderRadius: 20 },
  logoutText: { color: '#FFF', fontWeight: '900', fontSize: 14, marginLeft: 10, letterSpacing: 1 },
  footerBranding: { textAlign: 'center', color: '#27272A', fontSize: 10, fontWeight: '800', marginTop: 40, letterSpacing: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#18181B', borderRadius: 30, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginTop: 15 },
  modalSub: { color: '#71717A', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  modalInput: { width: '100%', height: 55, backgroundColor: '#09090B', borderRadius: 15, marginTop: 20, paddingHorizontal: 15, color: '#FFF', borderWidth: 1, borderColor: '#27272A' },
  modalActionRow: { flexDirection: 'row', marginTop: 25, gap: 10 },
  cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#27272A' },
  cancelBtnText: { color: '#FFF', fontWeight: '700' },
  confirmDeleteBtn: { flex: 2, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#FF3B30' },
  confirmDeleteText: { color: '#FFF', fontWeight: '900' }
});