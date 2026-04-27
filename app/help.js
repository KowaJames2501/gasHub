import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, SafeAreaView, 
  TouchableOpacity, StatusBar, Platform, Linking 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HelpCenterPage() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
    {
      question: "How do I track my gas delivery?",
      answer: "Once an agent accepts your order, you can view the real-time status in the 'My Orders' section of your homepage."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We currently support Cash on Delivery and Mobile Money payments via our verified agents."
    },
    {
      question: "How do I become a GasHub agent?",
      answer: "Please contact our business team at business@gashub.com or visit the 'Agent Portal' on our website."
    },
    {
      question: "Is there a delivery fee?",
      answer: "Delivery fees are set by individual agents based on your distance from their hub. This will be shown before you confirm your order."
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
          
          {faqs.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.faqCard} 
              onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.questionText}>{item.question}</Text>
                <MaterialCommunityIcons 
                  name={expandedIndex === index ? "minus" : "plus"} 
                  size={20} 
                  color="#FF3B30" 
                />
              </View>
              {expandedIndex === index && (
                <Text style={styles.answerText}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          ))}

          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactSub}>Our support team is available 24/7</Text>
            
            <TouchableOpacity 
              style={styles.supportBtn}
              onPress={() => Linking.openURL('mailto:kowajames0@gmail.com')}
            >
              <MaterialCommunityIcons name="email-outline" size={22} color="#FFF" />
              <Text style={styles.supportBtnText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, height: 60 },
  backBtn: { backgroundColor: '#18181B', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  scrollBody: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionLabel: { color: '#71717A', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginTop: 25, marginBottom: 15, marginLeft: 5 },
  faqCard: { backgroundColor: '#18181B', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#27272A' },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionText: { color: '#FFF', fontSize: 15, fontWeight: '700', flex: 1, marginRight: 10 },
  answerText: { color: '#A1A1AA', fontSize: 14, marginTop: 15, lineHeight: 20 },
  contactSection: { marginTop: 40, alignItems: 'center', backgroundColor: 'rgba(255, 59, 48, 0.05)', padding: 30, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255, 59, 48, 0.1)' },
  contactTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  contactSub: { color: '#71717A', fontSize: 14, marginTop: 5, marginBottom: 20 },
  supportBtn: { flexDirection: 'row', backgroundColor: '#FF3B30', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  supportBtnText: { color: '#FFF', fontWeight: '800', marginLeft: 10 }
});