import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import mime from 'mime';
import { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ChallengeProofSubmission = () => {
  const router = useRouter();
  const { challengeId } = useLocalSearchParams();
  const [challenge, setChallenge] = useState(null);
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [proofStatus, setProofStatus] = useState('To-be-submitted');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchChallengeDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('Token');
        const response = await fetch(`http://192.168.225.177:3000/Challenges/${challengeId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setChallenge(data.challenge);
      } catch (error) {
        console.error('Error fetching challenge:', error);
        Alert.alert('Error', 'Failed to load challenge details');
      }
    };

    fetchChallengeDetails();
  }, [challengeId]);

  useEffect(() => {
    const fetchProofStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('Token');
        const response = await fetch(`http://192.168.225.177:3000/Challenges/Proof-Status/${challengeId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        
        setProofStatus(data.status);
      } catch (error) {
        console.error('Error fetching proof status:', error);
        setProofStatus('To-be-submitted');
      }
    };

    fetchProofStatus();
  }, [challengeId, isSubmitting]);

  const captureMedia = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera permission to capture media');
      return;
    }

    const mediaType = challenge.ProofType === 'Image' 
      ? ImagePicker.MediaTypeOptions.Images 
      : ImagePicker.MediaTypeOptions.Videos;

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: mediaType,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
    });

    if (!result.canceled) {
      setMedia(result.assets[0]);
    }
  };

  const submitProof = async () => {
    if (!media && challenge.Challenge_Type === 'Proof') {
      Alert.alert('Proof required', 'Please provide proof for this challenge');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('Token');

      const formData = new FormData();
      
      const newImageUri = Platform.OS === 'ios' ? media.uri.replace('file://', '') : media.uri;
      
      formData.append('proofData', {
        uri: newImageUri,
        type: mime.getType(newImageUri),
        name: newImageUri.split('/').pop()
      });
      
      formData.append('challengeId', challengeId);
      formData.append('submissionDate', new Date().toISOString());

      const response = await fetch('http://192.168.225.177:3000/Challenges/submit-proof', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIsSubmitting(!isSubmitting); // Toggle to trigger status refresh
      Alert.alert('Success', 'Proof submitted successfully!');
      setMedia(null);
    } catch (error) {
      console.error('Error submitting proof:', error);
      Alert.alert('Error', 'Failed to submit proof. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStatusMessage = () => {
    switch (proofStatus) {
      case 'Pending':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="time" size={60} color="#FFA500" />
            <Text style={[styles.statusText, { color: '#FFA500' }]}>Proof Under Review</Text>
            <Text style={styles.statusSubText}>Your submission is being reviewed by our team</Text>
          </View>
        );
      case 'Approve':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={[styles.statusText, { color: '#4CAF50' }]}>Proof Approved</Text>
            <Text style={styles.statusSubText}>Your proof has been accepted!</Text>
          </View>
        );
      case 'Reject':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="close-circle" size={60} color="#FF5722" />
            <Text style={[styles.statusText, { color: '#FF5722' }]}>Proof Rejected</Text>
            <Text style={styles.statusSubText}>Please submit new proof for verification</Text>
            {renderProofSubmission()}
          </View>
        );
      case 'To-be-submitted':
        return renderProofSubmission();
      default:
        return renderProofSubmission();
    }
  };

  const renderProofSubmission = () => {
    if (challenge.Challenge_Type !== 'Proof') {
      return (
        <View style={styles.autoTrackContainer}>
          <Ionicons name="sync-circle" size={60} color="#4CAF50" />
          <Text style={styles.autoTrackTitle}>Automatic Tracking</Text>
          <Text style={styles.autoTrackText}>
            This challenge is automatically tracked by our system. No proof submission is required.
            Your progress will be updated based on your activity data.
          </Text>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.sectionTitle}>Submit Your Proof</Text>
        <Text style={styles.instructions}>
          Please capture {challenge.ProofType.toLowerCase()} evidence that you completed this challenge.
        </Text>

        {media ? (
          <View style={styles.mediaContainer}>
            {challenge.ProofType === 'Image' ? (
              <Image source={{ uri: media.uri }} style={styles.media} />
            ) : (
              <View style={styles.videoContainer}>
                <Ionicons name="videocam" size={60} color="#bbb" />
                <Text style={styles.videoText}>Video captured</Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.changeMediaButton}
              onPress={() => setMedia(null)}
            >
              <Text style={styles.changeMediaText}>Remove Media</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={captureMedia}
          >
            <Ionicons 
              name={challenge.ProofType === 'Image' ? "camera" : "videocam"} 
              size={32} 
              color="#4CAF50" 
            />
            <Text style={styles.captureButtonText}>
              {challenge.ProofType === 'Image' ? 'Take Photo' : 'Record Video'}
            </Text>
          </TouchableOpacity>
        )}

        {media && (
          <TouchableOpacity 
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={submitProof}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Submit Proof</Text>
            )}
          </TouchableOpacity>
        )}
      </>
    );
  };

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading challenge details...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{challenge.Title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.challengeInfo}>
        <Text style={styles.description}>{challenge.Description}</Text>
        
        <View style={styles.detailRow}>
          <FontAwesome name="calendar" size={16} color="#bbb" />
          <Text style={styles.detailText}>
            Ends on: {new Date(challenge.EndDate).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="timer" size={16} color="#bbb" />
          <Text style={styles.detailText}>
            Duration: {challenge.Duration} days
          </Text>
        </View>

        <View style={styles.detailRow}>
          <FontAwesome name="info-circle" size={16} color="#bbb" />
          <Text style={styles.detailText}>
            Type: {challenge.Challenge_Type === 'Proof' ? 'Proof Required' : 'Automatic Tracking'}
          </Text>
        </View>

        {challenge.Challenge_Type === 'Proof' && (
          <View style={styles.detailRow}>
            <Ionicons name="camera" size={16} color="#bbb" />
            <Text style={styles.detailText}>
              Proof Type: {challenge.ProofType}
            </Text>
          </View>
        )}
      </View>

      {renderStatusMessage()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  loadingText: {
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  challengeInfo: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#bbb',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 20,
    textAlign: 'center',
  },
  captureButton: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  captureButtonText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 12,
    fontWeight: '500',
  },
  mediaContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  media: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#1E1E1E',
  },
  videoContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoText: {
    fontSize: 16,
    color: '#bbb',
    marginTop: 8,
  },
  changeMediaButton: {
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  changeMediaText: {
    color: '#FF5722',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  statusSubText: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
    textAlign: 'center',
  },
  autoTrackContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  autoTrackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 12,
  },
  autoTrackText: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default ChallengeProofSubmission;