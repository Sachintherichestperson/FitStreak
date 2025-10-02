import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface GymLocation {
    latitude: number;
    longitude: number;
    timestamp?: string;
}

interface DailyCheckinStatus {
    alreadyCheckedIn: boolean;
    lastCheckinDate?: string;
    message?: string;
}

const LocationScanner = () => {
    const router = useRouter();
    const pulseAnim = new Animated.Value(1);
    const [userLocation, setUserLocation] = useState<GymLocation | null>(null);
    const [currentLocation, setCurrentLocation] = useState<GymLocation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [streak, setStreak] = useState('0');
    const [User, setUser] = useState<{ username?: string } | null>(null);
    const [dailyCheckinStatus, setDailyCheckinStatus] = useState<DailyCheckinStatus | null>(null);

    Animated.loop(
        Animated.sequence([
            Animated.timing(pulseAnim, {
                toValue: 1.05,
                duration: 1000,
                useNativeDriver: true
            }),
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true
            })
        ])
    ).start();

    useEffect(() => {
        loadUserData();
        checkLocationPermissions();
        checkDailyCheckinStatus();
    }, []);

    const loadUserData = async () => {
        try {
            const token = await AsyncStorage.getItem('Token');
            const [userResponse, locationResponse] = await Promise.all([
                fetch('http://192.168.29.104:3000/Home/', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }),
                fetch('http://192.168.29.104:3000/Home/Gym-Location', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })
            ]);

            const userData = await userResponse.json();
            const locationData = await locationResponse.json();

            setUser(userData.user);
            setStreak(userData.streak || '0');
            setUserLocation(locationData || null);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const checkDailyCheckinStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('Token');
            const response = await fetch('http://192.168.29.104:3000/Home/check-daily-checkin', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const statusData = await response.json();
                setDailyCheckinStatus(statusData);
            }
        } catch (error) {
            console.error('Error checking daily checkin status:', error);
        }
    };

    const checkLocationPermissions = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to scan your gym location.');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking location permissions:', error);
            return false;
        }
    };

    const scanCurrentLocation = async () => {
        try {
            setIsScanning(true);
            
            // Check if user has already checked in today
            if (dailyCheckinStatus?.alreadyCheckedIn) {
                Alert.alert(
                    'Already Checked In', 
                    dailyCheckinStatus.message || 'You have already checked in for today! ✅'
                );
                return;
            }

            const hasPermission = await checkLocationPermissions();
            if (!hasPermission) return;

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeout: 10000,
            });

            const newLocation: GymLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: new Date().toISOString(),
            };

            setCurrentLocation(newLocation);

            // If user has no stored location, save this as their gym location
            if (!userLocation) {
                await saveGymLocation(newLocation);
            }

        } catch (error) {
            console.error('Error scanning location:', error);
            Alert.alert('Error', 'Failed to get your current location. Please try again.');
        } finally {
            setIsScanning(false);
        }
    };

    const saveGymLocation = async (location: GymLocation) => {
        try {
            const token = await AsyncStorage.getItem('Token');
            
            const requestBody = {
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: location.timestamp || new Date().toISOString()
            };

            console.log('Sending location data:', requestBody);

            const response = await fetch('http://192.168.29.104:3000/Home/save-gym-location', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const responseData = await response.json();
            console.log('Save location response:', responseData);

            if (response.ok) {
                setUserLocation(location);
                Alert.alert(
                    'Success! 🎉', 
                    'Your gym location has been set successfully! Now you can start building your streak by checking in daily.'
                );
                // Reload user data to reflect the changes
                await loadUserData();
            } else {
                throw new Error(responseData.message || 'Failed to save location');
            }
        } catch (error) {
            console.error('Error saving gym location:', error);
            Alert.alert('Error', error.message || 'Failed to save gym location. Please try again.');
        }
    };

    const verifyLocationMatch = async () => {
        if (!userLocation || !currentLocation) return;

        // Check if user has already checked in today
        if (dailyCheckinStatus?.alreadyCheckedIn) {
            Alert.alert(
                'Already Checked In', 
                dailyCheckinStatus.message || 'You have already checked in for today! ✅'
            );
            return;
        }

        const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            currentLocation.latitude,
            currentLocation.longitude
        );

        if (distance <= 100) {
            const verificationResult = await sendLocationVerification();
            if (verificationResult.success) {
                Alert.alert('Success', 'Location Matched Successfully! 🎉');
                // Update daily checkin status after successful verification
                await checkDailyCheckinStatus();
            } else {
                Alert.alert('Already Checked In', verificationResult.message || 'You have already checked in for today! ✅');
            }
        } else {
            Alert.alert('Not Matched', 'You are not at your registered gym location.');
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const sendLocationVerification = async (): Promise<{success: boolean; message?: string}> => {
        try {
            const token = await AsyncStorage.getItem('Token');

            const now = new Date();
            const istOffset = 5.5 * 60; // 5 hours 30 minutes in minutes
            const istTime = new Date(now.getTime() + istOffset * 60 * 1000);

            const response = await fetch('http://192.168.29.104:3000/Home/verify-gym-location', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    verified: true,
                    timestamp: istTime.toISOString(),
                }),
            });

            const result = await response.json();
            
            if (response.ok) {
                // Reload user data to get updated streak
                await loadUserData();
                return { success: true, message: result.message };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Error sending verification:', error);
            return { success: false, message: 'Error verifying location' };
        }
    };

    const formatLocation = (location: GymLocation | null) => {
  if (!location || 
      typeof location !== 'object' || 
      typeof location.latitude === 'undefined' || 
      typeof location.longitude === 'undefined' ||
      location.latitude === null || 
      location.longitude === null) {
    return 'Not set';
  }
  return `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`;
};

    const formatLastCheckinDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#0a0a0a', '#121212']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00ff9d" />
                    <Text style={styles.loadingText}>Loading location data...</Text>
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
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#f0f0f0" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gym Location</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.avatar}>
                        <FontAwesome name="user" size={20} color="#f0f0f0" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>
                {/* Streak Info */}
                <View style={styles.streakContainer}>
                    <View style={styles.streakHeader}>
                        <View style={styles.streakInfo}>
                            <Text style={styles.streakCount}>{streak}</Text>
                            <Text style={styles.streakLabel}>Day Streak</Text>
                        </View>
                        <View style={[
                            styles.streakBadge,
                            dailyCheckinStatus?.alreadyCheckedIn ? styles.checkedInBadge : styles.activeBadge
                        ]}>
                            <FontAwesome 
                                name={dailyCheckinStatus?.alreadyCheckedIn ? "check-circle" : "fire"} 
                                size={16} 
                                color={dailyCheckinStatus?.alreadyCheckedIn ? "#00f5ff" : "#00ff9d"} 
                            />
                            <Text style={[
                                styles.streakBadgeText,
                                dailyCheckinStatus?.alreadyCheckedIn ? styles.checkedInText : styles.activeText
                            ]}>
                                {dailyCheckinStatus?.alreadyCheckedIn ? 'Checked In' : 'Active'}
                            </Text>
                        </View>
                    </View>
                    
                    {dailyCheckinStatus?.alreadyCheckedIn ? (
                        <View style={styles.checkedInContainer}>
                            <Text style={styles.checkedInMessage}>
                                ✅ {dailyCheckinStatus.message || 'You have already checked in today!'}
                            </Text>
                            <Text style={styles.lastCheckinText}>
                                Last check-in: {formatLastCheckinDate(dailyCheckinStatus.lastCheckinDate)}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.streakMotivation}>
                            {!userLocation 
                                ? 'Setup your gym location to start building your streak!' 
                                : 'Maintain your streak by verifying your gym location!'
                            }
                        </Text>
                    )}
                </View>

                {/* Location Status */}
                <View style={styles.locationCard}>
                    <View style={styles.locationHeader}>
                        <FontAwesome5 name="map-marker-alt" size={24} color="#00f5ff" />
                        <Text style={styles.locationTitle}>
                            {userLocation ? 'Your Gym Location' : 'Setup Your Gym Location'}
                        </Text>
                    </View>
                    
                    <View style={styles.locationDetails}>
                        <Text style={styles.locationLabel}>Registered Location:</Text>
                        <Text style={styles.locationValue}>
                            {formatLocation(userLocation)}
                        </Text>
                        
                        {currentLocation && (
                            <>
                                <Text style={styles.locationLabel}>Current Scan:</Text>
                                <Text style={styles.locationValue}>
                                    {formatLocation(currentLocation)}
                                </Text>
                            </>
                        )}
                    </View>

                    {/* Special message for first-time setup */}
                    {!userLocation && (
                        <View style={styles.setupMessage}>
                            <FontAwesome5 name="info-circle" size={16} color="#00f5ff" />
                            <Text style={styles.setupMessageText}>
                                You need to set your gym location first. Go to your gym and scan your location to set it up.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {!userLocation ? (
                        // First time setup - Show setup options prominently
                        <View style={styles.setupContainer}>
                            <Text style={styles.setupTitle}>Let's Get Started! 🏋️</Text>
                            <Text style={styles.setupDescription}>
                                To start tracking your gym visits and building streaks, we need to set your gym location first.
                            </Text>
                            
                            <TouchableOpacity 
                                style={[
                                    styles.primaryButton, 
                                    (isScanning || dailyCheckinStatus?.alreadyCheckedIn) && styles.buttonDisabled
                                ]}
                                onPress={scanCurrentLocation}
                                disabled={isScanning || dailyCheckinStatus?.alreadyCheckedIn}
                            >
                                {isScanning ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <>
                                        <FontAwesome5 name="map-marker-alt" size={20} color="#ffffff" />
                                        <Text style={styles.buttonText}>
                                            {dailyCheckinStatus?.alreadyCheckedIn ? 'Already Checked In' : 'Set My Gym Location'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.setupNote}>
                                💡 Make sure you're at your gym when setting the location
                            </Text>
                        </View>
                    ) : (
                        // Regular user flow
                        <>
                            <TouchableOpacity 
                                style={[
                                    styles.scanButton, 
                                    (isScanning || dailyCheckinStatus?.alreadyCheckedIn) && styles.buttonDisabled
                                ]}
                                onPress={scanCurrentLocation}
                                disabled={isScanning || dailyCheckinStatus?.alreadyCheckedIn}
                            >
                                {isScanning ? (
                                    <ActivityIndicator color="#00ff9d" />
                                ) : (
                                    <>
                                        <FontAwesome5 name="crosshairs" size={20} color="#00ff9d" />
                                        <Text style={styles.scanButtonText}>
                                            {dailyCheckinStatus?.alreadyCheckedIn ? 'Already Checked In' : 'Scan Current Location'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            
                            {currentLocation && !dailyCheckinStatus?.alreadyCheckedIn && (
                                <TouchableOpacity 
                                    style={styles.verifyButton}
                                    onPress={verifyLocationMatch}
                                >
                                    <FontAwesome5 name="check-circle" size={20} color="#ffffff" />
                                    <Text style={styles.buttonText}>Verify Location Match</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>

                {/* Instructions - Different instructions based on setup status */}
                <View style={styles.instructionsCard}>
                    <Text style={styles.instructionsTitle}>
                        {!userLocation ? 'How to setup:' : 'How it works:'}
                    </Text>
                    
                    {!userLocation ? (
                        // Setup instructions
                        <>
                            <View style={styles.instructionItem}>
                                <FontAwesome5 name="1" size={16} color="#00f5ff" />
                                <Text style={styles.instructionText}>
                                    Go to your regular gym location
                                </Text>
                            </View>
                            <View style={styles.instructionItem}>
                                <FontAwesome5 name="2" size={16} color="#00f5ff" />
                                <Text style={styles.instructionText}>
                                    Tap "Set My Gym Location" button
                                </Text>
                            </View>
                            <View style={styles.instructionItem}>
                                <FontAwesome5 name="3" size={16} color="#00f5ff" />
                                <Text style={styles.instructionText}>
                                    Allow location permissions when prompted
                                </Text>
                            </View>
                            <View style={styles.instructionItem}>
                                <FontAwesome5 name="4" size={16} color="#00f5ff" />
                                <Text style={styles.instructionText}>
                                    Your gym location will be saved automatically
                                </Text>
                            </View>
                        </>
                    ) : (
                        // Regular instructions
                        <>
                            <View style={styles.instructionItem}>
                                <FontAwesome5 name="1" size={16} color="#00f5ff" />
                                <Text style={styles.instructionText}>
                                    Scan your location when you're at the gym
                                </Text>
                            </View>
                            <View style={styles.instructionItem}>
                                <FontAwesome5 name="2" size={16} color="#00f5ff" />
                                <Text style={styles.instructionText}>
                                    Verify the location matches your registered gym
                                </Text>
                            </View>
                            <View style={styles.instructionItem}>
                                <FontAwesome5 name="3" size={16} color="#00f5ff" />
                                <Text style={styles.instructionText}>
                                    Build your streak with daily check-ins
                                </Text>
                            </View>
                            <View style={styles.instructionItem}>
                                <FontAwesome5 name="4" size={16} color="#00f5ff" />
                                <Text style={styles.instructionText}>
                                    You can only check in once per day
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </View>

            {/* Floating Action Button */}
            <Animated.View style={[styles.homeButton, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity onPress={() => router.push('/')}>
                    <Ionicons name="home" size={24} color="white" />
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#777',
        fontSize: 16,
        marginTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        marginBottom: 10,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffff',
    },
    headerIcons: {
        flexDirection: 'row',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
    },
    streakContainer: {
        backgroundColor: '#121212',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 20,
    },
    streakHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    streakInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    streakCount: {
        fontSize: 28,
        fontWeight: '700',
        color: '#00ff9d',
    },
    streakLabel: {
        fontSize: 16,
        color: '#777',
    },
    streakBadge: {
        borderRadius: 12,
        paddingVertical: 5,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    activeBadge: {
        backgroundColor: 'rgba(0,255,157,0.08)',
        borderWidth: 1,
        borderColor: '#00ff9d',
    },
    checkedInBadge: {
        backgroundColor: 'rgba(0,245,255,0.08)',
        borderWidth: 1,
        borderColor: '#00f5ff',
    },
    streakBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    activeText: {
        color: '#00ff9d',
    },
    checkedInText: {
        color: '#00f5ff',
    },
    checkedInContainer: {
        marginTop: 10,
    },
    checkedInMessage: {
        fontSize: 14,
        color: '#00f5ff',
        textAlign: 'center',
        marginBottom: 5,
    },
    lastCheckinText: {
        fontSize: 12,
        color: '#777',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    streakMotivation: {
        fontSize: 14,
        color: '#f0f0f0',
        textAlign: 'center',
        marginTop: 10,
    },
    locationCard: {
        backgroundColor: '#121212',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 20,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
    },
    locationTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    locationDetails: {
        gap: 8,
    },
    locationLabel: {
        fontSize: 14,
        color: '#777',
        fontWeight: '500',
    },
    locationValue: {
        fontSize: 12,
        color: '#f0f0f0',
        fontFamily: 'monospace',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 8,
        borderRadius: 8,
        marginBottom: 10,
    },
    setupMessage: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: 'rgba(0, 245, 255, 0.08)',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#00f5ff',
        marginTop: 10,
    },
    setupMessageText: {
        fontSize: 12,
        color: '#00f5ff',
        flex: 1,
        lineHeight: 16,
    },
    actionsContainer: {
        gap: 15,
        marginBottom: 20,
    },
    setupContainer: {
        backgroundColor: 'rgba(255, 123, 37, 0.08)',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 123, 37, 0.2)',
    },
    setupTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ff7b25',
        textAlign: 'center',
        marginBottom: 8,
    },
    setupDescription: {
        fontSize: 14,
        color: '#f0f0f0',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    setupNote: {
        fontSize: 12,
        color: '#777',
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
    primaryButton: {
        backgroundColor: '#ff7b25',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    scanButton: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 18,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#00ff9d',
    },
    verifyButton: {
        backgroundColor: '#00ff9d',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 18,
        borderRadius: 12,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    scanButtonText: {
        color: '#00ff9d',
        fontSize: 16,
        fontWeight: '600',
    },
    instructionsCard: {
        backgroundColor: '#121212',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 15,
    },
    instructionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    instructionText: {
        fontSize: 14,
        color: '#f0f0f0',
        flex: 1,
    },
    homeButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#ff7b25',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff7b25',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
        elevation: 10,
        zIndex: 100,
    },
});

export default LocationScanner;