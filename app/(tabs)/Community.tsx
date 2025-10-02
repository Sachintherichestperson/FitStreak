import { FontAwesome, Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Image,
    ImageBackground,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

const { width, height } = Dimensions.get('window');

const FitStreakCommunity = () => {
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
  };

  const [activeTab, setActiveTab] = useState('anonymous');
  type AnonymousPost = {
  _id: string;
  Content: string;
  Image?: string;
  timeAgo?: string;
  Biceps: string[];
  Fire: string[];
  Boring: string[];
  Comments: Array<{
    _id: string;
    Content: string;
    User: string;
    CreatedAt: string;
  }>;
  bicepsAnim: Animated.Value;
  fireAnim: Animated.Value;
  boringAnim: Animated.Value;
  userReactions: {
    Biceps: boolean;
    Fire: boolean;
    Boring: boolean;
  };
};

  const [anonymousPosts, setAnonymousPosts] = useState<AnonymousPost[]>([]);

  type LeaderboardUser = {
    rank: number;
    name: string;
    streak: number;
    badge: string;
    emoji: string;
    points: number;
  };

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardUser | null>(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState({
    leaderboard: true,
    community: true
  });
  const [refreshing, setRefreshing] = useState(false);
  
  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<AnonymousPost | null>(null);
  const commentInputRef = useRef<TextInput>(null);
  const [newComment, setNewComment] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  const fetchBackendData = async () => {
  try {
    const token = await AsyncStorage.getItem('Token');
    const response = await fetch('http://192.168.29.104:3000/Community/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();

    setAnonymousPosts(
      data.posts.map((post: any) => ({
        ...post,
        bicepsAnim: new Animated.Value(1),
        fireAnim: new Animated.Value(1),
        boringAnim: new Animated.Value(1),
        userReactions: {
          Biceps: post.Biceps.includes(data.currentUserId),
          Fire: post.Fire.includes(data.currentUserId),
          Boring: post.Boring.includes(data.currentUserId),
        },
        // Flatten and normalize comments - ensure User is a string
        Comments: (post.Comment || []).map((c: any) => ({
          _id: c._id,
          Content: c.Comment, // rename Comment -> Content for consistency
          User: c.UserId?.username || 'Anonymous', // Extract username as string
          CreatedAt: c.CreatedAt || new Date().toISOString(),
        })),
      }))
    );

    setLoading((prev) => ({ ...prev, community: false }));
  } catch (error) {
    console.error('Error fetching community data:', error);
    setLoading((prev) => ({ ...prev, community: false }));
  }
};


  const fetchLeaderboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.29.104:3000/Community/Leaderboard', {
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
      
      setTopPerformers(data.leaderboard.slice(0, 5).map((user: { name: any; streak: any; emoji: string | number; }, index: number) => ({
        id: `l${index + 1}`,
        name: user.name,
        streak: user.streak,
        badge: getBadgeEmoji(index + 1),
        badgeImage: badgeImages[user.emoji]
      })));
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(prev => ({ ...prev, leaderboard: false }));
    }
  };

  const ReactToPost = async (postId: string, reactionType: string) => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch(`http://192.168.29.104:3000/Community/Reaction/${postId}?type=${reactionType}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if(response.ok) {
        const updatedPost = await response.json();
        
        setAnonymousPosts(prevPosts => 
          prevPosts.map(post => {
            if(post._id === postId) {
              const animValue = reactionType === 'Biceps' ? post.bicepsAnim : 
                              reactionType === 'Fire' ? post.fireAnim : post.boringAnim;
              
              Animated.sequence([
                Animated.timing(animValue, {
                  toValue: 1.5,
                  duration: 100,
                  easing: Easing.linear,
                  useNativeDriver: true
                }),
                Animated.timing(animValue, {
                  toValue: 0.8,
                  duration: 100,
                  easing: Easing.linear,
                  useNativeDriver: true
                }),
                Animated.timing(animValue, {
                  toValue: 1.2,
                  duration: 100,
                  easing: Easing.linear,
                  useNativeDriver: true
                }),
                Animated.timing(animValue, {
                  toValue: 1,
                  duration: 100,
                  easing: Easing.linear,
                  useNativeDriver: true
                })
              ]).start();

              const newUserReactions = {
                Biceps: reactionType === 'Biceps',
                Fire: reactionType === 'Fire',
                Boring: reactionType === 'Boring'
              };

              return {
                ...post,
                Biceps: updatedPost.Biceps,
                Fire: updatedPost.Fire,
                Boring: updatedPost.Boring,
                userReactions: newUserReactions
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  const addComment = async (postId: string) => {
  if (!newComment.trim() || isCommentSubmitting) return;

  setIsCommentSubmitting(true);
  try {
    const token = await AsyncStorage.getItem('Token');
    const response = await fetch(`http://192.168.29.104:3000/Community/Comment/${postId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Content: newComment
      }),
    });

    if (response.ok) {
      const updatedPost = await response.json();
      
      setAnonymousPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId 
            ? { ...post, Comments: updatedPost.Comments }
            : post
        )
      );
      
      setNewComment('');
    }
  } catch (error) {
    console.error('Error adding comment:', error);
  } finally {
    setIsCommentSubmitting(false);
  }
  };

  const openComments = (post: AnonymousPost) => {
    setSelectedPost(post);
    setNewComment(''); // Clear previous comment
    setCommentModalVisible(true);
    // Focus the input after a short delay to ensure modal is visible
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const closeComments = () => {
    setCommentModalVisible(false);
    setSelectedPost(null);
    setNewComment('');
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

  const teamsData = [
    { id: 't1', name: 'Team Alpha', rank: '🥇', avg: 63, members: 12 },
    { id: 't2', name: 'Iron Legion', rank: '🥈', avg: 57, members: 8 },
    { id: 't3', name: 'FitFam', rank: '🥉', avg: 49, members: 15 },
    { id: 't4', name: 'Gym Rats', rank: '4', avg: 42, members: 10 },
    { id: 't5', name: 'Cardio Kings', rank: '5', avg: 38, members: 7 },
  ];

  const renderAnonymousPost = ({ item }: { item: any }) => {
    const bicepsStyle = {
      transform: [{ scale: item.bicepsAnim }]
    };
    
    const fireStyle = {
      transform: [{ scale: item.fireAnim }]
    };
    
    const boringStyle = {
      transform: [{ scale: item.boringAnim }]
    };

    return (
      <View style={styles.postCard}>
        <Text style={styles.postContent}>{item.Content}</Text>
        
        {/* Post Image */}
        {item.Image && (
          <Image 
            source={{ uri: item.Image }} 
            style={styles.postImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.postMeta}>
          <Text style={styles.postTime}>{item.timeAgo}</Text>
          <View style={styles.postReactions}>
            <TouchableOpacity
              style={styles.reactionBtn}
              onPress={() => ReactToPost(item._id, 'Biceps')}
            >
              <Animated.Text style={[
                styles.reactionText,
                bicepsStyle,
                item.userReactions.Biceps && styles.activeReactionText
              ]}>
                💪 { item.Biceps?.length || 0 }
              </Animated.Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reactionBtn}
              onPress={() => ReactToPost(item._id, 'Fire')}
            >
              <Animated.Text style={[
                styles.reactionText,
                fireStyle,
                item.userReactions.Fire && styles.activeReactionText
              ]}>
                🔥 { item.Fire?.length || 0 }
              </Animated.Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reactionBtn}
              onPress={() => ReactToPost(item._id, 'Boring')}
            >
              <Animated.Text style={[
                styles.reactionText,
                boringStyle,
                item.userReactions.Boring && styles.activeReactionText
              ]}>
                😴 { item.Boring?.length || 0 }
              </Animated.Text>
            </TouchableOpacity>
            
            {/* Comment Button */}
            <TouchableOpacity
              style={styles.reactionBtn}
              onPress={() => openComments(item)}
            >
              <Text style={styles.reactionText}>
                💬 { item.Comments?.length || 0 }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderTopPerformer = ({ item }: { item: { id: string; name: string; streak: number; badge: string; badgeImage?: any } }) => (
    <View style={styles.leaderCard}>
      <View style={styles.leaderAvatar}>
        {item.badgeImage ? (
          <Image 
            source={item.badgeImage} 
            style={[styles.badgeImage, { tintColor: '#009e76b3' }]}
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

  const renderLeaderboardRow = ({ item }: { item: LeaderboardUser }) => (
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

  const CommentModal = () => {
  const [localComment, setLocalComment] = useState('');

  // Initialize local state when modal opens
  useEffect(() => {
    if (commentModalVisible) {
      setLocalComment(newComment);
    }
  }, [commentModalVisible]);

  const handleSubmit = () => {
    if (localComment.trim() && selectedPost) {
      setNewComment(localComment);
      addComment(selectedPost._id);
      setLocalComment('');
    }
  };

  const formatCommentTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  // Get username from comment - handle both string and object formats
  const getUsername = (comment: any) => {
    if (typeof comment.User === 'string') {
      return comment.User;
    } else if (comment.User && typeof comment.User === 'object') {
      return comment.User.username || 'Anonymous';
    }
    return 'Anonymous';
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={commentModalVisible}
      onRequestClose={closeComments}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Comments</Text>
                <Text style={styles.commentsCount}>
                  {selectedPost?.Comments?.length || 0} comment{selectedPost?.Comments?.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={closeComments}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Comments List */}
            <ScrollView 
              style={styles.commentsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.commentsListContent}
            >
              {selectedPost?.Comments?.map((comment, index) => (
                <View key={comment._id} style={[
                  styles.commentItem,
                  index === 0 && styles.firstCommentItem
                ]}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {getUsername(comment).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentContentWrapper}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUsername}>
                        {getUsername(comment)}
                      </Text>
                      <Text style={styles.commentTime}>
                        {formatCommentTime(comment.CreatedAt)}
                      </Text>
                    </View>
                    <Text style={styles.commentContent}>{comment.Content}</Text>
                  </View>
                </View>
              ))}
              
              {(!selectedPost?.Comments || selectedPost.Comments.length === 0) && (
                <View style={styles.noCommentsContainer}>
                  <Ionicons name="chatbubble-outline" size={64} color="#444" />
                  <Text style={styles.noCommentsTitle}>No comments yet</Text>
                  <Text style={styles.noCommentsText}>Be the first to share your thoughts!</Text>
                </View>
              )}
            </ScrollView>
            
            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <View style={styles.commentInputWrapper}>
                <TextInput
                  ref={commentInputRef}
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  placeholderTextColor="#777"
                  value={localComment}
                  onChangeText={setLocalComment}
                  multiline
                  maxLength={500}
                  blurOnSubmit={false}
                  onSubmitEditing={handleSubmit}
                  editable={!isCommentSubmitting}
                />
                <TouchableOpacity 
                  style={[
                    styles.sendButton, 
                    (!localComment.trim() || isCommentSubmitting) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={!localComment.trim() || isCommentSubmitting}
                >
                  {isCommentSubmitting ? (
                    <ActivityIndicator size="small" color="#777" />
                  ) : (
                    <Ionicons name="send" size={20} color={localComment.trim() ? "#00ff9d" : "#777"} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.commentHint}>
                {localComment.length}/500 characters
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

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

  const AnonymousSection = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Anonymous Zone</Text>
      </View>

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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        style={styles.background}
      >
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
        </View>

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
        </ScrollView>

        <CommentModal />
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
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
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
    gap: 10,
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
    fontSize: 14,
  },
  activeReactionText: {
    color: '#00ff9d',
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
  // Enhanced Comment Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1a1a1a',
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  commentsCount: {
    fontSize: 14,
    color: '#00ff9d',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    marginLeft: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    padding: 20,
    paddingBottom: 10,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#00ff9d',
  },
  firstCommentItem: {
    marginTop: 0,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 157, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#00ff9d',
    fontWeight: '600',
    fontSize: 16,
  },
  commentContentWrapper: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentUsername: {
    color: '#00ff9d',
    fontWeight: '600',
    fontSize: 14,
  },
  commentTime: {
    color: '#777',
    fontSize: 12,
    fontWeight: '500',
  },
  commentContent: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  noCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noCommentsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noCommentsText: {
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
  },
  commentInputContainer: {
    padding: 20,
    paddingTop: 15,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  commentInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    maxHeight: 100,
    padding: 0,
    margin: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  commentHint: {
    color: '#777',
    fontSize: 12,
    textAlign: 'right',
  },
});

export default FitStreakCommunity;