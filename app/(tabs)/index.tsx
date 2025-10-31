import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Set notification handler outside component
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,  
  }),
});

const { width } = Dimensions.get('window');

// Interfaces remain the same
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

interface LeaderboardUser {
  rank: number;
  name: string;
  streak: number;
  badge: string;
  emoji: string;
  points: number;
}

interface TodayPlan {
  workout: {
    title: string;
    exerciseCount: number;
    totalTime: number;
    targetTime: string;
  } | null;
  diet: {
    description: string;
    calories: number;
    protein: number;
    targetTime: string;
  } | null;
}

// Cache for API responses
const API_CACHE = {
  userData: null,
  challenges: null,
  leaderboard: null,
  todayPlan: null,
  lastUpdated: 0,
  CACHE_DURATION: 30000, // 30 seconds cache
};

const FitPulseApp = () => {
  const router = useRouter();
  const pulseAnim = new Animated.Value(1);
  const { refreshChallenges } = useLocalSearchParams();
  
  // User Data States
  const [User, setUser] = useState<{ username?: string } | null>(null);
  const [streak, setStreak] = useState('0');
  const [challenges, setChallenges] = useState([]);
  const [loggedDates, setLoggedDays] = useState<string[]>([]);
  const [Status, setStatus] = useState<string | null>(null);
  const [FitCoins, SetFitCoins] = useState(0);
  
  // Location Scanner States
  const [userLocation, setUserLocation] = useState<GymLocation | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GymLocation | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [dailyCheckinStatus, setDailyCheckinStatus] = useState<DailyCheckinStatus | null>(null);
  
  // Today's Plan States
  const [todayPlan, setTodayPlan] = useState<TodayPlan>({ workout: null, diet: null });
  
  // Leaderboard States
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardUser | null>(null);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Start animation only when component mounts
  useEffect(() => {
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
  }, []);

  // Optimized API calls with caching
  const fetchWithCache = async (url: string, key: string) => {
    const now = Date.now();
    if (API_CACHE[key] && (now - API_CACHE.lastUpdated) < API_CACHE.CACHE_DURATION) {
      return API_CACHE[key];
    }

    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      API_CACHE[key] = data;
      API_CACHE.lastUpdated = now;
      return data;
    } catch (error) {
      // Return cached data even if stale when network fails
      return API_CACHE[key] || null;
    }
  };

  // Optimized location permission check
  const checkLocationPermissions = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') return true;
      
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      return newStatus === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }, []);

  // Optimized distance calculation
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Optimized location scanner
  const scanCurrentLocation = useCallback(async () => {
    try {
      setIsScanning(true);
      
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
        accuracy: Location.Accuracy.Balanced, // Reduced accuracy for speed
        timeout: 5000, // Reduced timeout
      });

      const newLocation: GymLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      };

      setCurrentLocation(newLocation);

      if (!userLocation) {
        await saveGymLocation(newLocation);
      } else {
        await verifyLocationMatch(newLocation);
      }

    } catch (error) {
      console.error('Error scanning location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    } finally {
      setIsScanning(false);
    }
  }, [userLocation, dailyCheckinStatus]);

  const saveGymLocation = async (location: GymLocation) => {
    try {
      const token = await AsyncStorage.getItem('Token');
      
      const requestBody = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp || new Date().toISOString()
      };

      const response = await fetch('https://backend-hbwp.onrender.com/Home/save-gym-location', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (response.ok) {
        setUserLocation(location);
        Alert.alert(
          'Success! 🎉', 
          'Your gym location has been set! Now scan again to check in and start your streak.'
        );
        await loadUserData();
      } else {
        throw new Error(responseData.message || 'Failed to save location');
      }
    } catch (error) {
      console.error('Error saving gym location:', error);
      Alert.alert('Error', error.message || 'Failed to save gym location. Please try again.');
    }
  };

  const verifyLocationMatch = async (scannedLocation: GymLocation) => {
    if (!userLocation) return;

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      scannedLocation.latitude,
      scannedLocation.longitude
    );

    if (distance <= 100) {
      await sendLocationVerification();
    } else {
      Alert.alert('Not at Gym', 'You are not at your registered gym location.');
    }
  };

  const sendLocationVerification = async (): Promise<{success: boolean; message?: string}> => {
    try {
      const token = await AsyncStorage.getItem('Token');

      const response = await fetch('https://backend-hbwp.onrender.com/Home/verify-gym-location', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verified: true,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        Alert.alert('Success! 🎉', 'Workout logged successfully! Streak updated.');
        await loadUserData();
        await checkDailyCheckinStatus();
        return { success: true, message: result.message };
      } else {
        Alert.alert('Already Checked In', result.message || 'You have already checked in for today! ✅');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error sending verification:', error);
      return { success: false, message: 'Error verifying location' };
    }
  };

  const checkDailyCheckinStatus = async () => {
    try {
      const data = await fetchWithCache(
        'https://backend-hbwp.onrender.com/Home/check-daily-checkin',
        'checkinStatus'
      );
      if (data) {
        setDailyCheckinStatus(data);
      }
    } catch (error) {
      console.error('Error checking daily checkin status:', error);
    }
  };

  // Optimized data loading
  const loadUserData = async () => {
    try {
      const [userData, challengesData, locationData] = await Promise.allSettled([
        fetchWithCache('https://backend-hbwp.onrender.com/Home/', 'userData'),
        fetchWithCache('https://backend-hbwp.onrender.com/Home/Active-Challenges', 'challenges'),
        fetchWithCache('https://backend-hbwp.onrender.com/Home/Gym-Location', 'location')
      ]);

      if (userData.status === 'fulfilled' && userData.value) {
        const data = userData.value;
        setUser(data.user);
        setStreak(data.streak || '0');
        setLoggedDays(data.loggedDates || []);
        setStatus(data.Status?.name || "The Ant");
        SetFitCoins(data.FitCoins);
      }

      if (challengesData.status === 'fulfilled' && challengesData.value) {
        setChallenges(challengesData.value.challenges || []);
      }

      if (locationData.status === 'fulfilled' && locationData.value) {
        setUserLocation(locationData.value);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchTodayPlan = async () => {
    try {
      const data = await fetchWithCache(
        'https://backend-hbwp.onrender.com/Home/plan',
        'todayPlan'
      );
      if (data?.success) {
        setTodayPlan({
          workout: data.workout,
          diet: data.diet
        });
      }
    } catch (error) {
      console.error('Error fetching today\'s plan:', error);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      setLeaderboardLoading(true);
      const data = await fetchWithCache(
        'https://backend-hbwp.onrender.com/Community/Leaderboard',
        'leaderboard'
      );
      
      if (data) {
        setLeaderboardData(data.leaderboard || []);
        setCurrentUserRank(data.currentUserRank || null);
        
        setTopPerformers((data.leaderboard || []).slice(0, 5).map((user: any, index: number) => ({
          id: `l${index + 1}`,
          name: user.name,
          streak: user.streak,
          badge: getBadgeEmoji(index + 1),
        })));
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const getBadgeEmoji = (rank: number) => {
    switch(rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      case 4: return '🌟';
      case 5: return '⭐';
      default: return '🏅';
    }
  };

  // Optimized push notifications - load in background
  const registerForPushNotificationsAsync = useCallback(async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    } catch (error) {
      console.error('Error in push notifications:', error);
    }
  }, []);

  // Optimized refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Clear cache on refresh
    Object.keys(API_CACHE).forEach(key => {
      if (key !== 'CACHE_DURATION') API_CACHE[key] = null;
    });
    API_CACHE.lastUpdated = 0;

    Promise.all([
      loadUserData(), 
      checkDailyCheckinStatus(), 
      fetchTodayPlan(),
      fetchLeaderboardData()
    ])
      .then(() => setRefreshing(false))
      .catch(() => setRefreshing(false));
  }, []);

  // Optimized useEffect for initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load critical data first
      await Promise.all([
        loadUserData(),
        checkDailyCheckinStatus()
      ]);
      
      setIsLoading(false);
      
      // Load non-critical data in background
      Promise.all([
        fetchTodayPlan(),
        fetchLeaderboardData(),
        registerForPushNotificationsAsync()
      ]).catch(console.error);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (refreshChallenges) {
      loadUserData();
      checkDailyCheckinStatus();
    }
  }, [refreshChallenges]);

  // Memoized render functions
  const renderChallenge = useCallback(({ item }: any) => (
    <TouchableOpacity 
      style={styles.challengeCard}
      onPress={() => router.push({ pathname: "/Proof_Page", params: { challengeId: item.id } })}
    >
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.challengeDaysContainer}>
          <FontAwesome5 name="calendar-alt" size={12} color="#777" />
          <Text style={styles.challengeDaysText}>{item.startDate}</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>Progress</Text>
          <Text style={styles.progressPercentage}>{item.progress}%</Text>
        </View>
        
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={['#00f5ff', '#00ff9d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${item.progress}%` }]}
          />
        </View>
        
        <View style={styles.progressMarkers}>
          <Text style={styles.markerText}>0%</Text>
          <Text style={styles.markerText}>100%</Text>
        </View>
      </View>
    </TouchableOpacity>
  ), []);

  const renderTopPerformer = useCallback(({ item }: { item: any }) => (
    <View style={styles.leaderCard}>
      <View style={styles.leaderAvatar}>
        <Text style={styles.badgeEmoji}>{item.badge}</Text>
      </View>
      <Text style={styles.leaderName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.leaderStats}>🔥 {item.streak} Days</Text>
      <Text style={styles.leaderBadge}>{item.badge}</Text>
    </View>
  ), []);

  const renderLeaderboardRow = useCallback(({ item }: { item: LeaderboardUser }) => (
    <View style={styles.tableRow}>
      <Text style={[
        styles.cellRank, 
        item.rank === 1 && styles.goldRank, 
        item.rank === 2 && styles.silverRank, 
        item.rank === 3 && styles.bronzeRank
      ]}>
        {item.rank}
      </Text>
      <View style={styles.cellUser}>
        <View style={styles.userAvatar}>
          <Text style={styles.badgeEmojiSmall}>{item.emoji}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.userBadge}>{item.badge}</Text>
        </View>
      </View>
      <Text style={styles.cellStreak}>🔥 {item.streak}d</Text>
      <Text style={styles.cellPoints}>{item.points.toLocaleString()}</Text>
    </View>
  ), []);

  // Optimized Scanner Section
  const ScannerSection = useCallback(() => (
    <View style={styles.scannerSection}>
      <View style={styles.scannerHeader}>
        <FontAwesome5 name="dumbbell" size={20} color="#00ff9d" />
        <Text style={styles.scannerTitle}>Log Today's Workout</Text>
      </View>
      
      <View style={styles.scannerContent}>
        <Text style={styles.scannerDescription}>
          {!userLocation 
            ? "Set your gym location to start tracking workouts and building streaks"
            : dailyCheckinStatus?.alreadyCheckedIn 
              ? "You've already logged your workout today! 🎉"
              : "Scan your location at the gym to log today's workout"
          }
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.scanButton,
            (isScanning || dailyCheckinStatus?.alreadyCheckedIn) && styles.buttonDisabled
          ]}
          onPress={scanCurrentLocation}
          disabled={isScanning || dailyCheckinStatus?.alreadyCheckedIn}
        >
          {isScanning ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <FontAwesome5 
                name={!userLocation ? "map-marker-alt" : "check-circle"} 
                size={20} 
                color="#ffffff" 
              />
              <Text style={styles.scanButtonText}>
                {!userLocation 
                  ? "Set Gym Location" 
                  : dailyCheckinStatus?.alreadyCheckedIn 
                    ? "Workout Logged Today" 
                    : "Log Workout"
                }
              </Text>
            </>
          )}
        </TouchableOpacity>

        {!userLocation && (
          <Text style={styles.scannerNote}>
            💡 Go to your gym first, then tap to set location
          </Text>
        )}
      </View>
    </View>
  ), [userLocation, dailyCheckinStatus, isScanning]);

  // Optimized Leaderboard Section
  const LeaderboardSection = useCallback(() => {
    if (leaderboardLoading) {
      return (
        <View style={styles.MajorCalendar}>
          <Text style={styles.sectionTitle}>Leaderboard 🏆</Text>
          <ActivityIndicator size="small" color="#00ff9d" style={styles.loadingIndicator} />
        </View>
      );
    }

    return (
      <View style={styles.MajorCalendar}>
        <View style={styles.calendarHeader}>
          <Text style={styles.sectionTitle}>Leaderboard 🏆</Text>
          <TouchableOpacity onPress={() => router.push('/Community')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subSectionTitle}>Top Performers</Text>
        <FlatList
          data={topPerformers}
          renderItem={renderTopPerformer}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leadersContainer}
        />
        
        <View style={styles.leaderboardTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerRank}>Rank</Text>
            <Text style={styles.headerUser}>User</Text>
            <Text style={styles.headerStreak}>Streak</Text>
            <Text style={styles.headerPoints}>Points</Text>
          </View>
          
          {currentUserRank && currentUserRank.rank > 10 && (
            <View style={[styles.tableRow, styles.currentUserRow]}>
              <Text style={[styles.cellRank, styles.currentUserRank]}>{currentUserRank.rank}</Text>
              <View style={styles.cellUser}>
                <View style={styles.userAvatar}>
                  <Text style={styles.badgeEmojiSmall}>{currentUserRank.emoji}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, styles.currentUserName]} numberOfLines={1}>
                    {currentUserRank.name} (You)
                  </Text>
                  <Text style={styles.userBadge}>{currentUserRank.badge}</Text>
                </View>
              </View>
              <Text style={styles.cellStreak}>🔥 {currentUserRank.streak}d</Text>
              <Text style={styles.cellPoints}>{currentUserRank.points.toLocaleString()}</Text>
            </View>
          )}
          
          <FlatList
            data={leaderboardData.slice(0, 10)}
            renderItem={renderLeaderboardRow}
            keyExtractor={item => `lb${item.rank}`}
            scrollEnabled={false}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
          />
        </View>
      </View>
    );
  }, [leaderboardLoading, topPerformers, currentUserRank, leaderboardData]);

  // Optimized loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#121212']}
          style={StyleSheet.absoluteFill}
        />
        
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Simplified skeleton loading */}
          <View style={styles.header}>
            <View>
              <View style={[styles.skeletonText, { width: 150, height: 24, marginBottom: 5 }]} />
              <View style={[styles.skeletonText, { width: 180, height: 14 }]} />
            </View>
            <View style={[styles.avatar, styles.skeletonAvatar]} />
          </View>

          <View style={[styles.scannerSection, styles.skeletonCard]}>
            <View style={[styles.skeletonText, { width: '60%', height: 20, marginBottom: 10 }]} />
            <View style={[styles.skeletonText, { width: '100%', height: 14, marginBottom: 15 }]} />
            <View style={[styles.skeletonText, { width: '100%', height: 50, borderRadius: 12 }]} />
          </View>

          <View style={styles.statsContainer}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.statItem}>
                <View style={[styles.skeletonText, { width: 40, height: 20, marginBottom: 5 }]} />
                <View style={[styles.skeletonText, { width: 50, height: 12 }]} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#121212']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00ff9d']}
            tintColor="#00ff9d"
            progressBackgroundColor="#121212"
          />
        }
        removeClippedSubviews={true}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {User?.username ?? 'User'}!</Text>
            <Text style={styles.subGreeting}>Ready for today's workout?</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/Profile')}>
            <FontAwesome name="user" size={20} color="#f0f0f0" />
          </TouchableOpacity>
        </View>

        <ScannerSection />

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{FitCoins}</Text>
            <Text style={styles.statLabel}>FitCoins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Status}</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today's Plan</Text>
        <View style={styles.todayPlanContainer}>
          <TouchableOpacity 
            style={styles.planCard}
            onPress={() => router.push('/Workout')}
          >
            <View style={styles.planHeader}>
              <FontAwesome5 name="dumbbell" size={20} color="#00f5ff" />
              <Text style={styles.planTitle}>Workout</Text>
            </View>
            <Text style={styles.planDescription}>
              {todayPlan.workout ? todayPlan.workout.title : "No workout scheduled"}
            </Text>
            <Text style={styles.planDetail}>
              {todayPlan.workout 
                ? `${todayPlan.workout.exerciseCount} exercises • ${todayPlan.workout.totalTime} mins`
                : "Add your workout plan"
              }
            </Text>
            <Text style={styles.planTime}>
              {todayPlan.workout ? todayPlan.workout.targetTime : "Schedule workout"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.planCard}
            onPress={() => router.push('/Diet')}
          >
            <View style={styles.planHeader}>
              <FontAwesome5 name="utensils" size={18} color="#00ff9d" />
              <Text style={styles.planTitle}>Diet</Text>
            </View>
            <Text style={styles.planDescription}>
              {todayPlan.diet ? todayPlan.diet.description : "No diet plan"}
            </Text>
            <Text style={styles.planDetail}>
              {todayPlan.diet 
                ? `${todayPlan.diet.calories} calories • ${todayPlan.diet.protein}g protein`
                : "Set up your diet plan"
              }
            </Text>
            <Text style={styles.planTime}>
              {todayPlan.diet ? todayPlan.diet.targetTime : "Plan your meals"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Active Challenges</Text>
        <FlatList
          data={challenges}
          renderItem={renderChallenge}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.challengesContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No active challenges</Text>
          }
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={3}
        />

        <LeaderboardSection />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContainer: {
    padding: 20,
    marginTop: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 5,
  },
  subGreeting: {
    fontSize: 14,
    color: '#777',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ... (keep all your existing styles exactly as they were)
  scannerSection: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  scannerContent: {
    gap: 15,
  },
  scannerDescription: {
    fontSize: 14,
    color: '#f0f0f0',
    lineHeight: 20,
  },
  scanButton: {
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
  buttonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerNote: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00ff9d',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
  },
  todayPlanContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    minHeight: 140,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  planDescription: {
    fontSize: 14,
    color: '#f0f0f0',
    marginBottom: 5,
  },
  planDetail: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
  },
  planTime: {
    fontSize: 12,
    color: '#00f5ff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  challengesContainer: {
    gap: 15,
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  challengeCard: {
    width: 150,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  challengeHeader: {
    marginBottom: 15,
  },
  challengeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  challengeDaysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  challengeDaysText: {
    fontSize: 12,
    color: '#777',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#777',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00f5ff',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    marginBottom: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  markerText: {
    fontSize: 10,
    color: '#777',
  },
  MajorCalendar: {
    backgroundColor: '#121212',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#00f5ff',
    fontSize: 14,
    fontWeight: '600',
  },
  leadersContainer: {
    gap: 12,
    paddingVertical: 5,
    paddingBottom: 15,
    paddingHorizontal: 5,
  },
  leaderCard: {
    width: 140,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginRight: 10,
  },
  leaderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#00ff9d',
  },
  badgeEmoji: {
    fontSize: 20,
  },
  badgeEmojiSmall: {
    fontSize: 16,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  leaderStats: {
    fontSize: 13,
    color: '#00ff9d',
  },
  leaderBadge: {
    fontSize: 16,
    position: 'absolute',
    right: 15,
    top: 15,
  },
  leaderboardTable: {
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: 20,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'rgba(0, 255, 157, 0.05)',
  },
  headerRank: {
    width: 50,
    color: '#00ff9d',
    fontWeight: '600',
    fontSize: 12,
  },
  headerUser: {
    flex: 2,
    color: '#00ff9d',
    fontWeight: '600',
    fontSize: 12,
  },
  headerStreak: {
    flex: 1,
    textAlign: 'right',
    color: '#00ff9d',
    fontWeight: '600',
    fontSize: 12,
  },
  headerPoints: {
    flex: 1,
    textAlign: 'right',
    color: '#00ff9d',
    fontWeight: '600',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  currentUserRow: {
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#00ff9d',
  },
  cellRank: {
    width: 50,
    fontWeight: '700',
    color: '#fff',
    fontSize: 14,
  },
  currentUserRank: {
    fontWeight: '800',
    color: '#00ff9d',
  },
  goldRank: {
    color: 'gold',
  },
  silverRank: {
    color: 'silver',
  },
  bronzeRank: {
    color: '#cd7f32',
  },
  cellUser: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'column',
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    fontSize: 14,
    color: 'white',
  },
  currentUserName: {
    fontWeight: '700',
    color: '#00ff9d',
  },
  userBadge: {
    fontSize: 11,
    color: '#00ff9d',
    marginTop: 2,
  },
  cellStreak: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    color: '#00ff9d',
    fontWeight: '500',
  },
  cellPoints: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  loadingIndicator: {
    marginVertical: 30,
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
    width: 150,
    textAlign: 'center',
  },
  skeletonCard: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  skeletonText: {
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
  },
  skeletonAvatar: {
    backgroundColor: '#1a1a1a',
  },
});

export default FitPulseApp;