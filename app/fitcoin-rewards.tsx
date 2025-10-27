// app/fitcoin-rewards.tsx
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const FitcoinRewards = () => {
  const router = useRouter();

  const features = [
    {
      icon: 'diamond',
      title: 'What are FitCoins?',
      description: 'FitCoins are our loyalty rewards currency earned through workouts, challenges, and purchases. Every FitCoin you earn brings you closer to amazing discounts!',
      color: '#00f5ff',
    },
    {
      icon: 'flash',
      title: 'How to Earn',
      description: '• Maintain Streak get 5 FitCoins per Streak\n• Post on Ananoymous: 50-70 FitCoins for milestones\n• Daily streaks: Bonus coins for consistency\n• Refer friends: 25 FitCoins per referral',
      color: '#ff7b25',
    },
    {
      icon: 'calculator',
      title: 'Conversion Rate',
      description: 'Current Rate: 5 FitCoins = ₹9.65\n1 FitCoin = ₹1.93\n\nRates may vary based on promotions and your membership tier.',
      color: '#4CAF50',
    },
    {
      icon: 'cart',
      title: 'How to Use',
      description: '1. Browse products in the store\n2. Tap "Add to Cart"\n3. Choose how many FitCoins to use\n4. Enjoy instant discounts at checkout!',
      color: '#9C27B0',
    },
  ];

  const tiers = [
    {
      name: 'Bronze',
      coins: '0-100',
      benefits: ['Basic earning rate', 'Standard discounts'],
      color: '#CD7F32',
    },
    {
      name: 'Silver',
      coins: '101-500',
      benefits: ['1.2x earning multiplier', 'Early access to sales', 'Priority support'],
      color: '#C0C0C0',
    },
    {
      name: 'Gold',
      coins: '501-1000',
      benefits: ['1.5x earning multiplier', 'Exclusive products', 'Free shipping', 'Personal coach'],
      color: '#FFD700',
    },
    {
      name: 'Platinum',
      coins: '1000+',
      benefits: ['2x earning multiplier', 'VIP support', 'Custom plans', 'All benefits unlocked'],
      color: '#00f5ff',
    },
  ];

  const faqs = [
    {
      question: 'Do FitCoins expire?',
      answer: 'FitCoins expire after 12 months of inactivity. Regular app usage keeps them active!',
    },
    {
      question: 'Can I transfer FitCoins?',
      answer: 'FitCoins are non-transferable and can only be used by the account holder.',
    },
    {
      question: 'Is there a limit to how many I can use?',
      answer: 'Yes, each product has a maximum FitCoin discount limit to ensure fair usage.',
    },
    {
      question: 'Can I get refunds in FitCoins?',
      answer: 'No, Once The Fitcoins are used you cannot get them Back.',
    },
  ];

  const showDoubleCoinsAlert = () => {
    Alert.alert(
      'Double FitCoins Week! 🎉',
      'From Monday to Sunday:\n\n• All workouts: 2x FitCoins\n• Challenges: 3x FitCoins\n• New signups: 50 bonus coins\n\nLimited time only!',
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0a0a0a', '#121212', '#0a0a0a']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FitCoin Rewards</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['rgba(0, 245, 255, 0.2)', 'rgba(0, 245, 255, 0.05)']}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.coinDisplay}>
                <FontAwesome name="diamond" size={60} color="#00f5ff" />
                <Text style={styles.heroTitle}>FitCoins</Text>
                <Text style={styles.heroSubtitle}>Your Fitness, Your Rewards</Text>
              </View>
              <Text style={styles.heroDescription}>
                Turn your fitness journey into real savings. Every workout brings you closer to exclusive discounts on premium fitness products.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Double Coins Banner */}
        <TouchableOpacity 
          style={styles.promoBanner}
          onPress={showDoubleCoinsAlert}
        >
          <LinearGradient
            colors={['#ff7b25', '#ff5252']}
            style={styles.promoGradient}
          >
            <View style={styles.promoContent}>
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoTitle}>🔥 Double FitCoins Week!</Text>
                <Text style={styles.promoSubtitle}>Earn 2x coins on all activities</Text>
                <Text style={styles.promoTime}>Limited Time • Ends Sunday</Text>
              </View>
              <MaterialIcons name="celebration" size={40} color="white" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Features Grid */}
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                <FontAwesome 
                  name={feature.icon as any} 
                  size={24} 
                  color={feature.color} 
                />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>

        {/* Membership Tiers */}
        <Text style={styles.sectionTitle}>Membership Tiers</Text>
        <View style={styles.tiersContainer}>
          {tiers.map((tier, index) => (
            <View key={index} style={styles.tierCard}>
              <LinearGradient
                colors={[`${tier.color}20`, `${tier.color}10`]}
                style={styles.tierGradient}
              >
                <View style={styles.tierHeader}>
                  <View style={styles.tierNameContainer}>
                    <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                    <Text style={styles.tierName}>{tier.name}</Text>
                  </View>
                  <Text style={styles.tierRange}>{tier.coins} FitCoins</Text>
                </View>
                <View style={styles.benefitsList}>
                  {tier.benefits.map((benefit, benefitIndex) => (
                    <View key={benefitIndex} style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={16} color={tier.color} />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={['rgba(0, 245, 255, 0.2)', 'rgba(0, 245, 255, 0.1)']}
            style={styles.ctaGradient}
          >
            <FontAwesome name="diamond" size={48} color="#00f5ff" />
            <Text style={styles.ctaTitle}>Start Earning Today!</Text>
            <Text style={styles.ctaDescription}>
              Complete your first workout and earn your first FitCoins. Your fitness journey has never been more rewarding.
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/Challenges')}
            >
              <Text style={styles.ctaButtonText}>Start Workout</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            FitCoin values and terms are subject to change. {'\n'}
            For complete terms and conditions, visit our website.
          </Text>
          <Text style={styles.footerCopyright}>
            © 2024 FitPulse. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerRight: {
    width: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  heroGradient: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  heroContent: {
    alignItems: 'center',
  },
  coinDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00f5ff',
    marginTop: 10,
    marginBottom: 5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#777',
    marginBottom: 15,
  },
  heroDescription: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  promoBanner: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff7b25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  promoGradient: {
    padding: 20,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 2,
  },
  promoTime: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  featuresGrid: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  tiersContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  tierCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tierGradient: {
    padding: 20,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tierNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  tierRange: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#aaa',
    flex: 1,
    lineHeight: 20,
  },
  faqContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  faqItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  ctaSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  ctaGradient: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#00f5ff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  footer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
});

export default FitcoinRewards;