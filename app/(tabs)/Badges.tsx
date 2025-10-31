import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
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
      Tiger: require('../../assets/images/Tiger.png'),
      Panther: require('../../assets/images/Panther.png'),
      Dragon: require('../../assets/images/Dragon.png'),
      Elephant: require('../../assets/images/Elephant.png'),
      Goat: require('../../assets/images/Goat.png'),
      Lion: require('../../assets/images/Lion.png'),
      Bison: require('../../assets/images/Bison.png'),
      Rabbit: require('../../assets/images/Rabbit.png'),
      Phoenix: require('../../assets/images/Phoniex.png'),
      Griffin: require('../../assets/images/Griffen.png'),
      Beast: require('../../assets/images/Beast.png'),
      Fox: require('../../assets/images/Fox.png'),
      Ant: require('../../assets/images/Ant.png'),
      Wolf: require('../../assets/images/Wolf.png'),
      Fish: require('../../assets/images/fish.png'),
      Cat: require('../../assets/images/Cat.png'),
      Rhino: require('../../assets/images/Rhino.png'),
      Frog: require('../../assets/images/Frog.png'),
      Owl: require('../../assets/images/owl.png'),
      Squirrel: require('../../assets/images/Squirrel.png'),
      Horse: require('../../assets/images/Horse.png'),
      Dog: require('../../assets/images/Dog.png'),
      Shark: require('../../assets/images/Shark.png'),
      Falcon: require('../../assets/images/Falcon.png'),
      Bettle: require('../../assets/images/Bettle.png'),
      Bear: require('../../assets/images/Bear.png'),
      Crown: require('../../assets/images/Crown.png'),
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
    streak?: number;
  };

  // State for badge data
  const [badgeData, setBadgeData] = React.useState<BadgeData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showInfo, setShowInfo] = React.useState(false);

  const fetchBadgeData = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('https://backend-hbwp.onrender.com/Badges/', {
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchBadgeData()])
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
    fetchBadgeData();
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
        isCurrent: true,
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
          active: false,
          isCurrent: false,
        });
      });
    }
    
    return tiers;
  }, [badgeData]);

  const InfoModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>How to Earn Badges</Text>
        
        <View style={styles.infoItem}>
          <View style={styles.infoIcon}>
            <FontAwesome5 name="fire" size={20} color="#00ff9d" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoHeading}>Maintain Your Streak</Text>
            <Text style={styles.infoDescription}>
              Complete your daily fitness goals to build your streak and unlock new animal badges
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIcon}>
            <FontAwesome5 name="award" size={20} color="#00ff9d" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoHeading}>Special Achievements</Text>
            <Text style={styles.infoDescription}>
              Earn special badges by reaching milestones like 7-day and 30-day streaks
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIcon}>
            <FontAwesome5 name="chart-line" size={20} color="#00ff9d" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoHeading}>Progress Tracking</Text>
            <Text style={styles.infoDescription}>
              Track your progress toward the next badge in the level hierarchy
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.modalButton}
          onPress={() => setShowInfo(false)}
        >
          <Text style={styles.modalButtonText}>Got It!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {showInfo && <InfoModal />}
      
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
          <View style={styles.headerTop}>
            <Text style={styles.title}>Your Badges</Text>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => setShowInfo(true)}
            >
              <FontAwesome5 name="info-circle" size={20} color="#00ff9d" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Earn badges by maintaining your workout streak
          </Text>
        </View>

        {/* Current Streak Info */}
        {badgeData?.streak && (
          <View style={styles.streakCard}>
            <View style={styles.streakInfo}>
              <FontAwesome5 name="fire" size={24} color="#00ff9d" />
              <View style={styles.streakText}>
                <Text style={styles.streakLabel}>Current Streak</Text>
                <Text style={styles.streakCount}>{badgeData.streak} days</Text>
              </View>
            </View>
            <Text style={styles.streakTip}>
              Keep going! Complete today's workout to continue your streak
            </Text>
          </View>
        )}

        {/* Level Progress */}
        {badgeData && (
          <LinearGradient
            colors={['#121212', '#1a1a1a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelCard}
          >
            <Text style={styles.levelCardTitle}>Current Level</Text>
            
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

            {/* Level Hierarchy */}
            <Text style={styles.hierarchyTitle}>Your Journey</Text>
            <View style={styles.levelHierarchy}>
              {levelTiers.map((tier, index) => (
                <View key={index} style={[
                  styles.levelTier, 
                  tier.active && styles.activeTier,
                ]}>
                  <View style={[
                    styles.tierIconContainer,
                    tier.isCurrent && styles.currentTierIcon
                  ]}>
                    {tier.icon}
                  </View>
                  <Text style={[
                    styles.tierName,
                    tier.isCurrent && styles.currentTierName
                  ]}>
                    {tier.name}
                  </Text>
                  {tier.isCurrent && (
                    <View style={styles.currentIndicator}>
                      <Text style={styles.currentIndicatorText}>Current</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </LinearGradient>
        )}

        {/* Special Badges Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Special Achievements</Text>
          <Text style={styles.sectionSubtitle}>
            Milestone badges for consistent effort
          </Text>
        </View>
        
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
              <View style={styles.badgeIconContainer}>
                <Text style={{ fontSize: 30, opacity: badge.earned ? 1 : 0.4 }}>
                  {badge.emoji}
                </Text>
                {!badge.earned && (
                  <MaterialIcons
                    name="lock"
                    size={16}
                    color="#777"
                    style={styles.lockIcon}
                  />
                )}
              </View>
              
              <Text style={[
                styles.badgeName,
                !badge.earned && styles.lockedBadgeName
              ]}>
                {badge.name}
              </Text>
              
              {badge.earned ? (
                <Text style={styles.badgeDescription}>{badge.description}</Text>
              ) : (
                <Text style={styles.badgeInstruction}>{badge.instruction}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
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
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  infoButton: {
    padding: 8,
  },
  streakCard: {
    backgroundColor: 'rgba(0, 255, 157, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.2)',
    marginBottom: 20,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  streakText: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  streakCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00ff9d',
  },
  streakTip: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  levelCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
  },
  levelCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  levelProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
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
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff9d',
    borderRadius: 4,
  },
  hierarchyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  levelHierarchy: {
    gap: 12,
  },
  levelTier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  activeTier: {
    backgroundColor: 'rgba(0, 255, 157, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.2)',
  },
  tierIconContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  currentTierIcon: {
    opacity: 1,
  },
  tierName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  currentTierName: {
    color: 'white',
    fontWeight: '600',
  },
  currentIndicator: {
    backgroundColor: '#00ff9d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 44,
  },
  badgeCard: {
    width: (width - 64) / 2, // 2 columns for better visibility
    aspectRatio: 1,
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
  badgeIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  lockIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 2,
  },
  badgeName: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 6,
    color: 'white',
  },
  lockedBadgeName: {
    color: '#777',
  },
  badgeDescription: {
    fontSize: 11,
    textAlign: 'center',
    color: '#aaa',
    lineHeight: 14,
  },
  badgeInstruction: {
    fontSize: 11,
    textAlign: 'center',
    color: '#00ff9d',
    fontWeight: '500',
    lineHeight: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoText: {
    flex: 1,
  },
  infoHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 18,
  },
  modalButton: {
    backgroundColor: '#00ff9d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  refreshIndicator: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
});

export default FitStreakBadges;