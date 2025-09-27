import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const Scanner = () => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('back');

  const toggleCameraFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
  if (scanned) return;
  setScanned(true);

  const token = await AsyncStorage.getItem('Token');
  
  try {
    const response = await fetch(`http://192.168.1.70:3000/Home/Scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ qrData: data }),
    });

    const result = await response.json();

    if (result.success) {
      Alert.alert('Scanned QR Code', result.message);
    } else {
      Alert.alert('Scanned QR Code', result.error);
    }

    
  } catch (error) {
    console.error('Error verifying QR code:', error);
  }
};


  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#121212']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.permissionContainer}>
          <Text style={styles.message}>We need your permission to use the camera</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#121212']}
        style={StyleSheet.absoluteFill}
      />

      <CameraView
        style={styles.camera}
        facing={facing}
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.frame} />
          <Text style={styles.scanText}>Align QR code within frame</Text>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity 
            onPress={() => setScanned(false)} 
            style={styles.controlButton}
          >
            <Ionicons name="scan" size={28} color="white" />
            <Text style={styles.controlText}>Scan Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setTorchOn((prev) => !prev)} 
            style={styles.controlButton}
          >
            <Ionicons name={torchOn ? "flashlight" : "flashlight-outline"} size={28} color="white" />
            <Text style={styles.controlText}>Torch</Text>
          </TouchableOpacity>
          
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    color: '#f0f0f0',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#00f5ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  frame: {
    width: width * 0.7,
    height: width * 0.7,
    marginTop: 150,
    borderWidth: 2,
    borderColor: '#00f5ff',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanText: {
    marginTop: 20,
    fontSize: 16,
    color: '#f0f0f0',
    fontWeight: '500',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    padding: 20,
  },
  controlText: {
    fontSize: 12,
    color: '#f0f0f0',
    marginTop: 5,
  },
});

export default Scanner;