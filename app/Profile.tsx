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
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

type UserStreak = {
  Scan: number;
  lastScan: string;
};

type Comment = {
  _id: string;
  content: string;
  timeAgo: string;
};

type AnonymousPost = {
  _id: string;
  Content: string;
  image?: string;
  timeAgo: string;
  Biceps: number;
  Fire: number;
  isLiked: boolean;
  comments: Comment[];
  showComments: boolean;
  commentText: string;
};

interface BuddyInfo {
  name: string | null;
  id: string | null;
  streak: number;
  avatar?: string;
}

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
  const [PostCount, setPostCount] = useState(0);
  const [level, setLevel] = useState('Beast Level');
  const [currentBadge, setCurrentBadge] = useState('Beast');
  const [streak, setStreak] = useState(0);
  const [fitCoins, setFitCoins] = useState(0);
  const [badges, setBadges] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAction, setWalletAction] = useState('');
  const [convertAmount, setConvertAmount] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [buddySearch, setBuddySearch] = useState(''); 
  const [showBuddyModal, setShowBuddyModal] = useState(false);
  const [buddy, setBuddy] = useState<BuddyInfo | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [anonymousPosts, setAnonymousPosts] = useState<AnonymousPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const BackendData = async () => {
    const token = await AsyncStorage.getItem('Token');
    try {
      const response = await fetch('http://192.168.141.177:3000/Profile/',{
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      setName(data.user.username || '');
      setUserId(data.user._id || '');
      setLevel(data.Level);
      setCurrentBadge(data.Badge);
      setPostCount(data.user.TotalPost || 0);
      setStreak(data.user.Streak?.Scan || 0);
      setBadges(data.user.Badges.length || 0);
      setFitCoins(data.Coins || 0);
      
      if (data.user.Buddy?.BuddyId) {
        setBuddy({
          name: data.Buddy?.username,
          id: data.Buddy?._id,
          streak: data.Buddy?.Streak?.Scan || 0,
          avatar: data.Buddy?.avatar
        });
      } else {
        setBuddy(null);
      }

      const postsWithTimeAgo = data.posts.map((post: any) => {
        const createdAt = new Date(post.CreatedAt);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let timeAgo = '';
        if (diffHours < 24) {
          timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else {
          timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        }

        return { 
          ...post, 
          timeAgo,
          isLiked: false,
          Fire: post.Fire?.length || 0,
          Biceps: post.Biceps.length || 0,
          comments: post.comments || [],
          showComments: false,
          commentText: ''
        };
      });

      setAnonymousPosts(postsWithTimeAgo);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    BackendData();
  }, []);

  const confirmBuddyChange = async (specialCode: string) => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.141.177:3000/Profile/update-buddy', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({
          buddyId: specialCode
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBuddy({
          name: data.name,
          id: data.id,
          streak: 1,
          avatar: data.avatar,
        });
        setShowBuddyModal(false);
        setBuddySearch('');
        BackendData(); // Refresh data
      } else {
        Alert.alert('Error', 'Invalid Code or Failed to update buddy');
      }
    } catch (error) {
      console.error('Error updating buddy:', error);
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const removeBuddy = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.141.177:3000/Profile/remove-buddy', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setBuddy(null);
        Alert.alert('Success', 'Buddy removed successfully');
        BackendData(); // Refresh data
      } else {
        Alert.alert('Error', 'Failed to remove buddy');
      }
    } catch (error) {
      console.error('Error removing buddy:', error);
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const token = await AsyncStorage.getItem('Token');
      
      const response = await fetch('http://192.168.141.177:3000/Profile/Profile-Edit', {
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
        BackendData(); // Refresh profile data
      } else {
        throw new Error(data.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleEditProfile = () => {
    setEditMode(!editMode);
  };

  const handleWalletAction = (action: string) => {
    setWalletAction(action);
    setShowWalletModal(true);
  };

  const executeWalletAction = () => {
    if (walletAction === 'convert') {
      const amount = parseInt(convertAmount);
      if (!isNaN(amount) && amount > 0 && amount <= fitCoins) {
        setFitCoins(fitCoins - amount);
        Alert.alert(`Converted ${amount} FC to your bank account`);
      } else {
        Alert.alert('Invalid amount');
      }
    } else if (walletAction === 'add') {
      const amount = parseInt(addAmount);
      if (!isNaN(amount)) {
        setFitCoins(fitCoins + amount);
        Alert.alert(`Added ${amount} FC to your wallet`);
      } else {
        Alert.alert('Invalid amount');
      }
    }
    setShowWalletModal(false);
    setConvertAmount('');
    setAddAmount('');
  };

  const handleChangeBuddy = () => {
    setShowBuddyModal(true);
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

  const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Sorry, we need camera roll permissions to make this work!');
    return;
  }

  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true, // prevents cropping
    quality: 0.5,           // maximum quality, preserves original size
    allowsMultipleSelection: false,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    setPostImage(result.assets[0].uri);
  }
};


  const removeImage = () => {
    setPostImage(null);
  };

  const handlePostSubmit = async () => {
  const token = await AsyncStorage.getItem('Token');

  if (!postContent.trim() && !postImage) {
    Alert.alert('Error', 'Please add some content or image to your post');
    return;
  }

  setIsPosting(true);

  try {
    const formData = new FormData();
    formData.append('Content', postContent);

    if (postImage) {
      formData.append('image', {
        uri: postImage,
        type: 'image/jpeg',
        name: 'post-image.jpg',
      } as any);
    }

    const response = await fetch('http://192.168.141.177:3000/Profile/Create-Post', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data', // Important for file upload
      },
      body: formData,
    });

    const data = await response.json();

    const newPost: AnonymousPost = {
      _id: data.id || Date.now().toString(),
      Content: postContent,
      image: data.imageUrl || undefined, // Make sure backend returns imageUrl
      timeAgo: 'Just Now',
      Biceps: 0,
      Fire: 0,
      isLiked: false,
      comments: [],
      showComments: false,
      commentText: ''
    };

    setAnonymousPosts([newPost, ...anonymousPosts]);
    setPostContent('');
    setPostImage(null);
    setShowPostModal(false);
    Alert.alert('Success', 'Your anonymous post has been shared!');
    BackendData(); // Refresh posts
  } catch (error) {
    console.error('Error creating post:', error);
    Alert.alert('Error', 'Failed to create post');
  } finally {
    setIsPosting(false);
  }
};


  const toggleLike = (postId: string) => {
    setAnonymousPosts(anonymousPosts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          Biceps: post.isLiked ? post.Biceps - 1 : post.Biceps + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const toggleComments = (postId: string) => {
    setAnonymousPosts(anonymousPosts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          showComments: !post.showComments
        };
      }
      return post;
    }));
  };

  const handleCommentChange = (postId: string, text: string) => {
    setAnonymousPosts(anonymousPosts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          commentText: text
        };
      }
      return post;
    }));
  };

  const submitComment = async (postId: string) => {
    const post = anonymousPosts.find(p => p._id === postId);
    if (!post || !post.commentText.trim()) return;

    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch(`http://192.168.141.177:3000/Profile/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: post.commentText
        }),
      });

      if (response.ok) {
        const newComment: Comment = {
          _id: Date.now().toString(),
          content: post.commentText,
          timeAgo: 'Just now'
        };

        setAnonymousPosts(anonymousPosts.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              comments: [...p.comments, newComment],
              commentText: ''
            };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    }
  };

  const renderPostItem = ({ item }: { item: AnonymousPost }) => (
    <View style={styles.postCard}>
      <Text style={styles.postContent}>{item.Content}</Text>
      
      {item.image && (
        <Image 
          source={{ uri: item.image }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.postFooter}>
        <Text style={styles.postTimestamp}>{item.timeAgo}</Text>
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.postAction}
            onPress={() => toggleLike(item._id)}
          >
            <Text>💪</Text>
            <Text style={[styles.postActionText, item.isLiked && { color: "#FF5252" }]}>
              {item.Biceps}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.postAction}
            onPress={() => toggleComments(item._id)}
          >
            <Text>💬</Text>
            <Text style={styles.postActionText}>
              {item.comments.length}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.postAction}>
            <Text>🔥</Text>
            <Text style={styles.postActionText}>
              {item.Fire}
            </Text>
          </View>
        </View>
      </View>

      {/* Comments Section */}
      {item.showComments && (
        <View style={styles.commentsSection}>
          {/* Comments List */}
          {item.comments.map((comment) => (
            <View key={comment._id} style={styles.commentItem}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>👤</Text>
              </View>
              <View style={styles.commentContent}>
                <Text style={styles.commentText}>{comment.content}</Text>
                <Text style={styles.commentTime}>{comment.timeAgo}</Text>
              </View>
            </View>
          ))}
          
          {/* Add Comment Input */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#888"
              value={item.commentText}
              onChangeText={(text) => handleCommentChange(item._id, text)}
              multiline
            />
            <TouchableOpacity 
              style={[
                styles.commentSubmitButton,
                !item.commentText.trim() && styles.commentSubmitButtonDisabled
              ]}
              onPress={() => submitComment(item._id)}
              disabled={!item.commentText.trim()}
            >
              <Text style={styles.commentSubmitText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

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
                  style={[styles.badgeImage, { tintColor: '#00C896' }]}
                />
            </View>
            
            {editMode ? (
              <TextInput
                style={[styles.userName, styles.editInput]}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            ) : (
              <Text style={styles.userName}>{name}</Text>
            )}
            
            <View style={styles.userLevel}>
              <FontAwesome name="trophy" size={14} color="#00C896" />
              <Text style={styles.levelText}>{level}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={editMode ? handleSaveProfile : handleEditProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <ActivityIndicator size="small" color="#F5F5F5" />
              ) : (
                <>
                  <FontAwesome
                    name={editMode ? 'check' : 'pencil'}
                    size={14}
                    color="#F5F5F5"
                  />
                  <Text style={styles.editProfileText}>
                    {editMode ? 'Save Profile' : 'Edit Profile'}
                  </Text>
                </>
              )}
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
            <Text style={styles.statValue}>{PostCount}</Text>
            <Text style={styles.statLabel}>Anonymous Post</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{badges}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* Anonymous Post Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Anonymous Community</Text>
            <TouchableOpacity onPress={() => setShowPostModal(true)}>
              <LinearGradient
                colors={['#00C896', '#00A8FF']}
                style={styles.createPostButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="plus" size={16} color="#F5F5F5" />
                <Text style={styles.createPostButtonText}>New Post</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {isLoadingPosts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00C896" />
            </View>
          ) : anonymousPosts.length === 0 ? (
            <View style={styles.emptyPostsContainer}>
              <MaterialCommunityIcons name="post-outline" size={40} color="#888" />
              <Text style={styles.emptyPostsText}>No posts yet</Text>
              <TouchableOpacity 
                style={styles.emptyPostsButton}
                onPress={() => setShowPostModal(true)}
              >
                <Text style={styles.emptyPostsButtonText}>Create your first post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={anonymousPosts}
              renderItem={renderPostItem}
              keyExtractor={item => item._id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.postsList}
            />
          )}
        </View>

        {/* Wallet Section */}
        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Wallet</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.walletBalance}>{fitCoins.toLocaleString()} FitCoins </Text>
            <View style={styles.walletActions}>
            </View>
          </View>
        </View> */}

        {/* Buddy Section */}
        {/* {buddy && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Workout Buddy</Text>
              <View style={styles.buddyActionButtons}>
                <TouchableOpacity onPress={handleChangeBuddy}>
                  <Text style={styles.viewAll}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={removeBuddy}>
                  <Text style={styles.removeBuddyText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitle}>
                  <FontAwesome name="users" size={16} color="#00C896" />
                  <Text style={styles.cardTitleText}>Linked Buddy</Text>
                </View>
                <View style={styles.cardStatus}>
                  <Text style={styles.cardStatusText}>Active</Text>
                </View>
              </View>
              
              <View style={styles.buddyInfo}>
                <Image
                  source={{ uri: buddy.avatar || 'https://randomuser.me/api/portraits/men/42.jpg' }}
                  style={styles.buddyAvatar}
                />
                <View>
                  <Text style={styles.buddyName}>{buddy.name}</Text>
                  <View style={styles.buddyStreak}>
                    <FontAwesome name="fire" size={13} color="#0084FF" />
                    <Text style={styles.buddyStreakText}>{buddy.streak} day streak together</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )} */}

        {/* Add Buddy Section if no buddy exists */}
        {/* {!buddy && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Workout Buddy</Text>
              <TouchableOpacity onPress={handleChangeBuddy}>
                <Text style={styles.viewAll}>Add</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.card}>
              <View style={styles.noBuddyContainer}>
                <MaterialCommunityIcons name="account-question" size={40} color="#888" />
                <Text style={styles.noBuddyText}>No workout buddy linked</Text>
                <TouchableOpacity 
                  style={styles.addBuddyButton}
                  onPress={handleChangeBuddy}
                >
                  <Text style={styles.addBuddyButtonText}>Add Workout Buddy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )} */}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingsList}>
            {/* {settingsItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.settingsItem}
                onPress={() => Alert.alert(`${item.name} pressed`)}
              >
                <View style={styles.settingsIcon}>
                  <FontAwesome name={item.icon as any} size={16} color="#00C896" />
                </View>
                <Text style={styles.settingsText}>{item.name}</Text>
                <FontAwesome name="chevron-right" size={12} color="#888" />
              </TouchableOpacity>
            ))} */}
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={handleLogout}
            >
              <View style={styles.settingsIcon}>
                <FontAwesome name="sign-out" size={16} color="#FF5252" />
              </View>
              <Text style={[styles.settingsText, { color: '#FF5252' }]}>Logout</Text>
              <FontAwesome name="chevron-right" size={12} color="#FF5252" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Wallet Modal */}
      <Modal
        visible={showWalletModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWalletModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {walletAction === 'convert' ? 'Convert FitCoins' : 'Add FitCoins'}
            </Text>
            
            {walletAction === 'convert' ? (
              <>
                <Text style={styles.modalText}>
                  Convert your FitCoins to real money (100 FC = ₹10)
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Amount to convert"
                  keyboardType="numeric"
                  value={convertAmount}
                  onChangeText={setConvertAmount}
                />
                <Text style={styles.balanceText}>
                  Available: {fitCoins.toLocaleString()} FC
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.modalText}>
                  Add FitCoins to your wallet by completing challenges or purchasing
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Amount to add"
                  keyboardType="numeric"
                  value={addAmount}
                  onChangeText={setAddAmount}
                />
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWalletModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={executeWalletAction}
              >
                <Text style={styles.confirmButtonText}>
                  {walletAction === 'convert' ? 'Convert' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Post Creation Modal */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPostModal(false)}
      >
        <View style={styles.postModalContainer}>
          <View style={styles.postModalHeader}>
            <TouchableOpacity onPress={() => setShowPostModal(false)}>
              <Ionicons name="close" size={24} color="#F5F5F5" />
            </TouchableOpacity>
            <Text style={styles.postModalTitle}>Create Anonymous Post</Text>
            <TouchableOpacity 
              onPress={handlePostSubmit}
              disabled={isPosting}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#00C896" />
              ) : (
                <Text style={styles.postSubmitButton}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.postInputContainer}>
            <TextInput
              style={styles.postInput}
              placeholder="Share your fitness journey anonymously..."
              placeholderTextColor="#888"
              multiline
              value={postContent}
              onChangeText={setPostContent}
            />
            
            {postImage && (
              <View style={styles.postImagePreviewContainer}>
                <Image
                  source={{ uri: postImage }}
                  style={styles.postImagePreview}
                  resizeMode="contain"
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <Ionicons name="close" size={20} color="#F5F5F5" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.postActionsBar}>
            <TouchableOpacity 
              style={styles.postActionButton}
              onPress={pickImage}
            >
              <Feather name="image" size={20} color="#00C896" />
              <Text style={styles.postActionText}>Add Image</Text>
            </TouchableOpacity>
            
            <View style={styles.postPrivacyInfo}>
              <MaterialCommunityIcons name="incognito" size={16} color="#00C896" />
              <Text style={styles.postPrivacyText}>This post will be anonymous</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Buddy Modal */}
      <Modal
        visible={showBuddyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBuddyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Buddy Code</Text>
            <Text style={styles.modalText}>
              Ask your friend for their code and enter it below to connect as buddies.
            </Text>

            <TextInput
              style={styles.buddySearchInput}
              placeholder="Enter special buddy code..."
              placeholderTextColor="#888"
              value={buddySearch}
              onChangeText={setBuddySearch}
            />

            <TouchableOpacity
              style={[styles.BuddyModalButton, { width: '100%' }]}
              onPress={() => confirmBuddyChange(buddySearch)}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalCancelButton,  { width: '100%' }]}
              onPress={() => setShowBuddyModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
    borderColor: '#06876788',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F5F5F5',
    marginBottom: 5,
  },
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
    color: '#F5F5F5',
    textAlign: 'center',
  },
  userLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 200, 150, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 15,
  },
  levelText: {
    color: '#00C896',
    fontSize: 14,
    fontWeight: '600',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#888',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
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
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00C896',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F5F5',
    marginBottom: 20,
  },
  viewAll: {
    fontSize: 14,
    color: '#888',
  },
  removeBuddyText: {
    fontSize: 14,
    color: '#FF5252',
    marginLeft: 15,
  },
  buddyActionButtons: {
    flexDirection: 'row',
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  createPostButtonText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F5',
  },
  cardStatus: {
    backgroundColor: 'rgba(0, 200, 150, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  cardStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00C896',
  },
  walletBalance: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 15,
    color: '#00C896',
  },
  walletActions: {
    flexDirection: 'row',
    gap: 10,
  },
  walletButton: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#00C896',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  buttonText: {
    fontWeight: '600',
  },
  buddyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  buddyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#0084FF',
  },
  buddyName: {
    fontWeight: '600',
    color: '#F5F5F5',
    marginBottom: 5,
  },
  buddyStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  buddyStreakText: {
    fontSize: 13,
    color: '#888',
  },
  progressContainer: {
    marginVertical: 15,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00C896',
  },
  contractInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  contractLabel: {
    color: '#888',
    fontSize: 14,
  },
  contractValue: {
    color: '#F5F5F5',
    fontSize: 14,
  },
  contractDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  detailText: {
    color: '#F5F5F5',
    marginBottom: 8,
    fontSize: 14,
  },
  settingsList: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  settingsIcon: {
    width: 20,
    marginRight: 15,
    alignItems: 'center',
  },
  settingsText: {
    flex: 1,
    fontSize: 15,
    color: '#F5F5F5',
  },
  logoutItem: {
    color: '#FF5252',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F5F5',
    marginBottom: 10,
  },
  modalText: {
    color: '#888',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    color: '#F5F5F5',
    marginBottom: 10,
  },
  balanceText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    height: 50,
    backgroundColor: '#a61616ff',
    alignItems: 'center',
    color: '#F5F5F5',
  },
  cancelButton: {
    backgroundColor: '#764646ff',
    height: 80,
  },
  confirmButton: {
    backgroundColor: '#00C896',
    height: 80,
  },
  cancelButtonText: {
    color: '#F5F5F5',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#F5F5F5',
    fontWeight: '600',
  },
  buddyList: {
    maxHeight: height * 0.4,
    marginBottom: 20,
  },
  buddyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  buddyOptionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  buddyOptionName: {
    color: '#F5F5F5',
    fontSize: 16,
  },
  // Post related styles
  postsList: {
    gap: 15,
  },
  postCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  anonymousAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  anonymousName: {
    color: '#F5F5F5',
    fontWeight: '600',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  postContent: {
    color: '#F5F5F5',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 15,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTimestamp: {
    color: '#888',
    fontSize: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 10,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPostsContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPostsText: {
    color: '#888',
    fontSize: 16,
    marginVertical: 10,
  },
  emptyPostsButton: {
    backgroundColor: '#00C896',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  emptyPostsButtonText: {
    color: '#121212',
    fontWeight: '600',
  },
  // Comments Styles
  commentsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  commentAvatarText: {
    fontSize: 12,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    padding: 10,
    borderRadius: 12,
  },
  commentText: {
    color: '#F5F5F5',
    fontSize: 14,
    marginBottom: 4,
  },
  commentTime: {
    color: '#888',
    fontSize: 11,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#F5F5F5',
    marginRight: 10,
    fontSize: 14,
  },
  commentSubmitButton: {
    backgroundColor: '#00C896',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  commentSubmitText: {
    color: '#121212',
    fontWeight: '600',
    fontSize: 14,
  },
  // Post Modal Styles
  postModalContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  postModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  postModalTitle: {
    color: '#F5F5F5',
    fontSize: 18,
    fontWeight: '600',
  },
  postSubmitButton: {
    color: '#00C896',
    fontSize: 16,
    fontWeight: '600',
  },
  postInputContainer: {
    flex: 1,
    padding: 15,
  },
  postInput: {
    color: '#F5F5F5',
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  postImagePreviewContainer: {
    marginTop: 0,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  postImagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    backgroundColor: '#000000',
    borderTopColor: '#2A2A2A',
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 8,
  },
  postActionText: {
    color: '#00C896',
    fontSize: 14,
  },
  postPrivacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  postPrivacyText: {
    color: '#888',
    fontSize: 12,
  },
  noBuddyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noBuddyText: {
    color: '#F5F5F5',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  addBuddyButton: {
    backgroundColor: '#00C896',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  BuddyModalButton:{
    backgroundColor: '#00C896',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buddySearchInput: {
    backgroundColor: '#282828ff',
    borderRadius: 10,
    color: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  modalCancelButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBuddyButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
});

export default FitStreakProfile;