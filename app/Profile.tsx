import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Linking
} from 'react-native';

const { width, height } = Dimensions.get('window');

const FitStreakProfile = () => {
  const badgeImages: { [key: string]: any } = {
    Tiger: require('./../assets/images/Tiger.png'),
    Panther: require('./../assets/images/Panther.png'),
    Dragon: require('./../assets/images/Dragon.png'),
    Elephant: require('./../assets/images/Elephant.png'),
    Goat: require('./../assets/images/Goat.png'),
    Lion: require('./../assets/images/Lion.png'),
    Bison: require('./../assets/images/Bison.png'),
    Rabbit: require('./../assets/images/Rabbit.png'),
    Phoenix: require('./../assets/images/Phoniex.png'),
    Griffin: require('./../assets/images/Griffen.png'),
    Beast: require('./../assets/images/Beast.png'),
    Fox: require('./../assets/images/Fox.png'),
    Ant: require('./../assets/images/Ant.png'),
    Wolf: require('./../assets/images/Wolf.png'),
    Fish: require('./../assets/images/fish.png'),
    Cat: require('./../assets/images/Cat.png'),
    Rhino: require('./../assets/images/Rhino.png'),
    Frog: require('./../assets/images/Frog.png'),
    Owl: require('./../assets/images/owl.png'),
    Squirrel: require('./../assets/images/Squirrel.png'),
    Horse: require('./../assets/images/Horse.png'),
    Dog: require('./../assets/images/Dog.png'),
    Shark: require('./../assets/images/Shark.png'),
    Falcon: require('./../assets/images/Falcon.png'),
    Bettle: require('./../assets/images/Bettle.png'),
    Bear: require('./../assets/images/Bear.png'),
    Crown: require('./../assets/images/Crown.png'),
  };
  
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState('');
  const [PostCount, setPostCount] = useState(0);
  const [level, setLevel] = useState('Beast Level');
  const [currentBadge, setCurrentBadge] = useState('Beast');
  const [streak, setStreak] = useState(0);
  const [fitCoins, setFitCoins] = useState(0);
  const [badges, setBadges] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpTitle, setHelpTitle] = useState('');
  const [helpDescription, setHelpDescription] = useState('');
  const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const BackendData = async () => {
    const token = await AsyncStorage.getItem('Token');
    try {
      const response = await fetch('https://backend-hbwp.onrender.com/Profile/',{
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      setName(data.user.username || '');
      setMobile(data.user.Mobile);
      setUserId(data.user._id || '');
      setLevel(data.Level);
      setCurrentBadge(data.Badge);
      setPostCount(data.user.TotalPost || 0);
      setStreak(data.user.Streak?.Track || 0);
      setBadges(data.user.Badges.length || 0);
      setFitCoins(data.Coins || 0);

    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  useEffect(() => {
    BackendData();
  }, []);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('Token');
      
      const response = await fetch('https://backend-hbwp.onrender.com/Profile/Profile-Edit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: name })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      
      if (data.success) {
        setEditMode(false);
        Alert.alert('Success', 'Profile updated successfully');
        BackendData();
      } else {
        throw new Error(data.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleEditProfile = () => {
    setEditMode(!editMode);
  };

  const UserLoggingOut = () => {
    AsyncStorage.removeItem('Token');
    router.push('/Register');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => UserLoggingOut() },
    ]);
  };

  const handleHelpSubmit = async () => {
  if (!helpTitle.trim() || !helpDescription.trim()) {
    Alert.alert('Error', 'Please fill in both title and description');
    return;
  }

  setIsSubmittingHelp(true);
  try {
    // 1. Send help data to your backend
    const response = await fetch('https://backend-hbwp.onrender.com/Help', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: helpTitle,
        description: helpDescription,
        user: name,
        mobile: mobile,
        date: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send help request to backend');
    }

    Alert.alert(
      'Help Request Sent!',
      `We've received your help request. Our team will contact you shortly.\n\nTitle: ${helpTitle}\nDescription: ${helpDescription}`,
      [{ text: 'OK', onPress: () => setShowHelpModal(false) }]
    );

    // 4. Reset fields
    setHelpTitle('');
    setHelpDescription('');

  } catch (error) {
    console.error(error);
    Alert.alert('Error', error.message || 'Failed to submit help request');
  } finally {
    setIsSubmittingHelp(false);
  }
};


  const openWhatsApp = async () => {
    const phoneNumber = '7023187244';
    const message = 'Hello, I need help with FitStreak app';
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    const supported = await Linking.canOpenURL(whatsappUrl);
    if (supported) {
      await Linking.openURL(whatsappUrl);
    } else {
      Alert.alert('Error', 'WhatsApp is not installed on this device.');
    }
    
    Alert.alert(
      'Contact Support',
      'You can reach our support team directly on WhatsApp at 7023187244',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open WhatsApp', onPress: () => {
          // In a real app: Linking.openURL(whatsappUrl).catch(() => {
          //   Alert.alert('Error', 'WhatsApp is not installed');
          // });
          Alert.alert('WhatsApp', 'This would open WhatsApp in a real app');
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient
          colors={['#121212', '#0A0A0A']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#F5F5F5" />
          </TouchableOpacity>
          
          <View style={styles.profileMain}>
            <View style={styles.avatarContainer}>
              <Image
                source={badgeImages[currentBadge]}
                style={[styles.badgeImage, { tintColor: '#00ff9d' }]}
              />
            </View>
            
            {editMode ? (
              <TextInput
                style={[styles.userName, styles.editInput]}
                value={name}
                onChangeText={setName}
                autoFocus
                placeholder="Enter your name"
                placeholderTextColor="#888"
              />
            ) : (
              <Text style={styles.userName}>{name}</Text>
            )}
            
            <View style={styles.userLevel}>
              <FontAwesome name="trophy" size={14} color="#00ff9d" />
              <Text style={styles.levelText}>{level}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={editMode ? handleSaveProfile : handleEditProfile}
            >
              <FontAwesome
                name={editMode ? 'check' : 'pencil'}
                size={14}
                color="#F5F5F5"
              />
              <Text style={styles.editProfileText}>
                {editMode ? 'Save Profile' : 'Edit Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fitCoins}</Text>
            <Text style={styles.statLabel}>FitCoins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{badges}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{PostCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/Community')}
            >
              <LinearGradient
                colors={['#00ff9d', '#00a8ff']}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="account-group" size={24} color="#F5F5F5" />
                <Text style={styles.actionText}>Community</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => setShowHelpModal(true)}
            >
              <LinearGradient
                colors={['#ff7b25', '#ff5252']}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="help-circle" size={24} color="#F5F5F5" />
                <Text style={styles.actionText}>Get Help</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={openWhatsApp}
            >
              <LinearGradient
                colors={['#25d366', '#128c7e']}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#F5F5F5" />
                <Text style={styles.actionText}>Support</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/')}
            >
              <LinearGradient
                colors={['#00a8ff', '#0097e6']}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="home" size={24} color="#F5F5F5" />
                <Text style={styles.actionText}>Home</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => router.push('/Community')}
            >
              <View style={[styles.settingsIcon, { backgroundColor: 'rgba(0, 255, 157, 0.1)' }]}>
                <MaterialCommunityIcons name="incognito" size={20} color="#00ff9d" />
              </View>
              <Text style={styles.settingsText}>My Community Posts</Text>
              <FontAwesome name="chevron-right" size={12} color="#888" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => setShowHelpModal(true)}
            >
              <View style={[styles.settingsIcon, { backgroundColor: 'rgba(255, 123, 37, 0.1)' }]}>
                <Ionicons name="help-buoy" size={20} color="#ff7b25" />
              </View>
              <Text style={styles.settingsText}>Help & Support</Text>
              <FontAwesome name="chevron-right" size={12} color="#888" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsItem}
              onPress={handleLogout}
            >
              <View style={[styles.settingsIcon, { backgroundColor: 'rgba(255, 82, 82, 0.1)' }]}>
                <FontAwesome name="sign-out" size={18} color="#FF5252" />
              </View>
              <Text style={[styles.settingsText, { color: '#FF5252' }]}>Logout</Text>
              <FontAwesome name="chevron-right" size={12} color="#FF5252" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Get Help & Support</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={24} color="#F5F5F5" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpForm}>
              <Text style={styles.helpDescription}>
                Having issues with the app? Fill out the form below and our support team will get back to you within 24 hours.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Problem Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Brief description of your issue"
                  placeholderTextColor="#888"
                  value={helpTitle}
                  onChangeText={setHelpTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Detailed Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Please describe your issue in detail..."
                  placeholderTextColor="#888"
                  value={helpDescription}
                  onChangeText={setHelpDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Direct Support</Text>
                <TouchableOpacity 
                  style={styles.whatsappButton}
                  onPress={openWhatsApp}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#25d366" />
                  <Text style={styles.whatsappText}>Chat on WhatsApp: 7023187244</Text>
                </TouchableOpacity>
                <Text style={styles.contactNote}>
                  For urgent issues, contact us directly on WhatsApp for faster response.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowHelpModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleHelpSubmit}
                disabled={isSubmittingHelp || !helpTitle.trim() || !helpDescription.trim()}
              >
                {isSubmittingHelp ? (
                  <ActivityIndicator size="small" color="#F5F5F5" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  profileMain: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarContainer: {
    marginBottom: 15,
    position: 'relative',
  },
  badgeImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#00ff9d88',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F5F5F5',
    marginBottom: 5,
  },
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    color: '#F5F5F5',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    width: '80%',
  },
  userLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 15,
  },
  levelText: {
    color: '#00ff9d',
    fontSize: 14,
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#888',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  editProfileText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 25,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00ff9d',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F5F5',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 64) / 2,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  actionText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  settingsList: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    color: '#F5F5F5',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5F5F5',
  },
  helpForm: {
    padding: 20,
  },
  helpDescription: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 15,
    color: '#F5F5F5',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  contactInfo: {
    backgroundColor: 'rgba(0, 255, 157, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#00ff9d',
  },
  contactTitle: {
    color: '#00ff9d',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    borderRadius: 8,
    marginBottom: 10,
  },
  whatsappText: {
    color: '#25d366',
    fontSize: 14,
    fontWeight: '500',
  },
  contactNote: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitButton: {
    backgroundColor: '#00ff9d',
  },
  cancelButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FitStreakProfile;