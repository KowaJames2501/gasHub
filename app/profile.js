import React, { useEffect, useState, useCallback } from "react";
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl,
  Image, SafeAreaView, StatusBar, TextInput, ActivityIndicator,
  Platform, useWindowDimensions, Modal, Alert, Pressable,
  KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getItem } from '../utils/storage';
import { BASE_URL } from '../utils/config';
import { triggerLocalNotification } from '../utils/notifications';
import { pickFile } from '../utils/filepicker';

export default function ProfilePage() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  
  // States
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', location: ''
  });

  const containerWidth = screenWidth > 500 ? 450 : '100%';

  const getRoleLabel = (role) => {
    const roles = { ad: "Hub Admin", ag: "Field Agent", sp: "Supplier", ct: "Customer" };
    return roles[role] || "User";
  };

  const fetchProfile = async () => {
    try {
      const token = await getItem("token");
      if (!token) {
        triggerLocalNotification("Authentication Required", "Please log in again.");
        router.replace('/login');
        return;
      }
      const response = await fetch(`${BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.user);
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          location: data.user.location || ''
        });
      }
    } catch (error) {
      triggerLocalNotification("Error", "Could not load profile");
    } finally {
      setRefreshing(false);
    }
  };

  const handleImagePick = async () => {
    const result = await pickFile();
    if (result) {
      processPhotoUpdate(result);
    }
  };

  const processPhotoUpdate = async (fileData) => {
    setLoading(true);
    try {
      const token = await getItem("token");
      const data = new FormData();
      
      if (fileData && fileData.file) {
        if (fileData.isWeb) {
          data.append('photo', fileData.file, fileData.name);
        } else {
          data.append('photo', fileData.file);
        }
      } else {
        data.append('removePhoto', 'true');
      }

      const response = await fetch(`${BASE_URL}/api/updatephoto`, {
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await response.json();
      if (result.success) {
        setProfile(result.user);
        triggerLocalNotification("Success", fileData ? "Photo updated!" : "Photo removed!");
        fetchProfile();
      } else {
        triggerLocalNotification("Error", result.message);
      }
    } catch (e) {
      triggerLocalNotification("Error", "Photo server connection failed");
    } finally {
      setLoading(false);
    }
  };

  const openPhotoOptions = () => {
    const hasPhoto = !!profile?.photo_url;
    triggerLocalNotification(
      "Profile Photo",
      "Manage your profile picture",
      [
        { text: hasPhoto ? "Change Photo" : "Upload New", onPress: handleImagePick },
        ...(hasPhoto ? [{ 
          text: "Remove Photo", 
          style: 'destructive', 
          onPress: () => triggerLocalNotification("Confirm Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: () => processPhotoUpdate(null) }
          ])
        }] : []),
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleUpdateDetails = async () => {
    setLoading(true);
    try {
      const token = await getItem("token");
      const response = await fetch(`${BASE_URL}/api/updateprofile`, {
        method: 'PUT', 
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setProfile(data.user);
        fetchProfile();
        triggerLocalNotification("Success", data.message);
        Keyboard.dismiss();
      }
    } catch (error) {
      triggerLocalNotification("Error", "Update failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchProfile();
  }, []);

  return (
    <View style={styles.outerWrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.safeArea}>
            <View style={[styles.mainContainer, { width: containerWidth }]}>
              
              <View style={styles.headerNav}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                  <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 40 }} /> 
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollBody}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchProfile();}} tintColor="#FF3B30" />
                }
              >
                {/* Profile Hero Section */}
                <View style={styles.profileHero}>
                  <View style={styles.avatarContainer}>
                    <TouchableOpacity 
                      activeOpacity={0.9} 
                      onPress={() => profile?.photo_url && setShowViewer(true)} 
                      style={styles.avatarWrapper}
                    >
                      {profile?.photo_url ? (
                        <Image source={{ uri: `${BASE_URL}${profile?.photo_url}` }} style={styles.largeAvatar} />
                      ) : (
                        <View style={[styles.largeAvatar, styles.placeholderAvatar]}>
                          <MaterialCommunityIcons name="account" size={60} color="#333" />
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={openPhotoOptions} style={styles.cameraBadge}>
                      <MaterialCommunityIcons name="pencil" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.userName}>{profile?.name || "Loading..."}</Text>
                  <Text style={styles.userRole}>{getRoleLabel(profile?.role)}</Text>
                </View>

                {/* Account Info Form */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionLabel}>Account Information</Text>
                  <View style={styles.infoCard}>
                    <EditRow icon="shield-outline" label="Account Identity" value={`Gas-Hub-${profile?.id || '0'}-26`} editable={false} />
                    <EditRow icon="account-outline" label="Full Name" value={formData.name} onChangeText={(txt) => setFormData({...formData, name: txt})} />
                    <EditRow icon="email-outline" label="Email Address" value={formData.email} onChangeText={(txt) => setFormData({...formData, email: txt})} />
                    <EditRow icon="phone-outline" label="Phone" value={formData.phone} onChangeText={(txt) => setFormData({...formData, phone: txt})} />
                    <EditRow icon="map-marker-outline" label="Location" value={formData.location} onChangeText={(txt) => setFormData({...formData, location: txt})} />
                  </View>
                </View>

                <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateDetails} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.updateBtnText}>Save Changes</Text>}
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/logout')}>
                   <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" />
                   <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* --- IMAGE DRAWER (PREVIEW) --- */}
      <Modal visible={showViewer} transparent animationType="fade">
        <Pressable style={styles.viewerOverlay} onPress={() => setShowViewer(false)}>
          <View style={styles.viewerCard}>
            <View style={styles.viewerHeader}>
              <Text style={styles.viewerTitle}>Profile Preview</Text>
              <TouchableOpacity onPress={() => setShowViewer(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Image 
              source={{ uri: `${BASE_URL}${profile?.photo_url}` }} 
              style={styles.fullImage}
              resizeMode="cover"
            />
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

const EditRow = ({ icon, label, value, onChangeText, editable = true }) => (
  <View style={[styles.infoRow, !editable && { opacity: 0.4 }]}>
    <View style={styles.infoIconBox}>
      <MaterialCommunityIcons name={icon} size={20} color={editable ? "#FF3B30" : "#555"} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <TextInput 
        style={styles.infoInput} 
        value={value} 
        onChangeText={onChangeText} 
        editable={editable} 
        placeholderTextColor="#555"
        color="#EEE" 
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  outerWrapper: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  mainContainer: { flex: 1, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  headerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, marginTop: Platform.OS === 'android' ? 30 : 0 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  backBtn: { width: 40, height: 40, backgroundColor: '#1C1C1E', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 40 },
  profileHero: { alignItems: 'center', marginVertical: 30 },
  avatarContainer: { position: 'relative' },
  largeAvatar: { width: 110, height: 110, borderRadius: 35, borderWidth: 2, borderColor: '#FF3B30' },
  placeholderAvatar: { backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  cameraBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FF3B30', width: 35, height: 35, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  userName: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 15 },
  userRole: { color: '#FF3B30', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 },
  sectionLabel: { color: '#666', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 15, marginLeft: 5 },
  infoSection: { marginBottom: 20 },
  infoCard: { backgroundColor: '#121214', borderRadius: 25, paddingVertical: 10, borderWidth: 1, borderColor: '#1C1C1E' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  infoIconBox: { marginRight: 15, width: 24, alignItems: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { color: '#555', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  infoInput: { fontSize: 15, fontWeight: '500', marginTop: 2, padding: 0 },
  updateBtn: { backgroundColor: '#FF3B30', padding: 18, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  updateBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, marginTop: 15 },
  logoutText: { color: '#FF3B30', fontWeight: '700', fontSize: 15, marginLeft: 10 },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  viewerCard: { width: '85%', backgroundColor: '#121214', borderRadius: 30, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#1C1C1E' },
  viewerHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15, paddingHorizontal: 5 },
  viewerTitle: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  fullImage: { width: '100%', aspectRatio: 1, borderRadius: 20 }
});