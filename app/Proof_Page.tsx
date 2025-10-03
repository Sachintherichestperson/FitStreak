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
  
  type Challenge = {
    Title: string;
    Description: string;
    EndDate: string;
    Duration: number;
    Challenge_Type: string;
    ProofType?: string;
    RewardPoints?: number;
    BadgeReward?: boolean;
  };
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [proofStatus, setProofStatus] = useState('To-be-submitted');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengeResult, setChallengeResult] = useState<string | null | undefined>();
  const [lastSubmissionDate, setLastSubmissionDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallengeDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('Token');
        const response = await fetch(`http://192.168.141.177:3000/Challenges/Proof/${challengeId}`, {
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
        
        // Check proof status
        const proofResponse = await fetch(`http://192.168.141.177:3000/Challenges/Proof-Status/${challengeId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const proofData = await proofResponse.json();
        setProofStatus(proofData.status);
        setLastSubmissionDate(proofData.lastSubmissionDate || null);
        
        // Only check challenge result if proof is approved or challenge is non-proof
        if (proofData.status === 'Approve' || challenge?.Challenge_Type === 'Non-Proof') {
          const resultResponse = await fetch(`http://192.168.141.177:3000/Challenges/check-challenge-result/${challengeId}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const resultData = await resultResponse.json();

          console.log('Challenge Result:', resultData);
          if (resultData.Status && resultData.Status !== 'Pending') {
            setChallengeResult(resultData.Status);
          } else {
            setChallengeResult(null);
          }
        } else {
          setChallengeResult(null);
        }
      } catch (error) {
        console.error('Error fetching status:', error);
        setProofStatus('To-be-submitted');
        setChallengeResult(null);
        setLastSubmissionDate(null);
      }
    };

    if (challenge) {
      fetchProofStatus();
    }
  }, [challengeId, isSubmitting, challenge]);

  const captureMedia = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera permission to capture media');
      return;
    }

    if (!challenge) {
      Alert.alert('Error', 'Challenge details not loaded');
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
    if (!media && challenge && challenge.Challenge_Type === 'Proof') {
      Alert.alert('Proof required', 'Please provide proof for this challenge');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('Token');

      const formData = new FormData();
      
      if (!media) {
        throw new Error('No media selected');
      }
      const newImageUri = Platform.OS === 'ios' ? media.uri.replace('file://', '') : media.uri;
      
      formData.append('proofData', {
        uri: newImageUri,
        type: mime.getType(newImageUri) || 'image/jpeg',
        name: newImageUri.split('/').pop() || 'proof.jpg'
      } as any);
      
      formData.append('challengeId', String(challengeId));
      formData.append('submissionDate', new Date().toISOString());

      const response = await fetch('http://192.168.141.177:3000/Challenges/submit-proof', {
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

      setIsSubmitting(!isSubmitting);
      Alert.alert('Success', 'Proof submitted successfully!');
      setMedia(null);
    } catch (error) {
      console.error('Error submitting proof:', error);
      Alert.alert('Error', 'Failed to submit proof. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shouldShowProofSubmission = () => {
    if (!challenge) return false;
    
    // For non-proof challenges, never show proof submission
    if (challenge.Challenge_Type !== 'Proof') {
      return false;
    }

    // If there's a challenge result (Won/Lose), don't show proof submission
    if (challengeResult) {
      return false;
    }

    // If proof is already approved, don't show submission
    if (proofStatus === 'Approve') {
      return false;
    }

    // Check if proof was submitted today
    if (lastSubmissionDate) {
      const today = new Date().toISOString().split('T')[0];
      const submissionDate = new Date(lastSubmissionDate).toISOString().split('T')[0];
      if (submissionDate === today && proofStatus === 'Pending') {
        return false; // Already submitted today and pending review
      }
    }

    // For rejected proofs or to-be-submitted, show submission
    return proofStatus === 'Reject' || proofStatus === 'To-be-submitted';
  };

  const renderWinUI = () => {
    return (
      <View style={styles.resultContainer}>
        <View style={styles.trophyContainer}>
          <Ionicons name="trophy" size={80} color="#FFD700" />
          <View style={styles.confettiLeft} />
          <View style={styles.confettiRight} />
        </View>
        <Text style={styles.resultTitle}>Challenge Won!</Text>
        <Text style={styles.resultSubtitle}>You&apos;ve successfully completed the challenge!</Text>
        
        <View style={styles.rewardContainer}>
          <Text style={styles.rewardTitle}>Your Rewards:</Text>
          <View style={styles.rewardItem}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.rewardText}>{(challenge?.RewardPoints ?? 50)} Points Added</Text>
          </View>
          {challenge && challenge.BadgeReward && (
            <View style={styles.rewardItem}>
              <Ionicons name="ribbon" size={24} color="#FFD700" />
              <Text style={styles.rewardText}>New Badge Unlocked</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.celebrateButton}
          onPress={() => router.push('/(tabs)/Challenges')}
        >
          <Text style={styles.celebrateButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLoseUI = () => {
    return (
      <View style={styles.resultContainer}>
        <View style={styles.sadFaceContainer}>
          <Ionicons name="sad" size={80} color="#FF5722" />
        </View>
        <Text style={styles.resultTitle}>Challenge Lost</Text>
        <Text style={styles.resultSubtitle}>Better luck next time!</Text>
        
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackTitle}>What you can do:</Text>
          <View style={styles.feedbackItem}>
            <Ionicons name="arrow-forward" size={16} color="#bbb" />
            <Text style={styles.feedbackText}>Try again with a new challenge</Text>
          </View>
          <View style={styles.feedbackItem}>
            <Ionicons name="arrow-forward" size={16} color="#bbb" />
            <Text style={styles.feedbackText}>Improve your performance and try again</Text>
          </View>
          <View style={styles.feedbackItem}>
            <Ionicons name="arrow-forward" size={16} color="#bbb" />
            <Text style={styles.feedbackText}>Check out tips to succeed next time</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.tryAgainButton}
          onPress={() => router.push('/(tabs)/Challenges')}
        >
          <Text style={styles.tryAgainButtonText}>Find New Challenges</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProofSubmission = () => {
    if (!challenge || challenge.Challenge_Type !== 'Proof') {
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
          Please capture {(challenge && challenge.ProofType ? challenge.ProofType.toLowerCase() : 'appropriate')} evidence that you completed this challenge.
        </Text>

        {media ? (
          <View style={styles.mediaContainer}>
            {challenge && challenge.ProofType === 'Image' ? (
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
              name={challenge?.ProofType === 'Image' ? "camera" : "videocam"} 
              size={32} 
              color="#4CAF50" 
            />
            <Text style={styles.captureButtonText}>
              {challenge?.ProofType === 'Image' ? 'Take Photo' : 'Record Video'}
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

  const renderStatusMessage = () => {
    // First check if challenge is completed (Won or Lose)
    if (challengeResult) {
      return challengeResult === 'Won' ? renderWinUI() : renderLoseUI();
    }

    // Check if we should show proof submission
    if (shouldShowProofSubmission()) {
      return renderProofSubmission();
    }

    // Then check proof status
    switch (proofStatus) {
      case 'Pending':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="time" size={60} color="#FFA500" />
            <Text style={[styles.statusText, { color: '#FFA500' }]}>Proof Under Review</Text>
            <Text style={styles.statusSubText}>
              {lastSubmissionDate 
                ? `Your submission from ${new Date(lastSubmissionDate).toLocaleDateString()} is being reviewed by our team`
                : 'Your submission is being reviewed by our team'
              }
            </Text>
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
    textAlign: 'center',
    marginTop: 20,
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
    textAlign: 'center',
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
  // Win/Lose UI styles
  resultContainer: {
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
  trophyContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  sadFaceContainer: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 16,
    color: '#bbb',
    marginBottom: 24,
    textAlign: 'center',
  },
  rewardContainer: {
    width: '100%',
    marginBottom: 24,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  feedbackContainer: {
    width: '100%',
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 16,
    color: '#bbb',
    marginLeft: 12,
  },
  celebrateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tryAgainButton: {
    backgroundColor: '#FF5722',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confettiLeft: {
    position: 'absolute',
    left: -30,
    top: -20,
    width: 20,
    height: 20,
    backgroundColor: '#FFD700',
    transform: [{ rotate: '45deg' }],
  },
  confettiRight: {
    position: 'absolute',
    right: -30,
    top: -20,
    width: 20,
    height: 20,
    backgroundColor: '#FFD700',
    transform: [{ rotate: '45deg' }],
  },
});

export default ChallengeProofSubmission;