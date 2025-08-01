import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Dimensions,
  Animated,
  Easing,
  Platform,
  TextInput
} from 'react-native';
import Slider from '@react-native-assets/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons, FontAwesome, Ionicons, Feather, AntDesign } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

const MusicPlayerPanel = () => {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sound, setSound] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const progressInterval = useRef<number | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  // Animation for album art rotation
  useEffect(() => {
    if (isPlaying) {
      startRotation();
    } else {
      stopRotation();
    }
  }, [isPlaying]);

  const startRotation = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  };

  const stopRotation = () => {
    spinValue.stopAnimation();
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Sample workout tracks
  const tracks = [
    {
      id: '1',
      title: 'Power Up',
      artist: 'Energy Boost',
      duration: '3:45',
      cover: require('./music-covers/images.jpeg'),
      uri: 'https://example.com/track1.mp3'
    },
    {
      id: '2',
      title: 'Run Faster',
      artist: 'Cardio Beats',
      duration: '4:12',
      cover: require('./music-covers/images.jpeg'),
      uri: 'https://example.com/track2.mp3'
    },
    {
      id: '3',
      title: 'Lift Heavy',
      artist: 'Gym Motivation',
      duration: '3:28',
      cover: require('./music-covers/images.jpeg'),
      uri: 'https://example.com/track3.mp3'
    },
    {
      id: '4',
      title: 'Endurance',
      artist: 'Long Run Mix',
      duration: '5:20',
      cover: require('./music-covers/images.jpeg'),
      uri: 'https://example.com/track4.mp3'
    },
    {
      id: '5',
      title: 'HIIT Blast',
      artist: 'Interval Training',
      duration: '3:15',
      cover: require('./music-covers/images.jpeg'),
      uri: 'https://example.com/track5.mp3'
    },
  ];

  const playlists = [
    {
      id: 'p1',
      title: 'Cardio Boost',
      description: 'High energy tracks for your run',
      cover: require('./music-covers/images.jpeg'),
      color1: '#ff7b25',
      color2: '#ff4d4d'
    },
    {
      id: 'p2',
      title: 'Strength Training',
      description: 'Powerful beats for lifting',
      cover: require('./music-covers/images.jpeg'),
      color1: '#00f5ff',
      color2: '#00ff9d'
    },
    {
      id: 'p3',
      title: 'Yoga Flow',
      description: 'Calming melodies for yoga',
      cover: require('./music-covers/images.jpeg'),
      color1: '#9d50bb',
      color2: '#6e48aa'
    },
    {
      id: 'p4',
      title: 'HIIT Mix',
      description: 'Intense intervals for HIIT',
      cover: require('./music-covers/images.jpeg'),
      color1: '#f857a6',
      color2: '#ff5858'
    }
  ];

  const playTrack = async (index) => {
    try {
      // Stop currently playing track if any
      if (sound) {
        if (progressInterval.current !== null) {
          clearInterval(progressInterval.current);
        }
        await sound.unloadAsync();
      }

      // Load new track
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: tracks[index].uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      setCurrentTrackIndex(index);
      
      // Start progress tracking
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval.current);
            handleNext();
            return 0;
          }
          return prev + 0.5;
        });
      }, 1000);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          handleNext();
        }
      });
      
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) {
      playTrack(currentTrackIndex);
      return;
    }

    if (isPlaying) {
      await sound.pauseAsync();
      clearInterval(progressInterval.current);
    } else {
      await sound.playAsync();
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval.current);
            handleNext();
            return 0;
          }
          return prev + 0.5;
        });
      }, 1000);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(prevIndex);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentDuration = (progress / 100) * (3 * 60); // Assuming 3 min track for demo

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#121212', '#000000']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-down" size={28} color="#f0f0f0" />
        </TouchableOpacity>
        
        {!showSearch ? (
          <Text style={styles.headerTitle}>Workout Music</Text>
        ) : (
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs..."
            placeholderTextColor="#b3b3b3"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
        )}
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.searchButton}>
            <Ionicons name={showSearch ? "close" : "search"} size={24} color="#f0f0f0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}>
            <Feather name="more-horizontal" size={24} color="#f0f0f0" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Album Art with Animation */}
        <View style={styles.albumArtContainer}>
          <Animated.Image 
            source={tracks[currentTrackIndex].cover} 
            style={[
              styles.albumArt, 
              { transform: [{ rotate: spin }] }
            ]}
          />
        </View>
        
        {/* Track Info */}
        <View style={styles.trackInfoContainer}>
          <View style={styles.trackTitleRow}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {tracks[currentTrackIndex].title}
            </Text>
            <TouchableOpacity onPress={() => setIsLiked(!isLiked)}>
              <AntDesign 
                name={isLiked ? "heart" : "hearto"} 
                size={20} 
                color={isLiked ? "#1DB954" : "#b3b3b3"} 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.trackArtist}>{tracks[currentTrackIndex].artist}</Text>
        </View>
        
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.progressBar}
            value={progress}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor="#1DB954"
            maximumTrackTintColor="#535353"
            thumbTintColor="#1DB954"
            thumbSize={12}
            trackHeight={3}
            onSlidingComplete={(value) => {
              setProgress(value);
              if (sound) {
                const position = (value / 100) * (3 * 60 * 1000);
                sound.setPositionAsync(position);
              }
            }}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentDuration)}</Text>
            <Text style={styles.timeText}>{tracks[currentTrackIndex].duration}</Text>
          </View>
        </View>
        
        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <Feather name="shuffle" size={24} color="#b3b3b3" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handlePrevious} style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={28} color="#f0f0f0" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={togglePlayPause} 
            style={styles.playButton}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={36} 
              color="#121212" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleNext} style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={28} color="#f0f0f0" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Feather name="repeat" size={24} color="#b3b3b3" />
          </TouchableOpacity>
        </View>

        {/* Device and Queue Options */}
        <View style={styles.optionsRow}>
          <TouchableOpacity style={styles.optionButton}>
            <MaterialIcons name="devices" size={20} color="#b3b3b3" />
            <Text style={styles.optionText}>Devices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton}>
            <MaterialIcons name="queue-music" size={20} color="#b3b3b3" />
            <Text style={styles.optionText}>Queue</Text>
          </TouchableOpacity>
        </View>

        {/* Playlists Section */}
        <Text style={styles.sectionTitle}>Made For You</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {playlists.map((playlist) => (
            <TouchableOpacity 
              key={playlist.id} 
              style={styles.playlistCard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[playlist.color1, playlist.color2]}
                style={styles.playlistGradient}
              >
                <Image 
                  source={playlist.cover} 
                  style={styles.playlistImage}
                  blurRadius={10}
                />
                <View style={styles.playlistOverlay}>
                  <Text style={styles.playlistTitle}>{playlist.title}</Text>
                  <Text style={styles.playlistDescription}>{playlist.description}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recently Played */}
        <Text style={styles.sectionTitle}>Recently Played</Text>
        <View style={styles.tracksList}>
          {tracks.slice(0, 3).map((track, index) => (
            <TouchableOpacity 
              key={track.id} 
              style={styles.trackItem}
              onPress={() => playTrack(index)}
              activeOpacity={0.7}
            >
              <Image source={track.cover} style={styles.trackCover} />
              <View style={styles.trackInfo}>
                <Text 
                  style={[
                    styles.trackName,
                    currentTrackIndex === index && styles.activeTrack
                  ]}
                  numberOfLines={1}
                >
                  {track.title}
                </Text>
                <Text style={styles.trackArtistSmall}>{track.artist}</Text>
              </View>
              <Text style={styles.trackDuration}>{track.duration}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recommended Tracks */}
        <Text style={styles.sectionTitle}>Recommended For You</Text>
        <View style={styles.tracksList}>
          {tracks.map((track, index) => (
            <TouchableOpacity 
              key={track.id} 
              style={styles.trackItem}
              onPress={() => playTrack(index)}
              activeOpacity={0.7}
            >
              <Image source={track.cover} style={styles.trackCover} />
              <View style={styles.trackInfo}>
                <Text 
                  style={[
                    styles.trackName,
                    currentTrackIndex === index && styles.activeTrack
                  ]}
                  numberOfLines={1}
                >
                  {track.title}
                </Text>
                <Text style={styles.trackArtistSmall}>{track.artist}</Text>
              </View>
              <Text style={styles.trackDuration}>{track.duration}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Mini Player (shown when navigating away) */}
      {isPlaying && (
        <TouchableOpacity 
          style={styles.miniPlayer}
          onPress={() => router.push('/MusicPlayerFull')}
          activeOpacity={0.9}
        >
          <Image source={tracks[currentTrackIndex].cover} style={styles.miniCover} />
          <View style={styles.miniPlayerInfo}>
            <Text 
              style={styles.miniTrackTitle}
              numberOfLines={1}
            >
              {tracks[currentTrackIndex].title}
            </Text>
            <Text 
              style={styles.miniTrackArtist}
              numberOfLines={1}
            >
              {tracks[currentTrackIndex].artist}
            </Text>
          </View>
          <View style={styles.miniPlayerControls}>
            <TouchableOpacity onPress={togglePlayPause} style={styles.miniPlayButton}>
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={20} 
                color="#f0f0f0" 
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Feather name="more-horizontal" size={20} color="#b3b3b3" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 8,
    marginRight: 8,
  },
  menuButton: {
    padding: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nowPlayingSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  albumArtContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  albumArt: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.75 / 2,
    backgroundColor: '#333',
  },
  trackInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 10,
    textAlign: 'center',
    maxWidth: '80%',
  },
  trackArtist: {
    fontSize: 16,
    color: '#b3b3b3',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  timeText: {
    fontSize: 12,
    color: '#b3b3b3',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    backgroundColor: '#1DB954',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  optionText: {
    fontSize: 12,
    color: '#b3b3b3',
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 20,
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingBottom: 5,
  },
  playlistCard: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 10,
    marginRight: 15,
    overflow: 'hidden',
  },
  playlistGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  playlistImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  playlistOverlay: {
    padding: 15,
  },
  playlistTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 5,
  },
  playlistDescription: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  tracksList: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8,
  },
  trackCover: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 15,
    backgroundColor: '#333',
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 3,
  },
  activeTrack: {
    color: '#1DB954',
  },
  trackArtistSmall: {
    fontSize: 13,
    color: '#b3b3b3',
  },
  trackDuration: {
    fontSize: 13,
    color: '#b3b3b3',
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#282828',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  miniCover: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 15,
  },
  miniPlayerInfo: {
    flex: 1,
    marginRight: 15,
  },
  miniTrackTitle: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 3,
  },
  miniTrackArtist: {
    fontSize: 12,
    color: '#b3b3b3',
  },
  miniPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPlayButton: {
    padding: 10,
    marginRight: 10,
  },
});

export default MusicPlayerPanel;