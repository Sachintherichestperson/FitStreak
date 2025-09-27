import { FontAwesome, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    Image,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

const FitStreakBadges = () => {
  // Animation values
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = React.useState(false);

  const badgeImages: { [key: string]: any } = {
      Tiger : require('../../assets/images/Tiger.png'),
      Panther : require('../../assets/images/Panther.png'),
      Dragon : require('../../assets/images/Dragon.png'),
      Elephant : require('../../assets/images/Elephant.png'),
      Goat : require('../../assets/images/Goat.png'),
      Lion : require('../../assets/images/Lion.png'),
      Bison : require('../../assets/images/Bison.png'),
      Rabbit : require('../../assets/images/Rabbit.png'),
      Phoenix : require('../../assets/images/Phoniex.png'),
      Griffin : require('../../assets/images/Griffen.png'),
      Beast : require('../../assets/images/Beast.png'),
      Fox : require('../../assets/images/Fox.png'),
      Ant : require('../../assets/images/Ant.png'),
      Wolf : require('../../assets/images/Wolf.png'),
      Fish : require('../../assets/images/fish.png'),
      Cat : require('../../assets/images/Cat.png'),
      Rhino : require('../../assets/images/Rhino.png'),
      Frog : require('../../assets/images/Frog.png'),
      Owl : require('../../assets/images/owl.png'),
      Squirrel : require('../../assets/images/Squirrel.png'),
      Horse : require('../../assets/images/Horse.png'),
      Dog : require('../../assets/images/Dog.png'),
      Shark : require('../../assets/images/Shark.png'),
      Falcon : require('../../assets/images/Falcon.png'),
      Bettle : require('../../assets/images/Bettle.png'),
      Bear : require('../../assets/images/Bear.png'),
      Crown : require('../../assets/images/Crown.png'),
  }

  // Types for badge data
  type Badge = {
    icon: string;
    name: string;
    emoji?: string;
    description?: string;
    instruction?: string;
    earned: boolean;
    isImage: boolean;
  };

  type BadgeData = {
    currentBadge: Badge;
    nextBadge?: Badge;
    nextBadges?: Badge[];
    specialBadges?: Badge[];
    progress: number;
  };

  // State for badge data
  const [badgeData, setBadgeData] = React.useState<BadgeData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [buddyData, setBuddyData] = React.useState<any>(null);
  const [hasBuddy, setHasBuddy] = React.useState(false);
  const [duoRankings, setDuoRankings] = React.useState<any[]>([]);

  const fetchBadgeData = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.29.104:3000/Badges/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to fetch badge data');
      }

      const processedData = {
        ...data,
        specialBadges: data.specialBadges.map((badge: any) => {
          // Check which badges should be earned based on current streak
          let earned = badge.earned;
          
          // For Daily Beast (7-day streak)
          if (badge.name === "Daily Beast" && data.streak >= 7) {
            earned = true;
          }
          
          // For Streak Hero (30-day streak)
          if (badge.name === "Streak Hero" && data.streak >= 30) {
            earned = true;
          }
          
          // Add more conditions for other badges as needed
          
          return {
            ...badge,
            earned
          };
        })
      };
      
      setBadgeData(processedData);
      
      // Start progress animation with actual progress value
      Animated.timing(progressAnim, {
        toValue: data.progress / 100,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuddyData = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.29.104:3000/Badges/Accountability-Buddy', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to fetch buddy data');
      }
      
      // Check if user has a buddy
      if (data.Buddy && data.Buddy.Buddy && data.Buddy.Buddy.BuddyId) {
        setBuddyData(data.Buddy);
        setHasBuddy(true);
      } else {
        setHasBuddy(false);
      }
      
    } catch (err) {
      setError(err.message);
      setHasBuddy(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDuoRankings = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.29.104:3000/Badges/Duo-Ranking', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to fetch duo rankings');
      }
      
      if (data.success && data.data) {
        // Process the data to calculate average streak
        const processedRankings = data.data.map((duo: any, index: number) => {
          const avgStreak = Math.round((duo.streak1 + duo.streak2) / 2);
          return {
            rank: index + 1,
            names: `${duo.username1} & ${duo.username2}`,
            streak: avgStreak,
            avatars: ['👦', '👦'], // Default avatars, you can customize based on user data
            isYou: false // You'll need to determine if this is the current user
          };
        });
        
        setDuoRankings(processedRankings);
      }
      
    } catch (err) {
      console.error('Error fetching duo rankings:', err);
      // Fallback to mock data if API fails
      setDuoRankings([
        { rank: 1, names: 'Priya & Rohan', streak: 42, avatars: ['👩', '👨'] },
        { rank: 2, names: 'Arjun & Vikram', streak: 38, avatars: ['👨', '👴'] },
        { rank: 3, names: 'You & Aman', streak: 34, avatars: ['👦', '👦'], isYou: true },
        { rank: 4, names: 'Neha & Ananya', streak: 28, avatars: ['👩', '👩'] },
      ]);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchBadgeData(), fetchBuddyData(), fetchDuoRankings()])
      .then(() => setRefreshing(false))
      .catch(() => setRefreshing(false));
  }, []);

  const translateY = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [50, 0],
    extrapolate: 'clamp',
  });

  const opacity = scrollY.interpolate({
    inputRange: [-100, -50, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  React.useEffect(() => {
    fetchBuddyData();
    fetchBadgeData();
    fetchDuoRankings();
  }, []);

  // Start pulse animation
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Create level tiers from badge data
  const levelTiers = React.useMemo(() => {
    if (!badgeData) return [];
    
    const tiers = [];
    
    // Add current badge
    if (badgeData.currentBadge) {
      const isImage = badgeData.currentBadge.isImage;

      tiers.push({
        icon: isImage ? (
          <Image
            source={badgeImages[badgeData.currentBadge.icon]}
            style={{
              width: 60,
              height: 60,
              tintColor: badgeData.currentBadge.earned ? "#00ff9d" : "#555",
              resizeMode: 'contain'
            }}
          />
        ) : (
          <FontAwesome5
            name={badgeData.currentBadge.icon}
            size={32}
            color={badgeData.currentBadge.earned ? "#00ff9d" : "#555"}
            solid
          />
        ),
        name: badgeData.currentBadge.name,
        active: true,
      });
    }

    // Add next 5 badges
    if (badgeData.nextBadges && badgeData.nextBadges.length > 0) {
      badgeData.nextBadges.slice(0, 5).forEach((badge) => {
        const isImage = badge.isImage;

        tiers.push({
          icon: isImage ? (
            <Image
              source={badgeImages[badge.icon]}
              style={{
                width: 60,
                height: 60,
                tintColor: badge.earned ? "#00ff9d" : "#555"
              }}
            />
          ) : (
            <FontAwesome5
              name={badge.icon}
              size={32}
              color={badge.earned ? "#00ff9d" : "#555"}
              solid
            />
          ),
          name: badge.name,
          active: false
        });
      });
    }
    
    return tiers;
  }, [badgeData]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00ff9d" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Error loading badges: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          fetchBadgeData();
          fetchBuddyData();
          fetchDuoRankings();
        }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.refreshIndicator, { transform: [{ translateY }], opacity }]}>
        <ActivityIndicator size="small" color="#00ff9d" />
      </Animated.View>
      
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00ff9d"
            colors={['#00ff9d']}
            progressBackgroundColor="#121212"
          />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } }}],
          { useNativeDriver: true }
        )}
        overScrollMode="always"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Badges</Text>
        </View>

        {/* Level Progress */}
        {badgeData && (
          <LinearGradient
            colors={['#121212', '#1a1a1a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelCard}
          >
            <View style={styles.levelProgress}>
              <Animated.View style={[styles.levelIcon, { transform: [{ scale: pulseAnim }] }]}>
                {badgeData.currentBadge.isImage ? (
                  <Image
                    source={badgeImages[badgeData.currentBadge.icon]}
                    style={{
                      width: 62,
                      height: 62,
                      tintColor: "#00ff9d",
                      resizeMode: 'contain',
                    }}
                  />
                ) : (
                  <FontAwesome5
                    name={badgeData.currentBadge.icon}
                    size={32}
                    color="#00ff9d"
                    solid
                  />
                )}
              </Animated.View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelName}>{badgeData.currentBadge?.name || 'Loading...'}</Text>
                {badgeData.nextBadge && (
                  <>
                    <Text style={styles.levelStatus}>{badgeData.progress}% to {badgeData.nextBadge.name}</Text>
                    <View style={styles.progressBar}>
                      <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                    </View>
                  </>
                )}
              </View>
            </View>
             {levelTiers.length > 0 && (
                <View style={styles.levelHierarchy}>
                  {levelTiers.map((tier, index) => (
                    <View key={index} style={[
                      styles.levelTier, 
                      tier.active && styles.activeTier,
                      tier.isCurrent && styles.currentTier
                    ]}>
                      {tier.icon}
                      <Text style={[
                        styles.tierName,
                        tier.isCurrent && styles.currentTierName
                      ]}>{tier.name}</Text>
                    </View>
                  ))}
              </View>
            )}
          </LinearGradient>
        )}

        {/* Your Badges Section */}
        <Text style={styles.sectionTitle}>Your Badges</Text>
        <View style={styles.badgesGrid}>
          {badgeData?.specialBadges?.map((badge, index) => (
            <TouchableOpacity
              key={`badge-${index}`}
              style={[
                styles.badgeCard,
                badge.earned ? styles.earnedBadge : styles.lockedBadge
              ]}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 30, opacity: badge.earned ? 1 : 0.6 }}>
                {badge.emoji}
              </Text>
              <Text style={styles.badgeName}>{badge.name}</Text>
              
              {badge.earned ? (
                <Text style={styles.badgeDescription}>{badge.description}</Text>
              ) : (
                <Text style={styles.badgeInstruction}>🔓 {badge.instruction}</Text>
              )}
              
              {!badge.earned && (
                <MaterialIcons
                  name="lock"
                  size={20}
                  color="#777"
                  style={styles.lockIcon}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Buddy Stats - Only show if user has a buddy */}
        {hasBuddy && buddyData && (
          <LinearGradient
            colors={['#121212', '#1a1a1a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buddyCard}
          >
            <View style={styles.buddyHeader}>
              <Text style={styles.buddyTitle}>Accountability Buddy</Text>
              <View style={styles.streakCount}>
                <FontAwesome name="fire" size={16} color="#00ff9d" />
                <Text style={styles.streakText}>{buddyData.Buddy?.BuddyId?.Streak?.Scan || 0}-day streak</Text>
              </View>
            </View>
            <View style={styles.buddyInfo}>
              <View style={styles.buddyAvatar}>
                <FontAwesome name="user" size={24} color="#00ff9d" />
              </View>
              <View>
                <Text style={styles.buddyName}>
                  {buddyData.Buddy?.BuddyId?.username}
                </Text>
                <Text style={styles.buddyStatus}>
                  Your gym partner since {new Date(buddyData.Buddy?.Date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <View style={styles.comparisonBars}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>You</Text>
                <View style={styles.comparisonBarContainer}>
                  <View 
                    style={[
                      styles.comparisonBar, 
                      styles.youBar,
                      { width: `${Math.min(100, buddyData.Streak?.Scan || 0)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.comparisonValue}>{buddyData.Streak?.Scan || 0}%</Text>
              </View>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>{buddyData.Buddy?.BuddyId?.username || 'Buddy'}</Text>
                <View style={styles.comparisonBarContainer}>
                  <View 
                    style={[
                      styles.comparisonBar, 
                      styles.buddyBar,
                      { width: `${Math.min(100, buddyData.Buddy?.BuddyId?.Streak?.Scan || 0)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.comparisonValue}>{buddyData.Buddy?.BuddyId.Streak?.Scan || 0}%</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        <Text style={styles.sectionTitle}>Duo Rankings</Text>
        <LinearGradient
          colors={['#121212', '#1a1a1a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.duoCard}
        >
          {duoRankings.map((duo, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.duoItem, duo.isYou && styles.youDuoItem]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.duoRank,
                  duo.rank === 1 && styles.goldRank,
                  duo.rank === 2 && styles.silverRank,
                  duo.rank === 3 && styles.bronzeRank,
                ]}
              >
                {duo.rank}
              </Text>
              <View style={styles.duoAvatars}>
                <View style={styles.duoAvatar}>
                  <Text style={{ fontSize: 16 }}>{duo.avatars[0]}</Text>
                </View>
                <View style={[styles.duoAvatar, styles.secondAvatar]}>
                  <Text style={{ fontSize: 16 }}>{duo.avatars[1]}</Text>
                </View>
              </View>
              <View style={styles.duoInfo}>
                <Text style={styles.duoNames}>{duo.names}</Text>
                <View style={styles.duoStreak}>
                  <FontAwesome name="fire" size={14} color="#00ff9d" />
                  <Text style={styles.duoStreakText}>{duo.streak} Day Avg Streak</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </LinearGradient>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContainer: {
    padding: 16,
    marginTop: 20,
    paddingTop: 20,
    paddingBottom: 80,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#00ff9d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0a0a0a',
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    backgroundImage: 'linear-gradient(90deg, #00ff9d, #00f5ff)',
  },
  levelCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  levelProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 15,
  },
  levelIcon: {
    width: 75,
    height: 75,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 157, 0.08)',
    borderWidth: 2,
    borderColor: '#00ff9d',
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 5,
  },
  levelStatus: {
    fontSize: 14,
    color: '#777',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff9d',
    borderRadius: 4,
  },
  levelHierarchy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  levelTier: {
    alignItems: 'center',
    gap: 5,
    opacity: 0.5,
  },
  activeTier: {
    opacity: 1,
  },
  tierIcon: {
    fontSize: 20,
  },
  tierName: {
    fontSize: 12,
    color: '#777',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
    marginTop: 8,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 44,
  },
  badgeCard: {
    width: (width - 64) / 3, // 3 columns with padding
    aspectRatio: 1,
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  earnedBadge: {
    borderColor: '#00ff9d',
    shadowColor: '#00ff9d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  lockedBadge: {
    opacity: 0.7,
    borderColor: '#333',
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 8,
    color: 'white',
  },
  lockedText: {
    color: '#777',
  },
  badgeDescription: {
    fontSize: 10,
    textAlign: 'center',
    color: '#aaa',
    marginTop: 5,
  },
  lockedDescription: {
    color: '#555',
  },
  lockIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  goldBadge: {
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
  },
  silverBadge: {
    borderColor: '#c0c0c0',
    shadowColor: '#c0c0c0',
  },
  bronzeBadge: {
    borderColor: '#cd7f32',
    shadowColor: '#cd7f32',
  },
  badgeInstruction: {
    fontSize: 10,
    textAlign: 'center',
    color: '#00ff9d', // Green color for instructions
    marginTop: 5,
    fontWeight: '600',
  },
  buddyCard: {
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
  },
  buddyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  buddyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  streakCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streakText: {
    fontSize: 14,
    color: '#00ff9d',
  },
  buddyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 15,
  },
  buddyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00ff9d',
  },
  buddyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    color: 'white',
  },
  buddyStatus: {
    fontSize: 14,
    color: '#777',
  },
  comparisonBars: {
    gap: 12,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  comparisonLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
    color: '#EEE',
  },
  comparisonBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  comparisonBar: {
    height: '100%',
    borderRadius: 6,
  },
  youBar: {
    backgroundColor: '#00ff9d',
  },
  buddyBar: {
    backgroundColor: '#00f5ff',
  },
  comparisonValue: {
    width: 45,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    color: 'white',
  },
  duoCard: {
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  duoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 12,
  },
  youDuoItem: {
    borderWidth: 1,
    borderColor: '#00ff9d',
    backgroundColor: 'rgba(0, 255, 157, 0.08)',
  },
  duoRank: {
    fontSize: 14,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
    color: 'white',
  },
  goldRank: {
    color: '#ffd700',
  },
  silverRank: {
    color: '#c0c0c0',
  },
  bronzeRank: {
    color: '#cd7f32',
  },
  duoAvatars: {
    position: 'relative',
    width: 50,
    height: 50,
  },
  duoAvatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    position: 'absolute',
  },
  secondAvatar: {
    bottom: 0,
    right: 0,
    borderColor: '#00ff9d',
  },
  duoInfo: {
    flex: 1,
  },
  duoNames: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
    color: 'white',
  },
  duoStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  duoStreakText: {
    fontSize: 12,
    color: '#00ff9d',
  },
});

export default FitStreakBadges;