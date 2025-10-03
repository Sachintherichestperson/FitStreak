import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,  
  }),
});

const { width } = Dimensions.get('window');

const FitPulseApp = () => {
  const router = useRouter();
  const pulseAnim = new Animated.Value(1);
  const [User, setUser] = useState<{ username?: string } | null>(null);
  const [streak, setStreak] = useState('0');
  const [challenges, setChallenges] = useState([]);
  const [loggedDates, setLoggedDays] = useState<string[]>([]);
  const [Status, setStatus] = useState< string | null>(null);
  const [FitCoins, SetFitCoins] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [DailyQuote, setDailyQuote] = useState({
    quote: "The only bad workout is the one that didn't happen.",
    author: "Unknown"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayPlan, setTodayPlan] = useState<{
  workout: {
    title: string;
    exerciseCount: number;
    totalTime: number;
    targetTime: string;
  } | null;
  diet: {
    description: string;
    calories: number;
    protein: number;
    targetTime: string;
  } | null;
}>({ workout: null, diet: null });

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

  const registerForPushNotificationsAsync = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Get the Expo push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    // Save the token to your backend (uncomment your existing code)
    let userToken = await AsyncStorage.getItem('Token');
    let retries = 0;
    const maxRetries = 10;
    
    while (!userToken && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 500));
      userToken = await AsyncStorage.getItem('Token');
      retries++;
    }
    
    if (userToken) {
      try {
        await fetch('http://192.168.141.177:3000/Home/save-push-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            expoPushToken: token,
          }),
        });
      } catch (error) {
        console.error('Error sending push token to server:', error);
      }
    }

    // Android-specific configuration
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
  }
};

const fetchTodayPlan = async () => {
  try {
    const token = await AsyncStorage.getItem('Token');
    const response = await fetch('http://192.168.141.177:3000/Home/plan', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    
    if (data.success) {
      setTodayPlan({
        workout: data.workout,
        diet: data.diet
      });
    }
  } catch (error) {
    console.error('Error fetching today\'s plan:', error);
  }
}

  const fetchBackendData = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.141.177:3000/Home/',{
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      setStreak(data.streak || '0');
      setUser(data.user)
      setLoggedDays(data.loggedDates || []);
      setStatus(data.Status.name || "The Ant");
      SetFitCoins(data.FitCoins);
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  }

  const BackendData = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const response = await fetch('http://192.168.141.177:3000/Home/Active-Challenges', {
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
        quote: "Success Don't care wheather it's cold o hot, wheather you Are sick or fit. It only care about wheather you worked for it or not.",
        author: "Sachin Bajaj - FitStreak Founder"
      });
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchDailyMotivation(), BackendData(), fetchBackendData(), fetchTodayPlan()])
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
          fetchDailyMotivation(),
          fetchTodayPlan()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();

    registerForPushNotificationsAsync();

    return () => {
    };
  }, []);

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

  const renderCalendarDay = ({ item, index }: { item: any; index: number }) => {
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

          {/* Today's Plan Skeleton */}
          <Text style={styles.sectionTitle}>Today's Plan</Text>
          <View style={styles.todayPlanContainer}>
            <View style={[styles.planCard, styles.skeletonCard]}>
              <View style={[styles.skeletonText, { width: 100, height: 18, marginBottom: 10 }]} />
              <View style={[styles.skeletonText, { width: '80%', height: 14, marginBottom: 5 }]} />
              <View style={[styles.skeletonText, { width: '70%', height: 14, marginBottom: 5 }]} />
              <View style={[styles.skeletonText, { width: '60%', height: 14 }]} />
            </View>
            <View style={[styles.planCard, styles.skeletonCard]}>
              <View style={[styles.skeletonText, { width: 100, height: 18, marginBottom: 10 }]} />
              <View style={[styles.skeletonText, { width: '80%', height: 14, marginBottom: 5 }]} />
              <View style={[styles.skeletonText, { width: '70%', height: 14, marginBottom: 5 }]} />
              <View style={[styles.skeletonText, { width: '60%', height: 14 }]} />
            </View>
          </View>

          {/* Challenges Skeleton */}
          <Text style={styles.sectionTitle}>Active Challenges</Text>
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
            <Text style={styles.greeting}>{User?.username ?? ''}</Text>
            <Text style={styles.subGreeting}>Ready for today&apos;s workout?</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.avatar} onPress={() => router.push('/Profile')}>
              <FontAwesome name="user" size={20} color="#f0f0f0" />
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
            <Text style={styles.streakBadgeText}>{Status}</Text>
          </View>
        </View>

        {/* Today's Plan */}
<Text style={styles.sectionTitle}>Today&apos;s Plan</Text>
<View style={styles.todayPlanContainer}>
  <TouchableOpacity 
    style={styles.planCard}
    onPress={() => router.push('/Workout')}
  >
    <View style={styles.planHeader}>
      <FontAwesome5 name="dumbbell" size={20} color="#00f5ff" />
      <Text style={styles.planTitle}>Workout</Text>
    </View>
    <Text style={styles.planDescription}>
      {todayPlan.workout ? todayPlan.workout.title : "No workout scheduled"}
    </Text>
    <Text style={styles.planDetail}>
      {todayPlan.workout 
        ? `${todayPlan.workout.exerciseCount} exercises • ${todayPlan.workout.totalTime} mins`
        : "Add your workout plan"
      }
    </Text>
    <Text style={styles.planTime}>
      {todayPlan.workout ? todayPlan.workout.targetTime : "Schedule workout"}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity 
    style={styles.planCard}
    onPress={() => router.push('/Diet')}
  >
    <View style={styles.planHeader}>
      <FontAwesome5 name="utensils" size={18} color="#00ff9d" />
      <Text style={styles.planTitle}>Diet</Text>
    </View>
    <Text style={styles.planDescription}>
      {todayPlan.diet ? todayPlan.diet.description : "No diet plan"}
    </Text>
    <Text style={styles.planDetail}>
      {todayPlan.diet 
        ? `${todayPlan.diet.calories} calories • ${todayPlan.diet.protein}g protein`
        : "Set up your diet plan"
      }
    </Text>
    <Text style={styles.planTime}>
      {todayPlan.diet ? todayPlan.diet.targetTime : "Plan your meals"}
    </Text>
  </TouchableOpacity>
</View>

        <View style={styles.streakHeader}>
          <View style={styles.streakInfo}>
            <Text style={styles.streakCount}>{FitCoins}</Text>
            <Text style={styles.streakLabel}>FitCoins</Text>
          </View>
          {/* <View style={styles.streakBadge}>
            <FontAwesome name="trophy" size={14} color="#00ff9d" />
            <Text style={styles.streakBadgeText}>Badge</Text>
          </View> */}
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
  todayPlanContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    minHeight: 140,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  planDescription: {
    fontSize: 14,
    color: '#f0f0f0',
    marginBottom: 5,
  },
  planDetail: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
  },
  planTime: {
    fontSize: 12,
    color: '#00f5ff',
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
  emptyText: {
    color: '#777',
    fontSize: 14,
    width: 150,
    textAlign: 'center',
  },
});

export default FitPulseApp;