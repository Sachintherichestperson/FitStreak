import { FontAwesome, Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const FitStreakCommunity = () => {
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
  };
  const [activeTab, setActiveTab] = useState('anonymous');
  const [showContract, setShowContract] = useState(false);
  const [anonymousPosts, setAnonymousPosts] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState({
    leaderboard: true,
    community: true
  });
  const [refreshing, setRefreshing] = useState(false);


  const fetchBackendData = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.225.177:3000/Community/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setAnonymousPosts(data.posts);
      setLoading(prev => ({ ...prev, community: false }));
    } catch (error) {
      console.error('Error fetching community data:', error);
      setLoading(prev => ({ ...prev, community: false }));
    }
  };

  const fetchLeaderboardData = async () => {
  try {
    const token = await AsyncStorage.getItem('Token');
    const response = await fetch('http://192.168.225.177:3000/Community/Leaderboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    setLeaderboardData(data.leaderboard);
    setCurrentUserRank(data.currentUserRank);
    
    // Get top 5 performers for the carousel
    setTopPerformers(data.leaderboard.slice(0, 5).map((user, index) => ({
      id: `l${index + 1}`,
      name: user.name,
      streak: user.streak,
      badge: getBadgeEmoji(index + 1),
      badgeImage: badgeImages[user.emoji] || badgeImages['Beast']
    })));
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
  } finally {
    setLoading(prev => ({ ...prev, leaderboard: false }));
  }
};

  // Helper function to assign badges based on rank
  const getBadgeEmoji = (rank) => {
    switch(rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      case 4: return '🌟';
      case 5: return '⭐';
      default: return '🏅';
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'anonymous') {
        await fetchBackendData();
      } else if (activeTab === 'leaders') {
        await fetchLeaderboardData();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'anonymous') {
      fetchBackendData();
    } else if (activeTab === 'leaders') {
      fetchLeaderboardData();
    }
  }, [activeTab]);

  // Teams data
  const teamsData = [
    { id: 't1', name: 'Team Alpha', rank: '🥇', avg: 63, members: 12 },
    { id: 't2', name: 'Iron Legion', rank: '🥈', avg: 57, members: 8 },
    { id: 't3', name: 'FitFam', rank: '🥉', avg: 49, members: 15 },
    { id: 't4', name: 'Gym Rats', rank: '4', avg: 42, members: 10 },
    { id: 't5', name: 'Cardio Kings', rank: '5', avg: 38, members: 7 },
  ];

  const renderAnonymousPost = ({ item }) => (
    <View style={styles.postCard}>
      <Text style={styles.postContent}>{item.Content}</Text>
      <View style={styles.postMeta}>
        <Text style={styles.postTime}>{item.timeAgo}</Text>
        <View style={styles.postReactions}>
          <TouchableOpacity style={styles.reactionBtn}>
            <Text style={styles.reactionText}>💪 { item.Biceps }</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionBtn}>
            <Text style={styles.reactionText}>🔥 {item.Fire}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reactionBtn}>
            <Text style={styles.reactionText}>😴 {item.Boring}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderContractPost = ({ item }) => (
    <View style={styles.postCard}>
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.contractDetails}>
        <View style={styles.contractStat}>
          <Ionicons name="cash-outline" size={14} color="#00f5ff" />
          <Text style={styles.contractStatText}>Stakes: {item.stakes}</Text>
        </View>
        <View style={styles.contractStat}>
          <Ionicons name="calendar-outline" size={14} color="#00f5ff" />
          <Text style={styles.contractStatText}>{item.days} days</Text>
        </View>
      </View>
      <View style={styles.contractMeta}>
        <Text style={styles.postTime}>{item.time}</Text>
        <View style={styles.contractButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.loseButton]}>
            <Text style={styles.buttonText}>👎 Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.winButton]}>
            <Text style={styles.buttonText}>🔥 Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTopPerformer = ({ item }) => (
  <View style={styles.leaderCard}>
    <View style={styles.leaderAvatar}>
      {item.badgeImage ? (
        <Image 
          source={item.badgeImage} 
          style={styles.badgeImage}
          resizeMode="contain"
        />
      ) : (
        <Text>{item.badge}</Text>
      )}
    </View>
    <Text style={styles.leaderName}>{item.name}</Text>
    <Text style={styles.leaderStats}>🔥 {item.streak} Days</Text>
    <Text style={styles.leaderBadge}>{item.badge}</Text>
  </View>
);

  const renderLeaderboardRow = ({ item }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.cellRank, item.rank === 1 && styles.goldRank, item.rank === 2 && styles.silverRank, item.rank === 3 && styles.bronzeRank]}>
      {item.rank}
    </Text>
    <View style={styles.cellUser}>
      <View style={styles.userAvatar}>
        {badgeImages[item.emoji] ? (
          <Image 
            source={badgeImages[item.emoji]} 
            style={styles.badgeImageSmall}
            resizeMode="contain"
          />
        ) : (
          <Text>{item.emoji}</Text>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userBadge}>{item.badge}</Text>
      </View>
    </View>
    <Text style={styles.cellStreak}>🔥 {item.streak}d</Text>
    <Text style={styles.cellPoints}>{item.points.toLocaleString()}</Text>
  </View>
);

  const renderTeam = ({ item }) => (
    <View style={styles.teamCard}>
      <View style={styles.teamInfo}>
        <View style={styles.teamBadge}>
          <Text>{item.rank}</Text>
        </View>
        <View>
          <Text style={styles.teamName}>{item.name}</Text>
          <Text style={styles.teamMembers}>{item.members} members</Text>
        </View>
      </View>
      <View style={styles.teamStats}>
        <Text style={styles.teamAvg}>{item.avg} Day Avg</Text>
        <Text style={styles.teamStreak}>🔥 {Math.floor(item.avg * 1.3)} streak</Text>
      </View>
    </View>
  );

  const AnonymousSection = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Anonymous Zone</Text>
      </View>

      {!showContract ? (
        <>
          <Text style={styles.sectionDescription}>
            Share your fitness journey anonymously. No judgments, just support.
          </Text>
          {loading.community ? (
            <ActivityIndicator size="large" color="#00ff9d" style={styles.loadingIndicator} />
          ) : (
            <FlatList
              data={anonymousPosts}
              renderItem={renderAnonymousPost}
              keyExtractor={item => item._id}
              scrollEnabled={false}
            />
          )}
        </>
      ) : (
        <>
          <Text style={styles.sectionDescription}>
            Commit to challenges with stakes. Money on the line means motivation through the roof.
          </Text>
        </>
      )}
    </View>
  );

  const LeadersSection = () => {
    if (loading.leaderboard) {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Top Performers</Text>
          <ActivityIndicator size="large" color="#00ff9d" style={styles.loadingIndicator} />
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Top Performers</Text>
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
          
          {/* Show current user first if not in top 10 */}
          {currentUserRank && currentUserRank.rank > 10 && (
            <View style={[styles.tableRow, styles.currentUserRow]}>
              <Text style={[styles.cellRank, styles.currentUserRank]}>{currentUserRank.rank}</Text>
              <View style={styles.cellUser}>
                <View style={styles.userAvatar}>
                  <Text>{currentUserRank.emoji}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, styles.currentUserName]}>{currentUserRank.name} (You)</Text>
                  <Text style={styles.userBadge}>{currentUserRank.badge}</Text>
                </View>
              </View>
              <Text style={styles.cellStreak}>🔥 {currentUserRank.streak}d</Text>
              <Text style={styles.cellPoints}>{currentUserRank.points.toLocaleString()}</Text>
            </View>
          )}
          
          {/* Top 10 leaderboard */}
          <FlatList
            data={leaderboardData}
            renderItem={renderLeaderboardRow}
            keyExtractor={item => `lb${item.rank}`}
            scrollEnabled={false}
          />
        </View>
      </View>
    );
  };

  const TeamsSection = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Team Rankings</Text>
      <FlatList
        data={teamsData}
        renderItem={renderTeam}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        style={styles.background}
      >
        {/* Community Header */}
        <View style={styles.communityHeader}>
          <View>
            <Text style={styles.communityTitle}>FitStreak Community</Text>
            <Text style={styles.communitySubtitle}>Connect • Compete • Grow</Text>
          </View>
          <TouchableOpacity style={styles.notificationBell}>
            <Ionicons name="notifications" size={20} color="#00ff9d" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Section Navigation Tabs */}
        <View style={styles.sectionTabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'anonymous' && styles.activeTab]}
            onPress={() => setActiveTab('anonymous')}
          >
            <MaterialCommunityIcons name="incognito" size={18} color={activeTab === 'anonymous' ? '#00ff9d' : '#777'} />
            <Text style={[styles.tabText, activeTab === 'anonymous' && styles.activeTabText]}>Anonymous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'leaders' && styles.activeTab]}
            onPress={() => setActiveTab('leaders')}
          >
            <FontAwesome name="trophy" size={18} color={activeTab === 'leaders' ? '#00ff9d' : '#777'} />
            <Text style={[styles.tabText, activeTab === 'leaders' && styles.activeTabText]}>Leaders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'teams' && styles.activeTab]}
            onPress={() => setActiveTab('teams')}
          >
            <FontAwesome name="users" size={16} color={activeTab === 'teams' ? '#00ff9d' : '#777'} />
            <Text style={[styles.tabText, activeTab === 'teams' && styles.activeTabText]}>Teams</Text>
          </TouchableOpacity>
        </View>

        {/* Content Sections */}
        <ScrollView 
          style={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#00ff9d']}
              tintColor="#00ff9d"
              progressBackgroundColor="#121212"
            />
          }
        >
          {activeTab === 'anonymous' && <AnonymousSection />}
          {activeTab === 'leaders' && <LeadersSection />}
          {activeTab === 'teams' && <TeamsSection />}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  background: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  communityTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00ff9d',
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  communitySubtitle: {
    color: '#777',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  notificationBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4d4d',
  },
  sectionTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    padding: 7,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#00ff9d',
    marginBottom: -11,
  },
  activeTabText: {
    color: '#00ff9d',
    fontWeight: '600',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#777',
    marginTop: 5,
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
    lineHeight: 20,
  },
  seeAllLink: {
    color: '#00ff9d',
    fontSize: 13,
    fontWeight: '500',
  },
  contractLink: {
    color: '#00f5ff',
    fontSize: 13,
    fontWeight: '500',
  },
  postCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 15,
    color: '#f0f0f0',
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 12,
    color: '#777',
  },
  postReactions: {
    flexDirection: 'row',
    gap: 15,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  reactionText: {
    color: 'white',
  },
  contractDetails: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  contractStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  contractStatText: {
    fontSize: 13,
    color: '#00f5ff',
  },
  contractMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  contractButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 100,
  },
  loseButton: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  winButton: {
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.3)',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
  },
  contractButton: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  contractButtonText: {
    color: '#00f5ff',
    fontWeight: '600',
    fontSize: 15,
  },
  loadingIndicator: {
    marginVertical: 30,
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
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
  badgeImage: {
    width: 40,
    height: 40,
  },
  badgeImageSmall: {
    width: 30,
    height: 30,
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
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
  teamCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  teamMembers: {
    fontSize: 11,
    color: '#777',
    marginTop: 3,
  },
  teamStats: {
    alignItems: 'flex-end',
  },
  teamAvg: {
    fontSize: 14,
    color: '#00ff9d',
    fontWeight: '500',
  },
  teamStreak: {
    fontSize: 11,
    color: '#777',
    marginTop: 3,
  },
});

export default FitStreakCommunity;