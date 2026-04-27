import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ImageBackground, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  useWindowDimensions,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { getItem } from '../utils/storage';

export default function LandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  // Ensure background doesn't exceed the wrapper's maxWidth
  const containerWidth = width > 600 ? 600 : width;


  const handleGetStarted = async () => {

    const token = await getItem("token");
    if(!token) {
      router.push('/login');
      return;
    }
    const role = await getItem("user_role");
    if(role === 'ag') {
      router.push('/(agent)');
    } else if(role === 'ct') {
      router.push('/homepage');
    }  else if(role === 'sp') {
      router.push('/(supplier)');
    }else {
      router.push('/(admin)');
    }
  }

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070' }} 
        style={[styles.backgroundImage, { width: containerWidth }]}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            
            {/* Top Branding - Flexible spacing */}
            <View style={styles.brandContainer}>
              <Text style={styles.brandName}>Gas Distribution</Text>
            </View>

            {/* Bottom Section - Pushed down by flex: 1 */}
            <View style={styles.bottomWrapper}>
              <View style={styles.descriptionCard}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoEmoji}>🔥</Text>
                </View>

                <Text style={styles.title}>Gas Hub</Text>
                <Text style={styles.description}>
                  Experience the modern way to manage your home energy. 
                  Order refills and track deliveries in real-time.
                </Text>

                {/* Main Action */}
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={styles.button} 
                  onPress={handleGetStarted} 
                >
                  <Text style={styles.buttonText}>Get Started</Text>
                  <Text style={styles.arrowText}>→</Text>
                </TouchableOpacity>

                {/* Secondary Actions */}
                <View style={styles.linkContainer}>
                  <TouchableOpacity 
                    style={styles.loginLink}
                    onPress={() => router.push('/login')}
                  >
                    <Text style={styles.loginText}>
                      Already have an account? <Text style={styles.boldText}>Sign In</Text>
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.loginLink}
                    onPress={() => router.push('/agentsignup')}
                  >
                    <Text style={styles.loginText}>
                      Want to be Agent? <Text style={styles.boldText}>Apply Here</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#000',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 600,
  },
  backgroundImage: {
    flex: 1, 
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 50 : 20,
  },
  brandName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  bottomWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 30, // Adjust for small screens
  },
  descriptionCard: {
    backgroundColor: '#FFF', 
    padding: 25,
    borderRadius: 35,
    alignItems: 'center',
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50, // Peeks out of the card
    marginBottom: 10,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  logoEmoji: { fontSize: 24 },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#1A1A1A',
    width: '100%',
    height: 60,
    borderRadius: 20,
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  arrowText: {
    color: '#FFF',
    fontSize: 20,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  loginLink: {
    paddingVertical: 8,
  },
  loginText: {
    color: '#888',
    fontSize: 13,
  },
  boldText: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
});