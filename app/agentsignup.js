import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  TextInput, SafeAreaView, StatusBar, Dimensions, Image, 
  Platform, KeyboardAvoidingView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { pickFile } from '../utils/filepicker'; 
import { BASE_URL } from '../utils/config';
import { triggerLocalNotification } from '../utils/notifications';

export default function AgentRegistrationPage() {
  const router = useRouter();
  const [form, setForm] = useState({ businessName: '', email: '', phone: '', address: '' });
  const [docs, setDocs] = useState({ license: null, id_card: null });
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleFileSelection = async (type) => {
  const fileData = await pickFile();
  if (fileData) {
    setDocs({ ...docs, [type]: fileData });
  }
};

const handleSubmit = async () => {
  if (!form.businessName || !form.email || !docs.license || !docs.id_card) {
    triggerLocalNotification("Please fill all fields and upload required documents.");
    return;
  }

  setIsSubmitting(true);
  try {
    const formData = new FormData();
    
    // Append Text Data
    formData.append('businessName', form.businessName);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('address', form.address);


    formData.append('license', {
      uri: docs.license.uri,
      name: docs.license.name,
      type: docs.license.type,
    });

    formData.append('id_card', {
      uri: docs.id_card.uri,
      name: docs.id_card.name,
      type: docs.id_card.type,
    });

    const response = await fetch(`${BASE_URL}/api/agentregister`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      triggerLocalNotification("Success!", result.message);
      router.replace('/');
    } else {
      triggerLocalNotification(result.message || "Registration failed.");
    }
  } catch (error) {
    console.error("Upload error:", error);
    triggerLocalNotification("Network error. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          
          {/* CLEAN HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Agent Application Form</Text>
              <Text style={styles.headerSub}>Complete the form to join Gas Hub</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <Text style={styles.sectionLabel}>Business Profile</Text>
            <View style={styles.inputContainer}>
              <InputField icon="store-outline" placeholder="Business Name" value={form.businessName} onChangeText={(t) => setForm({...form, businessName: t})} />
              <InputField icon="email-outline" placeholder="Email Address" value={form.email} onChangeText={(t) => setForm({...form, email: t})} />
              <InputField icon="phone-outline" placeholder="Phone Number" value={form.phone} onChangeText={(t) => setForm({...form, phone: t})} />
              <InputField icon="map-marker-outline" placeholder="Physical Address" value={form.address} onChangeText={(t) => setForm({...form, address: t})} />
            </View>

            <Text style={styles.sectionLabel}>Required Documents</Text>
            <View style={styles.uploadRow}>
              <UploadCard label="Business License" imageUri={docs.license?.uri}   onPress={() => handleFileSelection('license')}
              />
              <UploadCard label="National ID" imageUri={docs.id_card?.uri} onPress={() => handleFileSelection('id_card')} />
            </View>
            <TouchableOpacity  style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}   onPress={handleSubmit}  disabled={isSubmitting}>
                {isSubmitting ? (
           <ActivityIndicator color="#000" />
                 ) : (
                   <>
      <Text style={styles.submitBtnText}>Submit Application</Text>
      <MaterialCommunityIcons name="send" size={20} color="#000" />
    </>
  )}
</TouchableOpacity>

            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/login')}>
              <Text style={styles.footerLinkText}>Already have an account? <Text style={styles.orangeText}>Log In</Text></Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Minimalist Input Sub-component
const InputField = ({ icon, ...props }) => (
  <View style={styles.inputBox}>
    <MaterialCommunityIcons name={icon} size={20} color="#71717A" style={styles.inputIcon} />
    <TextInput placeholderTextColor="#3F3F46" style={styles.input} {...props} />
  </View>
);

// Industrial Upload Sub-component
const UploadCard = ({ label, imageUri, onPress }) => (
  <TouchableOpacity style={[styles.uploadCard, imageUri && styles.uploadCardSuccess]} onPress={onPress}>
    {imageUri ? (
      <View style={styles.previewContainer}>
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
        <View style={styles.previewOverlay}><MaterialCommunityIcons name="check-circle" size={24} color="#34C759" /></View>
      </View>
    ) : (
      <View style={styles.uploadPlaceholder}>
        <MaterialCommunityIcons name="camera-plus-outline" size={26} color="#FF9500" />
        <Text style={styles.uploadLabel}>{label}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, gap: 15 },
  backBtn: { width: 44, height: 44, backgroundColor: '#18181B', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  headerSub: { color: '#71717A', fontSize: 13, fontWeight: '500' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel: { color: '#FF9500', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 30, marginBottom: 15, letterSpacing: 1.5 },
  inputContainer: { gap: 12 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121214', borderRadius: 16, paddingHorizontal: 16, height: 60, borderWidth: 1, borderColor: '#27272A' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '600' },
  uploadRow: { flexDirection: 'row', gap: 15 },
  uploadCard: { flex: 1, height: 120, backgroundColor: '#121214', borderRadius: 20, borderWidth: 1, borderColor: '#27272A', borderStyle: 'dashed', overflow: 'hidden' },
  uploadCardSuccess: { borderStyle: 'solid', borderColor: '#34C75940' },
  uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  uploadLabel: { color: '#71717A', fontSize: 12, fontWeight: '700' },
  previewContainer: { flex: 1 },
  previewImage: { width: '100%', height: '100%', opacity: 0.5 },
  previewOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  submitBtn: { backgroundColor: '#FF9500', width: '100%', height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40, gap: 12 },
  submitBtnText: { color: '#000', fontSize: 17, fontWeight: '900' },
  footerLink: { marginTop: 25, alignItems: 'center' },
  footerLinkText: { color: '#71717A', fontSize: 14, fontWeight: '600' },
  orangeText: { color: '#FF9500', fontWeight: '800' }
});