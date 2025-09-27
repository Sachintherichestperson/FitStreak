import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const tabItems = [
  { id: 'all', label: 'All Challenges' },
  { id: 'Gym', label: 'Gym Workouts' },
  { id: 'FitStreak', label: 'FitStreak Challenges' },
  { id: 'Popular', label: 'Popular' },
  { id: 'New', label: 'New' },
];

export default function ChallengesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [scaleValue] = useState(new Animated.Value(1));
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  

  const fetchBackendData = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.29.104:3000/Challenges/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      
      const data = await response.json();
      const challengedata = data.challenges.map(challenge => ({
        id: challenge._id,
        title: challenge.Title,
        type: challenge.By || 'general',
        days: challenge.Duration,
        description: challenge.Description,
        active: challenge.Status || false,
        // User-specific data
        isParticipating: challenge.isParticipating,
        progress: challenge.progress || 0,
        isCompleted: challenge.isCompleted,
        completionStatus: challenge.completionStatus,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        // Calculate participants count (you might want to add this to your backend)
        participants: challenge.participants || 0,
      }));

      setChallenges(challengedata);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const filteredChallenges = challenges.filter((challenge) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'Gym') return challenge.type === 'Gym';
    if (activeTab === 'FitStreak') return challenge.type === 'FitStreak';
    if (activeTab === 'Popular') return challenge.participants > 10;
    if (activeTab === 'New') return true; // Add your new challenge logic
    return true;
  });

  const activeChallenges = filteredChallenges.filter(challenge => challenge.isParticipating && !challenge.isCompleted);
  const recommendedChallenges = filteredChallenges.filter(challenge => !challenge.isParticipating && !challenge.isCompleted && challenge.type === 'FitStreak');
  const GymChallenges = filteredChallenges.filter(challenge => challenge.type === 'Gym');
  const completedChallenges = filteredChallenges.filter(challenge => challenge.isCompleted);

  const renderChallengeCard = ({ item }) => {
    let gradientColors = [];
    let badgeStyle = {};
    let progressBarStyle = {};
    let badgeText = '';
    let badgeTextStyle = {};
    
    switch (item.type) {
      case 'Gym':
        gradientColors = ['rgba(0, 245, 255, 0.03)', 'rgba(10, 20, 30, 0.8)'];
        badgeStyle = styles.badgeGym;
        progressBarStyle = styles.progressBlue;
        badgeText = 'Gym';
        badgeTextStyle = styles.badgeTextBlue;
        break;
      case 'FitStreak':
        gradientColors = ['rgba(0, 255, 157, 0.03)', 'rgba(10, 30, 20, 0.8)'];
        badgeStyle = styles.badgeShort;
        progressBarStyle = styles.progressGreen;
        badgeText = 'FitStreak';
        badgeTextStyle = styles.badgeTextGreen;
        break;
      default:
        gradientColors = ['rgba(0, 245, 255, 0.03)', 'rgba(10, 20, 30, 0.8)'];
        badgeStyle = styles.badgeGym;
        progressBarStyle = styles.progressBlue;
        badgeText = 'General';
        badgeTextStyle = styles.badgeTextBlue;
    }
    
    const progressPercentage = item.progress
    const startDate = item.startDate;
    const endDate = item.endDate ? new Date(item.endDate).toLocaleDateString() : null;
    
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push({ pathname: "/Challenge-detail", params: { id: item.id } })}
        style={[styles.challengeCard, { width: width * 0.9 / 2 }]}
      >
        <LinearGradient
          colors={gradientColors}
          start={[0, 0]}
          end={[1, 1]}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.cardDecoration1} />
        <View style={styles.cardDecoration2} />
        
        <Text style={styles.challengeTitle}>{item.title}</Text>
        
        <View style={[styles.challengeBadge, badgeStyle]}>
          <Text style={[styles.badgeText, badgeTextStyle]}>{badgeText}</Text>
        </View>
        
        <View style={styles.challengeMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={14} color="#777" />
            <Text style={styles.metaText}>{item.days} days</Text>
          </View>
        </View>
        
        {item.isParticipating && !item.isCompleted && (
          <>
            <View style={styles.challengeProgress}>
              <View style={[styles.progressBar, progressBarStyle, { width: `${progressPercentage}%` }]} />
            </View>
            
            <View style={styles.challengeStats}>
              {item.isParticipating && startDate && (
                <View style={styles.metaItem}>
                <Text style={styles.metaText}>
                  Started: {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>

              )}
              <Text style={styles.statsText}>{Math.round(progressPercentage)}%</Text>
            </View>
          </>
        )}
        
        {item.isCompleted && (
          <View style={styles.challengeStats}>
            <Text style={[styles.statsText, { color: item.completionStatus === 'Won' ? '#00ff9d' : '#ff7b25' }]}>
              {item.completionStatus === 'Won' ? 'Completed ✓' : 'Challenge Lost'}
            </Text>
            {endDate && (
              <Text style={styles.statsText}>Ended: {endDate}</Text>
            )}
          </View>
        )}
        
        {!item.isParticipating && !item.isCompleted && (
          <View style={styles.challengeStats}>
            <Text style={styles.statsText}>
              Starts: {new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <Text style={styles.statsText}>{item.participants} joined</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSection = (title, data, showViewAll = true) => {
    if (data.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {showViewAll && (
            <TouchableOpacity style={styles.viewAll}>
              <Text style={styles.viewAllText}>View All</Text>
              <FontAwesome name="chevron-right" size={12} color="#00f5ff" />
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          data={data}
          renderItem={renderChallengeCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.challengesList}
          snapToInterval={width * 0.9 / 2 + 15}
          decelerationRate="fast"
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading challenges...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={styles.scrollView}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.pageTitle}>
            <Text style={styles.pageTitleText}>Challenges</Text>
            <Text style={styles.pageSubtitle}>Push your limits with community</Text>
          </View>
          <TouchableOpacity style={styles.userAvatar} onPress={() => router.push('/Profile')}>
            <FontAwesome name="user" size={20} color="#f0f0f0" />
          </TouchableOpacity>
        </View>
        
        {/* Challenge Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.challengeTabs}
        >
          {tabItems.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                activeTab === tab.id && styles.tabItemActive
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Sections */}
        {renderSection('Your Active Challenges', activeChallenges)}
        {renderSection('Recommended For You', recommendedChallenges)}
        {renderSection('Gym Challenges', GymChallenges)}
        {renderSection('Completed Challenges', completedChallenges, false)}
        
        {/* Spacer for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    color: '#fff',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 20,
    marginTop: 30,
    paddingHorizontal: 15,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  pageTitle: {},
  pageTitleText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 5,
    color: '#f0f0f0',
  },
  pageSubtitle: {
    color: '#777',
    fontSize: 14,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  challengeTabs: {
    paddingBottom: 10,
    marginBottom: 25,
  },
  tabItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  tabItemActive: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderColor: '#00f5ff',
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#777',
  },
  tabTextActive: {
    color: '#00f5ff',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f0f0f0',
    position: 'relative',
    paddingLeft: 15,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  viewAllText: {
    fontSize: 14,
    color: '#00f5ff',
  },
  challengesList: {
    paddingBottom: 25,
  },
  challengeCard: {
    height: 220,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    overflow: 'hidden',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
  },
  cardDecoration1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00f5ff',
    opacity: 0.1,
    zIndex: -1,
  },
  cardDecoration2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 50,
    backgroundColor: '#00ff9d',
    opacity: 0.1,
    zIndex: -1,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    color: '#f0f0f0',
  },
  challengeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  badgeGym: {
    backgroundColor: 'rgba(0, 245, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  badgeShort: {
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.3)',
  },
  badgeLong: {
    backgroundColor: 'rgba(255, 123, 37, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 37, 0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextBlue: {
    color: '#00f5ff',
  },
  badgeTextGreen: {
    color: '#00ff9d',
  },
  badgeTextOrange: {
    color: '#ff7b25',
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 1,
    marginBottom: 20,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#777',
  },
  challengeProgress: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressBlue: {
    backgroundColor: '#00f5ff',
  },
  progressGreen: {
    backgroundColor: '#00ff9d',
  },
  progressOrange: {
    backgroundColor: '#ff7b25',
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 13,
    color: '#777',
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#121212',
  },
  moreParticipants: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#121212',
  },
  moreParticipantsText: {
    fontSize: 10,
    color: '#f0f0f0',
  },
  avatarText: {
    fontSize: 11,
    color: '#f0f0f0',
    fontWeight: 'bold',
  },
});