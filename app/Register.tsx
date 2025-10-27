import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    Mobile: '',
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleChange = (field, value) => {
    setForm((prevForm) => ({
      ...prevForm,
      [field]: value,
    }));
  };

  const toggleMode = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsLogin((prev) => !prev);
      setForm({ username: '', email: '', password: '', Mobile: '' });
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const validateForm = () => {
    if (isLogin) {
      if (!form.email || !form.password) {
        Alert.alert('Error', 'Please fill in all fields');
        return false;
      }
    } else {
      if (!form.username || !form.email || !form.password || !form.Mobile) {
        Alert.alert('Error', 'Please fill in all fields');
        return false;
      }
      
      if (form.password.length < 6) {
        Alert.alert('Error', 'Password should be at least 6 characters');
        return false;
      }

      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(form.Mobile)) {
        Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
        return false;
      }
    }
    return true;
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://backend-hbwp.onrender.com/Login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: form.email, 
          password: form.password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('Token', data.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://backend-hbwp.onrender.com/Register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: form.username,
          email: form.email, 
          password: form.password,
          Mobile: form.Mobile,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('Token', data.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!validateForm()) return;
    
    if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0a0a0a', '#121212']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <ScrollView 
    style={styles.scrollView}
    contentContainerStyle={styles.scrollViewContent}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
  >
        <View style={styles.header}>
          <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Join FitStreak'}</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Sign in to continue your fitness journey' : 'Create your account to get started'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                placeholder="Enter your username"
                placeholderTextColor="#666"
                style={styles.input}
                value={form.username}
                onChangeText={(text) => handleChange('username', text)}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#666"
              style={styles.input}
              value={form.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mobile</Text>
              <TextInput
                placeholder="Enter your Mobile Number"
                placeholderTextColor="#666"
                style={styles.input}
                value={form.Mobile}
                onChangeText={(text) => handleChange('Mobile', text)}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#666"
              style={styles.input}
              secureTextEntry
              value={form.password}
              onChangeText={(text) => handleChange('password', text)}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.disabledButton]} 
            onPress={handleAuth}
            disabled={loading}
          >
            <LinearGradient
              colors={['#00f5ff', '#00ff9d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.toggleButton} 
            onPress={toggleMode} 
            disabled={loading}
          >
            <Text style={styles.toggleText}>
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
              <Text style={styles.toggleHighlight}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms and Privacy Policy
          </Text>
        </View>
      </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    width: '100%',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 15,
    fontSize: 14,
    fontWeight: '500',
  },
  toggleButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleText: {
    color: '#777',
    fontSize: 15,
    textAlign: 'center',
  },
  toggleHighlight: {
    color: '#00f5ff',
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});