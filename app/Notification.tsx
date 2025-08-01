import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  FlatList,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const notifications = [
  {
    id: '1',
    type: 'reaction',
    icon: 'thumbs-up',
    title: 'Ayush reacted 💪 on your Anonymous Post',
    time: '2 hours ago',
    unread: true,
    actions: []
  },
  {
    id: '2',
    type: 'vote',
    icon: 'poll',
    title: '80% voted that you won\'t complete 30-Day Abs Challenge',
    time: '5 hours ago',
    unread: false,
    actions: ['Prove Them Wrong', 'View Details']
  },
  {
    id: '3',
    type: 'challenge',
    icon: 'trophy',
    title: 'Challenge completed! Check your results for 7-Day Cardio Blast',
    time: '1 day ago',
    unread: false,
    actions: ['See Results']
  },
  {
    id: '4',
    type: 'win',
    icon: 'medal',
    title: 'You won! You beat 92% of participants in Plank Challenge',
    time: '2 days ago',
    unread: false,
    actions: ['Claim Reward', 'Share']
  },
  {
    id: '5',
    type: 'team',
    icon: 'users',
    title: 'Your team is performing in top 3! Keep up the good work in Team FitSquad',
    time: '3 days ago',
    unread: false,
    actions: ['View Leaderboard']
  },
  {
    id: '6',
    type: 'challenge',
    icon: 'bolt',
    title: 'New challenge available: 14-Day HIIT Burner starts tomorrow',
    time: '1 week ago',
    unread: false,
    actions: ['Join Now']
  },
  {
    id: '7',
    type: 'reaction',
    icon: 'user-plus',
    title: 'Sarah joined FitPulse! Welcome them to the community',
    time: '1 week ago',
    unread: false,
    actions: ['Say Hi']
  },
  {
    id: '8',
    type: 'achievement',
    icon: 'star',
    title: 'New achievement unlocked: Marathon Runner!',
    time: '2 weeks ago',
    unread: false,
    actions: ['View Badge']
  }
];

export const options = {
  headerShown: false,
};
const NotificationItem = ({ item, index }) => {
  const scaleValue = new Animated.Value(1);
  
  const getIconColor = () => {
    switch(item.type) {
      case 'reaction': return '#00f5ff';
      case 'challenge': return '#00ff9d';
      case 'vote': return '#ff7b25';
      case 'win': return 'gold';
      case 'team': return '#8a2be2';
      case 'achievement': return '#ffd700';
      default: return '#00f5ff';
    }
  };
  
  const getBackgroundColor = () => {
    switch(item.type) {
      case 'reaction': return 'rgba(0, 245, 255, 0.08)';
      case 'challenge': return 'rgba(0, 255, 157, 0.08)';
      case 'vote': return 'rgba(255, 123, 37, 0.08)';
      case 'win': return 'rgba(255, 215, 0, 0.08)';
      case 'team': return 'rgba(138, 43, 226, 0.08)';
      case 'achievement': return 'rgba(255, 215, 0, 0.08)';
      default: return 'rgba(0, 245, 255, 0.08)';
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true
    }).start();
  };

  return (
    <Animated.View 
      style={[
        styles.notificationItem,
        { transform: [{ scale: scaleValue }] }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.notificationIcon, { backgroundColor: getBackgroundColor() }]}>
            <FontAwesome name={item.icon} size={16} color={getIconColor()} />
          </View>
          
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>
              {item.title.split(' ').map((word, i) => 
                word.startsWith('Anonymous') || word.startsWith('30-Day') || word.startsWith('7-Day') || 
                word.startsWith('Plank') || word.startsWith('Team') || word.startsWith('14-Day') ||
                word.startsWith('Marathon') ? (
                  <Text key={i} style={{ color: '#fff', fontWeight: '600' }}>{word} </Text>
                ) : (
                  <Text key={i}>{word} </Text>
                )
              )}
            </Text>
            <Text style={styles.notificationTime}>{item.time}</Text>
            
            {item.actions.length > 0 && (
              <View style={styles.actionButtons}>
                {item.actions.map((action, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={[
                      styles.actionButton,
                      i === 0 ? styles.primaryButton : styles.secondaryButton
                    ]}
                  >
                    <Text style={[
                      styles.buttonText,
                      i === 0 ? styles.primaryButtonText : styles.secondaryButtonText
                    ]}>
                      {action}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          {item.unread && <View style={styles.unreadBadge} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function NotificationsScreen() {
  
  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>You have 2 new notifications</Text>
      </View>
      <TouchableOpacity style={styles.avatarContainer}>
        <Image 
          source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} 
          style={styles.avatar}
        />
        {true && <View style={styles.avatarBadge} />}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#0a0a0a', '#121212']}
        style={styles.background}
      />
      
      {/* Header */}
      {renderHeader()}
      
      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={({ item, index }) => <NotificationItem item={item} index={index} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.notificationsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
    backgroundColor: '#0a0a0a',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#777',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00ff9d',
    borderWidth: 2,
    borderColor: '#0a0a0a',
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  segmentText: {
    color: '#777',
    fontWeight: '600',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  notificationItem: {
    backgroundColor: '#121212',
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
    position: 'relative',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: '#f0f0f0',
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#777',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  primaryButton: {
    backgroundColor: '#00ff9d',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#777',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#000',
  },
  secondaryButtonText: {
    color: '#f0f0f0',
  },
  unreadBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff9d',
  },
});