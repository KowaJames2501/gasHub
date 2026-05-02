import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getItem } from "../utils/storage";
import { BASE_URL } from "../utils/config";
import { triggerLocalNotification } from "../utils/notifications";

export default function AddSupplier() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      triggerLocalNotification("Error", "Brand name and Phone are required");
      return;
    }

    setLoading(true);
    try {
      const token = await getItem("token");
      const res = await fetch(`${BASE_URL}/api/addsupplier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        triggerLocalNotification("Success", "Supplier added successfully");
        router.back();
      } else {
        triggerLocalNotification(
          "Error",
          data.message || "Failed to add supplier",
        );
      }
    } catch (e) {
      triggerLocalNotification("Error", "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Supplier</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="truck-plus"
              size={40}
              color="#FF9500"
            />
          </View>

          <Text style={styles.subtitle}>
            Enter business details to register a new gas supplier.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>BRAND NAME</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="briefcase-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Oryx Energies"
                placeholderTextColor="#444"
                value={form.name}
                onChangeText={(txt) => setForm({ ...form, name: txt })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. contact@supplier.com"
                placeholderTextColor="#444"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(txt) => setForm({ ...form, email: txt })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="phone-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. +255..."
                placeholderTextColor="#444"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(txt) => setForm({ ...form, phone: txt })}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.submitText}>REGISTER SUPPLIER</Text>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#000"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#000" ,paddingTop: Platform.OS === 'android' ? 10 : 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 10,
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#151517",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  container: { paddingHorizontal: 30, alignItems: "center", paddingTop: 20 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF950015",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  subtitle: {
    color: "#666",
    textAlign: "center",
    fontSize: 13,
    marginBottom: 30,
    lineHeight: 20,
  },
  inputGroup: { width: "100%", marginBottom: 20 },
  label: {
    color: "#FF9500",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D0D0E",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#1A1A1B",
    height: 55,
    paddingHorizontal: 15,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: "#FFF", fontSize: 15 },
  submitBtn: {
    width: "100%",
    backgroundColor: "#FF9500",
    height: 55,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  disabledBtn: { opacity: 0.7 },
  submitText: { color: "#000", fontSize: 15, fontWeight: "900" },
});
