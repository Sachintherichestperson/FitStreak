import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    Unicode: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prevForm) => ({
      ...prevForm,
      [field]: value,
    }));
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setForm({ username: '', email: '', password: '', Unicode: '' });
  };

  const validateForm = () => {
    if (isLogin) {
      if (!form.email || !form.password) {
        Alert.alert('Error', 'Please fill in all fields');
        return false;
      }
    } else {
      if (!form.username || !form.email || !form.password) {
        Alert.alert('Error', 'Please fill in all fields');
        return false;
      }
      
      if (form.password.length < 6) {
        Alert.alert('Error', 'Password should be at least 6 characters');
        return false;
      }
    }
    return true;
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.225.177:3000/Login', {
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
        router.replace('/(tabs)'); // Navigate to the main app screen
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
      const response = await fetch('http://192.168.225.177:3000/Register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: form.username,
          email: form.email, 
          password: form.password,
          Unicode: form.Unicode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('Token', data.token);
        router.replace('/(tabs)'); // Navigate to the main app screen
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
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

      {!isLogin && (
        <TextInput
          placeholder="Username"
          style={styles.input}
          value={form.username}
          onChangeText={(text) => handleChange('username', text)}
          autoCapitalize="none"
          editable={!loading}
        />
      )}

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={form.email}
        onChangeText={(text) => handleChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={form.password}
        onChangeText={(text) => handleChange('password', text)}
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
          placeholder="Unicode"
          style={styles.input}
          value={form.Unicode}
          onChangeText={(text) => handleChange('Unicode', text)}
          autoCapitalize="none"
          editable={!loading}
        />

      <TouchableOpacity 
        style={[styles.button, loading && styles.disabledButton]} 
        onPress={handleAuth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Processing...' : isLogin ? 'Log In' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleMode} disabled={loading}>
        <Text style={styles.toggleText}>
          {isLogin
            ? "Don't have an account? Register"
            : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#212121ff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#fff',
  },
  input: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#3f3f3fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#99C2FF',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toggleText: {
    color: '#007BFF',
    marginTop: 10,
    fontSize: 14,
  },
});