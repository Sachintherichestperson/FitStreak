import { AntDesign, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import * as Progress from 'react-native-progress';

const { width } = Dimensions.get('window');

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  type RewardKeys = 'Winner' | 'Top3' | 'Top5' | 'Top10' | 'All';
  type ChallengeType = {
    Title: string;
    Description: string;
    Duration: number;
    By: string;
    Challenge_Type: string;
    Participants: { UserId: string }[];
    Rewards?: Partial<Record<RewardKeys, string>>;
  };
  
  const [challenge, setChallenge] = useState<ChallengeType | null>(null);
  console.log(challenge);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [userId, setUserId] = useState(null);
  const [startDatep, setStartDate] = useState(null);
  const [endDatep, setEndDate] = useState(null);
  const [progress, setProgress] = useState(0);


  useEffect(() => {
    const fetchChallengeData = async () => {
      try {
        const token = await AsyncStorage.getItem('Token');
        
        const response = await fetch(`https://backend-hbwp.onrender.com/Challenges/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setChallenge(data.challenge);
        const user = data.userId;
        setUserId(user);
        setStartDate(data.startDate);
        setEndDate(data.endDate);

        // Check if current user is a participant
        const userIsParticipant = data.challenge.Participants.some(
          p => p.UserId === user
        );
        setIsJoined(userIsParticipant);
        setProgress(data.progress); 
      } catch (err) {
        console.error('Failed to fetch challenge:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeData();
  }, [id]);

  const handleJoinChallenge = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const user = userId;
      const response = await fetch(`https://backend-hbwp.onrender.com/Challenges/${id}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user }),
      });

      if (!response.ok) {
        throw new Error('Failed to join challenge');
      }

      setIsJoined(true);
      setJoinModalVisible(false);
      
      // Refresh challenge data to update participants count
      const updatedResponse = await fetch(`https://backend-hbwp.onrender.com/Challenges/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setChallenge(updatedData.challenge);
      }

      router.push({
        pathname: '/',
        params: { refreshChallenges: Date.now() }
      });
      
    } catch (err) {
      console.error('Error joining challenge:', err);
      Alert.alert('Error', 'Failed to join challenge');
    }
  };

  const handleLeaveChallenge = () => {
  Alert.alert(
    "Leave Challenge",
    "Are you sure you want to leave this challenge?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Yes, Leave",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('Token');
            const response = await fetch(`https://backend-hbwp.onrender.com/Challenges/${id}/leave`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error('Failed to leave challenge');
            }

            setIsJoined(false);
            setJoinModalVisible(false);

            // Refresh challenge data
            const updatedResponse = await fetch(`https://backend-hbwp.onrender.com/Challenges/${id}`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (updatedResponse.ok) {
              const updatedData = await updatedResponse.json();
              setChallenge(updatedData.challenge);
            }
          } catch (err) {
            console.error('Error leaving challenge:', err);
            Alert.alert('Error', 'Failed to leave challenge');
          }
        },
        style: 'destructive',
      },
    ]
  );
};


  const getBadgeStyles = () => {
    if (!challenge) return {};
    
    switch (challenge.By) {
      case 'Gym':
        return {
          gradientColors: ['rgba(0, 245, 255, 0.1)', 'rgba(10, 20, 30, 0.9)'],
          badgeStyle: styles.badgeGym,
          progressColor: '#00f5ff',
          badgeText: 'Gym Challenge',
          badgeTextColor: '#00f5ff'
        };
      case 'FitStreak':
        return {
          gradientColors: ['rgba(0, 255, 157, 0.1)', 'rgba(10, 30, 20, 0.9)'],
          badgeStyle: styles.badgeFitStreak,
          progressColor: '#00ff9d',
          badgeText: 'FitStreak Challenge',
          badgeTextColor: '#00ff9d'
        };
      default:
        return {
          gradientColors: ['rgba(0, 245, 255, 0.1)', 'rgba(10, 20, 30, 0.9)'],
          badgeStyle: styles.badgeGym,
          progressColor: '#00f5ff',
          badgeText: 'Challenge',
          badgeTextColor: '#00f5ff'
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00f5ff" />
          <Text style={styles.loadingText}>Loading challenge details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading challenge</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Back to Challenges</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Challenge not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Back to Challenges</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badgeStyles = getBadgeStyles();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={styles.scrollView}>
        {/* Challenge Header */}
        <LinearGradient
          colors={badgeStyles.gradientColors}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.challengeHeader}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={[styles.challengeBadge, badgeStyles.badgeStyle]}>
            <Text style={[styles.badgeText, { color: badgeStyles.badgeTextColor }]}>
              {badgeStyles.badgeText}
            </Text>
          </View>
          
          <Text style={styles.challengeTitle}>{challenge.Title}</Text>
          
          <View style={styles.challengeMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={16} color="#aaa" />
              <Text style={styles.metaText}>{challenge.Duration} days</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color="#aaa" />
              <Text style={styles.metaText}>{challenge.Participants.length} participants</Text>
            </View>
          </View>
        </LinearGradient>
        
        {/* Challenge Content */}
        <View style={styles.contentContainer}>
          {/* Progress Section */}
          {isJoined && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.sectionTitle}>Your Progress</Text>
                <Text style={styles.progressText}>
                  {Math.round(progress * 100)}% complete
                </Text>
              </View>
              
              <Progress.Bar 
                progress={progress} 
                width={width - 40} 
                height={8}
                color={badgeStyles.progressColor}
                unfilledColor="rgba(255, 255, 255, 0.1)"
                borderWidth={0}
                borderRadius={4}
                style={styles.progressBar}
              />
              
              <View style={styles.dateInfo}>
                <Text style={styles.dateText}>Started: {formatDate(startDatep)}</Text>
                <Text style={styles.dateText}>Ends: {formatDate(endDatep)}</Text>
              </View>
            </View>
          )}
          
          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Challenge</Text>
            <Text style={styles.descriptionText}>{challenge.Description}</Text>
          </View>
          
          {/* Requirements Section */}
          <View style={styles.section}>
  <Text style={styles.sectionTitle}>How It Works</Text>

  <View style={styles.requirementItem}>
    <MaterialIcons name="verified" size={18} color={badgeStyles.progressColor} />
    <Text style={styles.requirementText}>
      Type: {challenge.Challenge_Type === 'Proof'
        ? 'Proof Required (Submit daily evidence)'
        : 'Honor System (No proof required)'}
    </Text>
  </View>
</View>

{challenge.Rewards && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Rewards</Text>

    {(Object.entries(challenge.Rewards) as [RewardKeys, string][]).map(
      ([key, value]) =>
        value && (
          <View key={key} style={styles.rewardItem}>
            <FontAwesome
              name={
                key === 'Winner'
                  ? 'trophy'
                  : key === 'Top3' || key === 'Top5' || key === 'Top10'
                  ? 'trophy'
                  : 'certificate'
              }
              size={16}
              color={
                key === 'Winner'
                  ? '#FFD700'
                  : key === 'Top3'
                  ? '#C0C0C0'
                  : key === 'Top5'
                  ? '#CD7F32'
                  : '#00ff9d'
              }
            />
            <Text style={styles.rewardText}>
              {key === 'Winner'
                ? 'Winner'
                : key === 'Top3'
                ? 'Top 3'
                : key === 'Top5'
                ? 'Top 5'
                : key === 'Top10'
                ? 'Top 10'
                : 'All Participants'}
              : {value}
            </Text>
          </View>
        )
    )}
  </View>
)}

        </View>
        
        {/* Spacer for action button */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Action Button */}
      <View style={styles.actionButtonContainer}>
        {isJoined ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.leaveButton]}
            onPress={handleLeaveChallenge}
          >
            <Text style={styles.actionButtonText}>Leave Challenge</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, styles.joinButton]}
            onPress={() => setJoinModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>Join Challenge</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Join Challenge Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={joinModalVisible}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setJoinModalVisible(false)}
            >
              <AntDesign name="close" size={24} color="#777" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Join Challenge</Text>
            <Text style={styles.modalText}>
              Commit to this {challenge.Duration}-day {challenge.By} challenge?
            </Text>
            
            <View style={styles.modalRequirements}>
              <Text style={styles.modalSubtitle}>Requirements:</Text>
              <View style={styles.modalRequirementItem}>
                <MaterialIcons name="verified" size={18} color="#00ff9d" />
                <Text style={styles.modalRequirementText}>
                  {challenge.Challenge_Type} challenge
                </Text>
              </View>
              <View style={styles.modalRequirementItem}>
                <MaterialIcons name="verified" size={18} color="#00ff9d" />
                <Text style={styles.modalRequirementText}>
                  Complete all {challenge.Duration} days
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalJoinButton]}
              onPress={handleJoinChallenge}
            >
              <Text style={styles.modalButtonText}>Join Challenge</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setJoinModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: '#777' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    gap: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '600',
  },
  errorSubtext: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  challengeHeader: {
    padding: 25,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
  challengeBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  badgeGym: {
    backgroundColor: 'rgba(0, 245, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  badgeFitStreak: {
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  challengeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 14,
    color: '#aaa',
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
  },
  progressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressText: {
    fontSize: 14,
    color: '#00f5ff',
    fontWeight: '600',
  },
  progressBar: {
    marginBottom: 15,
  },
  dateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 13,
    color: '#777',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#ddd',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  requirementText: {
    fontSize: 15,
    color: '#ddd',
    flex: 1,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  rewardText: {
    fontSize: 15,
    color: '#ddd',
  },
  actionButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  joinButton: {
    backgroundColor: '#00f5ff',
  },
  leaveButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width - 40,
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 25,
    paddingTop: 40,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  modalRequirements: {
    marginBottom: 25,
  },
  modalRequirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalRequirementText: {
    fontSize: 15,
    color: '#ddd',
    flex: 1,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalJoinButton: {
    backgroundColor: '#00f5ff',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});