import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, SafeAreaView, TextInput, 
  TouchableOpacity, StatusBar, KeyboardAvoidingView, 
  Platform, ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getItem } from '../utils/storage';
import { BASE_URL } from '../utils/config';
import { triggerLocalNotification } from '../utils/notifications';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Validation Logic
  const isLengthValid = passwords.newPassword.length >= 5;
  const hasUpperCase = /[A-Z]/.test(passwords.newPassword);
  const isMatching = passwords.newPassword === passwords.confirmPassword && passwords.newPassword !== '';

  const handlePasswordChange = async () => {
    // Front-end Guard Rails
    if (!passwords.oldPassword || !passwords.newPassword) {
      triggerLocalNotification("Error", "Please fill in all fields.");
      return;
    }
    if (!isLengthValid || !hasUpperCase || !isMatching) {
      triggerLocalNotification("Error", "Please meet all password requirements.");
      return;
    }

    setLoading(true);
    try {
      const token = await getItem("token");
      const response = await fetch(`${BASE_URL}/api/changepassword`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        // triggerLocalNotification("Security Update", "Your password has been changed successfully.");
        triggerLocalNotification("Success",data.message, [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        triggerLocalNotification("Update Failed", data.message || "Incorrect current password.");
      }
    } catch (error) {
      triggerLocalNotification("Connection Error", error);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.iconHeader}>
              <View style={styles.lockCircle}>
                <MaterialCommunityIcons name="lock-open-outline" size={50} color="#FF3B30" />
              </View>
              <Text style={styles.mainTitle}>Change Password</Text>
              <Text style={styles.subTitle}>Create a strong password to protect your GasHub account</Text>
            </View>

            <View style={styles.form}>
              <PasswordField 
                label="Current Password"
                placeholder="Enter old password"
                value={passwords.oldPassword}
                visible={showOld}
                onToggle={() => setShowOld(!showOld)}
                onChangeText={(txt) => setPasswords({...passwords, oldPassword: txt})}
              />

              <View style={styles.divider} />

              <PasswordField 
                label="New Password"
                placeholder="At least 5 characters"
                value={passwords.newPassword}
                visible={showNew}
                onToggle={() => setShowNew(!showNew)}
                onChangeText={(txt) => setPasswords({...passwords, newPassword: txt})}
              />

              <PasswordField 
                label="Confirm New Password"
                placeholder="Re-type new password"
                value={passwords.confirmPassword}
                visible={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                onChangeText={(txt) => setPasswords({...passwords, confirmPassword: txt})}
              />

              <View style={styles.requirements}>
                <RequirementRow met={isLengthValid} text="Minimum 5 characters" />
                <RequirementRow met={hasUpperCase} text="One uppercase letter" />
                <RequirementRow met={isMatching} text="Passwords match" />
              </View>

              <TouchableOpacity 
                style={[styles.updateBtn, (loading || !isMatching) && { opacity: 0.6 }]} 
                onPress={handlePasswordChange}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.updateBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const PasswordField = ({ label, value, placeholder, visible, onToggle, onChangeText }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#555"
        secureTextEntry={!visible}
        value={value}
        onChangeText={onChangeText}
        color="#FFF"
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
        <MaterialCommunityIcons 
          name={visible ? "eye-off-outline" : "eye-outline"} 
          size={20} 
          color="#71717A" 
        />
      </TouchableOpacity>
    </View>
  </View>
);

const RequirementRow = ({ met, text }) => (
  <View style={styles.reqRow}>
    <MaterialCommunityIcons 
      name={met ? "check-circle" : "circle-outline"} 
      size={14} 
      color={met ? "#4CD964" : "#3F3F46"} 
    />
    <Text style={[styles.reqText, met && { color: '#EEE' }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { backgroundColor: '#1C1C1E', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  iconHeader: { alignItems: 'center', marginVertical: 30 },
  lockCircle: { 
    width: 90, 
    height: 90, 
    borderRadius: 30, 
    backgroundColor: 'rgba(255, 59, 48, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)'
  },
  mainTitle: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  subTitle: { color: '#71717A', textAlign: 'center', marginTop: 8, lineHeight: 20, fontSize: 13 },
  form: { marginTop: 10 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: '#71717A', fontSize: 11, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#18181B', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#27272A',
    paddingHorizontal: 15
  },
  input: { flex: 1, height: 55, fontSize: 15, fontWeight: '500' },
  eyeBtn: { padding: 10 },
  divider: { height: 1, backgroundColor: '#27272A', marginBottom: 25 },
  requirements: { marginBottom: 30, paddingLeft: 5 },
  reqRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reqText: { color: '#3F3F46', fontSize: 12, marginLeft: 10, fontWeight: '600' },
  updateBtn: { 
    backgroundColor: '#FF3B30', 
    height: 60, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8
  },
  updateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }
});