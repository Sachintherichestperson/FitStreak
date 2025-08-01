import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import messaging from "@react-native-firebase/messaging";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const FitPulseApp = () => {
  // const requestUserPermission = async () => {
  //   const authStatus = await messaging().requestPermission();
  //   const enabled =
  //     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
  //   if (enabled) {
  //     console.log('Authorization status:', authStatus);
  //   }
  // }

//   useEffect(() => {
//   const setupNotifications = async () => {
//     try {
//       const enabled = await requestUserPermission();
//       console.log(enabled)
//       if (enabled) {
//         const token = await messaging().getToken();
//         console.log('FCM Token:', token);
//       } else {
//         console.log("Permission not granted");
//       }
      
//       const initialNotification = await messaging().getInitialNotification();
//       if (initialNotification) {
//         console.log(initialNotification);
//       }
//     } catch (error) {
//       console.error('Notification setup error:', error);
//     }
//   };
  
//   setupNotifications();
// }, []);

  const router = useRouter();
  const pulseAnim = new Animated.Value(1);
  const [streak, setStreak] = useState('0');
  const [challenges, setChallenges] = useState([]);
  const [loggedDates, setLoggedDays] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [DailyQuote, setDailyQuote] = useState({
    quote: "The only bad workout is the one that didn't happen.",
    author: "Unknown"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
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

  const fetchBackendData = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.225.177:3000/Home/',{
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      setStreak(data.streak || '0');
      setLoggedDays(data.loggedDates || []);
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  }

  const BackendData = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.225.177:3000/Home/Active-Challenges', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  }

  const fetchDailyMotivation = async () => {
    try {
      const response = await fetch('https://zenquotes.io/api/today');
      const data = await response.json();
      const quote = {
        quote: data[0].q,
        author: data[0].a
      };
      setDailyQuote(quote);
    } catch (error) {
      setDailyQuote({
        quote: "The only bad workout is the one that didn't happen.",
        author: "Unknown"
      });
    }
  };

  const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        Promise.all([fetchDailyMotivation(), BackendData(), fetchBackendData()])
          .then(() => setRefreshing(false))
          .catch(() => setRefreshing(false));
      }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchBackendData(),
          BackendData(),
          fetchDailyMotivation()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const [activeStat, setActiveStat] = React.useState<'1' | '2' | '3'>('1');

  const stats = [
    { id: '1', icon: 'shoe-prints', value: '8,562', label: 'Steps', color: '#00f5ff' },
    { id: '2', icon: 'fire', value: '1,240', label: 'Calories', color: '#ff7b25' },
    { id: '3', icon: 'heartbeat', value: '72', label: 'BPM', color: '#ff4d4d' }
  ];

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const firstDayMondayBased = (firstDayOfMonth + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = [];

    for (let i = 0; i < firstDayMondayBased; i++) {
      calendarDays.push({
        day: '',
        status: 'empty',
        date: null
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const isLogged = loggedDates.includes(formattedDate);
      const isToday = date.getTime() === today.getTime();

      let status;
      if (isLogged) {
        status = 'logged';
      } else if (isToday) {
        status = 'today';
      } else if (date > today) {
        status = 'future';
      } else {
        status = 'missed';
      }

      calendarDays.push({
        day: day.toString(),
        status,
        date
      });
    }

    const totalSlots = Math.ceil(calendarDays.length / 7) * 7;
    while (calendarDays.length < totalSlots) {
      calendarDays.push({
        day: '',
        status: 'empty',
        date: null
      });
    }

    return calendarDays;
  };

  const weekdayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const calendarDays = generateCalendarDays();

  const barData = {
    '1': [
      { day: 'M', height: 100 },
      { day: 'T', height: 80 },
      { day: 'W', height: 30 },
      { day: 'T', height: 67 },
      { day: 'F', height: 60 },
      { day: 'S', height: 40 },
      { day: 'S', height: 47 }
    ],
    '2': [
      { day: 'M', height: 85 },
      { day: 'T', height: 70 },
      { day: 'W', height: 45 },
      { day: 'T', height: 90 },
      { day: 'F', height: 65 },
      { day: 'S', height: 30 },
      { day: 'S', height: 55 }
    ],
    '3': [
      { day: 'M', height: 72 },
      { day: 'T', height: 68 },
      { day: 'W', height: 75 },
      { day: 'T', height: 70 },
      { day: 'F', height: 65 },
      { day: 'S', height: 78 },
      { day: 'S', height: 72 }
    ]
  };

  const chartTitles = {
    '1': 'Steps This Week',
    '2': 'Calories Burned',
    '3': 'Heart Rate (BPM)'
  };

  const renderStatCard = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.statCard, 
        activeStat === item.id && { 
          borderColor: item.color, 
          shadowColor: item.color
        }
      ]}
      onPress={() => setActiveStat(item.id)}
    >
      <View style={[styles.statIcon, { backgroundColor: `${item.color}20` }]}>
        <FontAwesome5 name={item.icon} size={18} color={item.color} />
      </View>
      <Text style={styles.statValue}>{item.value}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderChallenge = ({ item }) => (
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
          <View style={[styles.progressIndicator, { left: `${item.progress}%` }]}>
            <View style={styles.progressIndicatorInner} />
          </View>
        </View>
        
        <View style={styles.progressMarkers}>
          <Text style={styles.markerText}>0%</Text>
          <Text style={styles.markerText}>100%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCalendarDay = ({ item, index }) => {
    if (item.status === 'empty') {
      return <View style={[styles.calendarDay, styles.emptyDay]} key={index} />;
    }
    
    return (
      <View 
        style={[
          styles.calendarDay,
          item.status === 'logged' && styles.loggedDay,
          item.status === 'missed' && styles.missedDay,
          item.status === 'today' && styles.todayDay,
          item.status === 'future' && styles.futureDay
        ]}
        key={index}
      >
        <Text style={styles.calendarDayText}>{item.day}</Text>
        {item.status === 'logged' && (
          <Text style={[styles.calendarDayIndicator, { color: '#00ff9d' }]}>✓</Text>
        )}
        {item.status === 'missed' && (
          <Text style={[styles.calendarDayIndicator, { color: '#ff4d4d' }]}>✕</Text>
        )}
      </View>
    );
  };

  const renderBar = ({ item }) => (
    <View style={styles.cylinderDay}>
      <View style={[styles.cylinderBar, { 
        height: `${item.height}%`, 
        backgroundColor: stats.find(s => s.id === activeStat)?.color || '#00f5ff'
      }]} />
      <Text style={styles.cylinderDayLabel}>{item.day}</Text>
    </View>
  );

  const getMonthName = () => {
    return currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const changeMonth = (increment) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + increment);
      return newMonth;
    });
  };

  // Skeleton Loading Components
  const SkeletonStatCard = () => (
    <View style={[styles.statCard, styles.skeletonCard]}>
      <View style={[styles.statIcon, styles.skeletonIcon]} />
      <View style={[styles.skeletonText, { width: '60%', height: 20, marginBottom: 8 }]} />
      <View style={[styles.skeletonText, { width: '40%', height: 14 }]} />
    </View>
  );

  const SkeletonChallengeCard = () => (
    <View style={[styles.challengeCard, styles.skeletonCard]}>
      <View style={[styles.skeletonText, { width: '80%', height: 18, marginBottom: 15 }]} />
      <View style={[styles.skeletonText, { width: '60%', height: 12, marginBottom: 20 }]} />
      <View style={[styles.skeletonText, { width: '100%', height: 6, marginBottom: 5 }]} />
      <View style={styles.skeletonProgressBar} />
    </View>
  );

  const SkeletonCalendarDay = () => (
    <View style={[styles.calendarDay, styles.skeletonCalendarDay]} />
  );

  const SkeletonBar = () => (
    <View style={styles.cylinderDay}>
      <View style={[styles.cylinderBar, styles.skeletonBar]} />
      <View style={[styles.skeletonText, { width: '100%', height: 10 }]} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0a0a', '#121212']}
          style={StyleSheet.absoluteFill}
        />
        
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header Skeleton */}
          <View style={styles.header}>
            <View>
              <View style={[styles.skeletonText, { width: 150, height: 24, marginBottom: 5 }]} />
              <View style={[styles.skeletonText, { width: 180, height: 14 }]} />
            </View>
            <View style={styles.headerIcons}>
              <View style={[styles.avatar, styles.skeletonAvatar]} />
              <View style={[styles.avatar, styles.skeletonAvatar]} />
              <View style={[styles.heartIcon, styles.skeletonAvatar]} />
            </View>
          </View>

          {/* Streak Header Skeleton */}
          <View style={[styles.streakHeader, styles.skeletonCard]}>
            <View style={styles.streakInfo}>
              <View style={[styles.skeletonText, { width: 40, height: 24 }]} />
              <View style={[styles.skeletonText, { width: 80, height: 14 }]} />
            </View>
            <View style={[styles.streakBadge, styles.skeletonBadge]} />
          </View>

          {/* Stats Cards Skeleton */}
          <FlatList
            data={[1, 2, 3]}
            renderItem={() => <SkeletonStatCard />}
            keyExtractor={(item) => item.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}
          />

          {/* Bar Chart Skeleton */}
          <View style={[styles.barChartContainer, styles.skeletonCard]}>
            <View style={styles.chartHeader}>
              <View style={[styles.skeletonText, { width: 120, height: 16 }]} />
              <View style={[styles.skeletonText, { width: 80, height: 12 }]} />
            </View>
            <View style={styles.cylinderContainer}>
              <FlatList
                data={[1, 2, 3, 4, 5, 6, 7]}
                renderItem={() => <SkeletonBar />}
                keyExtractor={(item) => item.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.barList}
              />
            </View>
          </View>

          {/* Challenges Skeleton */}
          <View style={[styles.skeletonText, { width: 120, height: 16, marginBottom: 15 }]} />
          <FlatList
            data={[1, 2]}
            renderItem={() => <SkeletonChallengeCard />}
            keyExtractor={(item) => item.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.challengesContainer}
          />

          {/* Calendar Skeleton */}
          <View style={[styles.MajorCalendar, styles.skeletonCard]}>
            <View style={styles.calendarHeader}>
              <View style={[styles.skeletonText, { width: 120, height: 16 }]} />
              <View style={styles.monthNavigation}>
                <View style={[styles.skeletonText, { width: 20, height: 20 }]} />
                <View style={[styles.skeletonText, { width: 100, height: 16, marginHorizontal: 10 }]} />
                <View style={[styles.skeletonText, { width: 20, height: 20 }]} />
              </View>
            </View>
            
            <View style={styles.streakCountContainer}>
              <View style={[styles.skeletonText, { width: 16, height: 16 }]} />
              <View style={[styles.skeletonText, { width: 80, height: 16 }]} />
            </View>
          
            <View style={styles.calendarWeekHeader}>
              {weekdayHeaders.map((_, i) => (
                <View key={`weekday-${i}`} style={[styles.skeletonText, { width: (width - 90) / 7, height: 12 }]} />
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {Array.from({ length: 42 }).map((_, i) => (
                <SkeletonCalendarDay key={`skeleton-day-${i}`} />
              ))}
            </View>
          </View>

          {/* Motivation Skeleton */}
          <View style={[styles.motivationContainer, styles.skeletonCard]}>
            <View style={styles.motivationTitle}>
              <View style={[styles.skeletonText, { width: 14, height: 14 }]} />
              <View style={[styles.skeletonText, { width: 100, height: 14 }]} />
            </View>
            <View style={[styles.skeletonText, { width: '100%', height: 18, marginBottom: 15,  }]} />
            <View style={[styles.skeletonText, { width: 120, height: 14, alignSelf: 'flex-end' }]} />
          </View>
        </ScrollView>

        {/* Log Workout Button (still visible during loading) */}
        <Animated.View style={[styles.logWorkoutButton, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity onPress={() => router.push('/Scanner')}>
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>
        </Animated.View>
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
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Alex :- Badge</Text>
            <Text style={styles.subGreeting}>Ready for today's workout?</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.avatar} onPress={() => router.push('/Profile')}>
              <FontAwesome name="user" size={20} color="#f0f0f0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={() => router.push('/Songs')}>
              <FontAwesome name="music" size={20} color="#f0f0f0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heartIcon} onPress={() => router.push('/Notification')}>
              <FontAwesome name="heart" size={20} color="#f0f0f0" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Streak Header */}
        <View style={styles.streakHeader}>
          <View style={styles.streakInfo}>
            <Text style={styles.streakCount}>{streak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          <View style={styles.streakBadge}>
            <FontAwesome name="trophy" size={14} color="#00ff9d" />
            <Text style={styles.streakBadgeText}>Consistent</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <FlatList
          data={stats}
          renderItem={renderStatCard}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        />

        {/* Bar Chart */}
        <View style={styles.barChartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{chartTitles[activeStat]}</Text>
            <Text style={styles.chartPeriod}>Jul 16-22</Text>
          </View>
          <View style={styles.cylinderContainer}>
            <FlatList
              data={barData[activeStat]}
              renderItem={renderBar}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.barList}
            />
          </View>
        </View>

        {/* Challenges */}
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
        />

        {/* Calendar */}
        <View style={styles.MajorCalendar}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>Activity Calendar</Text>
            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <View style={[{ width: 20, height: 30, display: 'flex', justifyContent: 'center', alignItems: 'center'  }]}>
                  <FontAwesome name="chevron-left" size={18} color="#00f5ff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.monthText}>{getMonthName()}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <View style={[{ width: 20, height: 30, display: 'flex', justifyContent: 'center', alignItems: 'center'  }]}>
                  <FontAwesome name="chevron-right" size={18} color="#00f5ff" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.streakCountContainer}>
            <FontAwesome name="fire" size={16} color="#00ff9d" />
            <Text style={styles.streakCountText}>{streak}-Day Streak</Text>
          </View>
        
          <View style={styles.calendarWeekHeader}>
            {weekdayHeaders.map((day, i) => (
              <Text key={`weekday-${i}`} style={styles.calendarWeekDay}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.calendarWeek}>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const item = calendarDays[weekIndex * 7 + dayIndex];
                  return item ? (
                    <View key={`day-${weekIndex}-${dayIndex}`}>
                      {renderCalendarDay({ item, index: weekIndex * 7 + dayIndex })}
                    </View>
                  ) : null;
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Motivation */}
        <View style={styles.motivationContainer}>
          <View style={styles.motivationTitle}>
            <FontAwesome name="quote-left" size={14} color="#00f5ff" />
            <Text style={styles.motivationTitleText}> Daily Motivation</Text>
          </View>
          <Text style={styles.motivationQuote}>
            {DailyQuote.quote}
          </Text>
          <Text style={styles.motivationAuthor}>{DailyQuote.author}</Text>
        </View>
      </ScrollView>

      {/* Log Workout Button */}
      <Animated.View style={[styles.logWorkoutButton, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity onPress={() => router.push('/Scanner')}>
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </Animated.View>
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
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
    marginRight: 15,
  },
  heartIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  streakHeader: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00ff9d',
  },
  streakLabel: {
    fontSize: 14,
    color: '#777',
  },
  streakBadge: {
    backgroundColor: 'rgba(0,255,157,0.08)',
    borderWidth: 1,
    borderColor: '#00ff9d',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00ff9d',
  },
  statsContainer: {
    gap: 10,
    marginBottom: 15,
  },
  statCard: {
    width: (width - 70) / 3,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    height: 120,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
  },
  barChartContainer: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
    height: 250,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  chartPeriod: {
    fontSize: 12,
    color: '#777',
  },
  cylinderContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  barList: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cylinderDay: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 24,
    height: 150,
    justifyContent: 'flex-end',
  },
  cylinderBar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  cylinderDayLabel: {
    fontSize: 10,
    marginTop: 8,
    color: '#777',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
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
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressIndicator: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -6 }],
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  progressIndicatorInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00f5ff',
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
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  monthText: {
    fontSize: 16,
    color: '#ffffff',
    marginHorizontal: 10,
  },
  streakCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 15,
  },
  streakCountText: {
    fontSize: 16,
    color: '#00ff9d',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  calendarWeekDay: {
    width: (width - 90) / 7,
    textAlign: 'center',
    fontSize: 12,
    color: '#777',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: (width - 90) / 7,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 8,
    position: 'relative',
  },
  emptyDay: {
    opacity: 0,
  },
  loggedDay: {
    backgroundColor: 'rgba(0,255,157,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,157,0.15)',
  },
  missedDay: {
    backgroundColor: 'rgba(255,77,77,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.15)',
  },
  todayDay: {
    backgroundColor: 'rgba(0,245,255,0.08)',
    borderWidth: 1,
    borderColor: '#00f5ff',
    fontWeight: '700',
  },
  futureDay: {
    opacity: 0.5,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f0f0f0',
  },
  calendarDayIndicator: {
    position: 'absolute',
    top: 3,
    right: 3,
    fontSize: 10,
  },
  motivationContainer: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 0,
  },
  motivationTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  motivationTitleText: {
    fontSize: 14,
    color: '#00f5ff',
  },
  motivationQuote: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    lineHeight: 25,
    color: '#ffffff',
  },
  motivationAuthor: {
    fontSize: 14,
    color: '#777',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  logWorkoutButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff7b25',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff7b25',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 10,
    zIndex: 100,
  },
  // Skeleton Loading Styles
  skeletonCard: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  skeletonIcon: {
    backgroundColor: '#1a1a1a',
  },
  skeletonText: {
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
  },
  skeletonAvatar: {
    backgroundColor: '#1a1a1a',
  },
  skeletonBadge: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  skeletonProgressBar: {
    height: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    marginBottom: 5,
  },
  skeletonCalendarDay: {
    backgroundColor: '#1a1a1a',
  },
  skeletonBar: {
    backgroundColor: '#1a1a1a',
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
    width: 150,
    textAlign: 'center',
  },
});

export default FitPulseApp;