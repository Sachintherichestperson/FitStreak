import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const FitStreakCommunity = () => {
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
  const [loading, setLoading] = useState({
    community: true
  });
  const [refreshing, setRefreshing] = useState(false);
  
  // Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<AnonymousPost | null>(null);
  const commentInputRef = useRef<TextInput>(null);
  const [newComment, setNewComment] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  // Image modal state
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Create Post Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const fetchBackendData = async () => {
  try {
    const token = await AsyncStorage.getItem('Token');
    const response = await fetch('https://backend-hbwp.onrender.com/Community/', {
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
          Content: c.Comment,
          User: 'Anonymous',
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

  const ReactToPost = async (postId: string, reactionType: string) => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch(`https://backend-hbwp.onrender.com/Community/Reaction/${postId}?type=${reactionType}`, {
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

  const addComment = async (postId: string, commentContent: string) => {
    if (!commentContent.trim() || isCommentSubmitting) return;

    setIsCommentSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch(`https://backend-hbwp.onrender.com/Community/Comment/${postId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Content: commentContent
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Create a new comment object with the response data
        const newCommentObj = {
          _id: result.comment?._id || `temp-${Date.now()}`,
          Content: commentContent,
          User: result.comment?.UserId?.username || 'You',
          CreatedAt: result.comment?.CreatedAt || new Date().toISOString(),
        };

        // Update the posts with the new comment
        setAnonymousPosts(prevPosts => 
          prevPosts.map(post => {
            if (post._id === postId) {
              return {
                ...post,
                Comments: [...(post.Comments || []), newCommentObj]
              };
            }
            return post;
          })
        );
        
        // Also update the selected post in the modal
        if (selectedPost && selectedPost._id === postId) {
          setSelectedPost(prev => prev ? {
            ...prev,
            Comments: [...(prev.Comments || []), newCommentObj]
          } : null);
        }
        
        return true;
      } else {
        console.error('Failed to add comment:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
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

  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  // Create Post Functions
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
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

      const response = await fetch('https://backend-hbwp.onrender.com/Profile/Create-Post', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const newPost: AnonymousPost = {
          _id: data.post?._id || `temp-${Date.now()}`,
          Content: postContent,
          Image: data.post?.Image || postImage || undefined,
          timeAgo: 'Just Now',
          Biceps: [],
          Fire: [],
          Boring: [],
          Comments: [],
          bicepsAnim: new Animated.Value(1),
          fireAnim: new Animated.Value(1),
          boringAnim: new Animated.Value(1),
          userReactions: {
            Biceps: false,
            Fire: false,
            Boring: false
          }
        };

        setAnonymousPosts([newPost, ...anonymousPosts]);
        setPostContent('');
        setPostImage(null);
        setShowPostModal(false);
        Alert.alert('Success', 'Your anonymous post has been shared!');
      } else {
        throw new Error(data.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBackendData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

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
        
        {/* Improved Post Image Section */}
        {item.Image && (
          <View style={styles.imageContainer}>
            <TouchableOpacity 
              style={styles.imageWrapper}
              onPress={() => openImageModal(item.Image)}
              activeOpacity={0.9}
            >
              <Image 
                source={{ uri: item.Image }} 
                style={styles.postImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="expand" size={24} color="rgba(255,255,255,0.8)" />
              </View>
            </TouchableOpacity>
            <View style={styles.imageFooter}>
              <Text style={styles.imageHint}>Tap to view full image</Text>
            </View>
          </View>
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

  const ImageModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={imageModalVisible}
      onRequestClose={closeImageModal}
      statusBarTranslucent={true}
    >
      <View style={styles.imageModalContainer}>
        <TouchableOpacity 
          style={styles.imageModalBackdrop}
          onPress={closeImageModal}
          activeOpacity={1}
        >
          <View style={styles.imageModalContent}>
            <TouchableOpacity 
              style={styles.imageModalCloseButton}
              onPress={closeImageModal}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  const CreatePostModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={showPostModal}
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
              <ActivityIndicator size="small" color="#00ff9d" />
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
            <Feather name="image" size={20} color="#00ff9d" />
            <Text style={styles.postActionText}>Add Image</Text>
          </TouchableOpacity>
          
          <View style={styles.postPrivacyInfo}>
            <MaterialCommunityIcons name="incognito" size={16} color="#00ff9d" />
            <Text style={styles.postPrivacyText}>This post will be anonymous</Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  const CommentModal = () => {
    const [localComment, setLocalComment] = useState('');

    const handleSubmit = async () => {
      if (!localComment.trim() || !selectedPost || isCommentSubmitting) return;

      const success = await addComment(selectedPost._id, localComment);
      if (success) {
        setLocalComment('');
        // Keep the modal open and focus remains
        setTimeout(() => {
          commentInputRef.current?.focus();
        }, 100);
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
                    autoFocus={true}
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
                    returnKeyType="send"
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

  const AnonymousSection = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Anonymous Zone</Text>
        <TouchableOpacity 
          style={styles.createPostButton}
          onPress={() => setShowPostModal(true)}
        >
          <Feather name="plus" size={16} color="#F5F5F5" />
          <Text style={styles.createPostButtonText}>New Post</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionDescription}>
        Share your fitness journey anonymously. No judgments, just support.
      </Text>
      {loading.community ? (
        <ActivityIndicator size="large" color="#00ff9d" style={styles.loadingIndicator} />
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
            <Text style={styles.communitySubtitle}>Connect • Share • Grow</Text>
          </View>
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
          <AnonymousSection />
        </ScrollView>

        {/* Floating Create Post Button */}
        <TouchableOpacity 
          style={styles.floatingCreateButton}
          onPress={() => setShowPostModal(true)}
        >
          <Feather name="plus" size={24} color="#F5F5F5" />
        </TouchableOpacity>

        <CommentModal />
        <ImageModal />
        <CreatePostModal />
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
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#00ff9d',
  },
  createPostButtonText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: '600',
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
  // Improved Image Styles
  imageContainer: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  imageFooter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 255, 157, 0.05)',
  },
  imageHint: {
    color: '#00ff9d',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Image Modal Styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '95%',
    height: '80%',
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
  emptyPostsContainer: {
    backgroundColor: '#121212',
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
    backgroundColor: '#00ff9d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  emptyPostsButtonText: {
    color: '#121212',
    fontWeight: '600',
  },
  // Floating Create Button
  floatingCreateButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00ff9d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ff9d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  // Create Post Modal Styles
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  postModalTitle: {
    color: '#F5F5F5',
    fontSize: 18,
    fontWeight: '600',
  },
  postSubmitButton: {
    color: '#00ff9d',
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
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  postImagePreview: {
    width: '100%',
    height: 200,
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
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 8,
  },
  postActionText: {
    color: '#00ff9d',
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
});

export default FitStreakCommunity;