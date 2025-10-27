import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  fitcoinPrice: number;
  rating: number;
  reviews: number;
  description: string;
  image: string;
  category: string;
  brand: string;
  sold?: number;
}

const ProductDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { product, fitcoins } = JSON.parse(params.data as string);
  console.log(product, fitcoins);

  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.5))[0];
  const positionAnim = useState(new Animated.Value(30))[0];

  const FuncAddToCart = async (productId: string) => {
    const cartItem = {
      productId: productId,
      quantity: 1
    };

    try {
      const token = await AsyncStorage.getItem('Token');

      const response = await fetch('https://backend-hbwp.onrender.com/Store/Cart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartItem),
      });

      if (!response.ok) {
        console.error('Error adding to cart:', await response.text());
        return;
      }

      setShowSuccess(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(positionAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      ]).start();

      // Hide after 2 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 0.5,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(positionAnim, {
            toValue: 30,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          })
        ]).start(() => {
          setShowSuccess(false);
        });
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#121212']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Success Notification */}
      {showSuccess && (
        <Animated.View 
          style={[
            styles.successNotification,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: positionAnim }
              ]
            }
          ]}
        >
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.successText}>Added to Cart!</Text>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Product Image */}
        <View style={styles.productImageContainer}>
          {product.image ? (
            <Image 
              source={{ uri: product.image }} 
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image" size={80} color="#777" />
            </View>
          )}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/Cart')}
          >
            <Ionicons name="cart" size={24} color="white" />
            {/* Optional: Show cart item count here */}
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton}>
            <MaterialIcons name="favorite-border" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.brandText}>{product.brand || 'FiStreak'}</Text>
          <Text style={styles.sectionSold}>Product Sold: {product.sold || '23'}</Text>
          
          <View style={styles.priceContainer}>
            {product.discountPrice ? (
              <>
                <Text style={styles.discountPrice}>₹{product.price.toFixed(2)}</Text>
                <Text style={styles.currentPrice}>₹{product.discountPrice.toFixed(2)}</Text>
              </>
            ) : (
              <Text style={styles.currentPrice}>₹{product.price.toFixed(2)}</Text>
            )}
            <View style={styles.fitcoinContainer}>
              <FontAwesome name="diamond" size={16} color="#00f5ff" />
              <Text style={styles.fitcoinPrice}>{product.fitcoinPrice} FitCoins</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>

          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsItem}>
            <Ionicons name="pricetag-outline" size={18} color="#777" />
            <Text style={styles.detailsText}>Category: {product.category}</Text>
          </View>
          <View style={styles.detailsItem}>
            <Ionicons name="cube-outline" size={18} color="#777" />
            <Text style={styles.detailsText}>Free shipping on orders over ₹50</Text>
          </View>
          <View style={styles.detailsItem}>
            <Ionicons name="refresh-circle-outline" size={18} color="#777" />
            <Text style={styles.detailsText}>30-day return policy</Text>
          </View>
          <View style={styles.detailsItem}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#777" />
            <Text style={styles.detailsText}>Authentic products guarantee</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={styles.addToCartButton} 
          onPress={() => FuncAddToCart(product.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity 
          style={styles.buyNowButton}
          onPress={() => router.push({
            pathname: '/BuyNow',
            params: { product: JSON.stringify({ product, fitcoins}) }
          })}
        >
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  favoriteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartButton: {
    position: 'absolute',
    top: 20,
    right: 70,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 5,
  },
  brandText: {
    fontSize: 16,
    color: '#777',
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
    flexWrap: 'wrap',
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  discountPrice: {
    fontSize: 18,
    color: '#777',
    textDecorationLine: 'line-through',
  },
  fitcoinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  fitcoinPrice: {
    fontSize: 14,
    color: '#00f5ff',
    marginLeft: 5,
  },
  sectionSold: {
    fontSize: 14,
    color: '#4CAF50',
    lineHeight: 22,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    marginTop: 15,
  },
  descriptionText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 22,
    marginBottom: 5,
  },
  detailsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  detailsText: {
    fontSize: 14,
    color: '#aaa',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#121212',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#00f5ff',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#ff7b25',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  successNotification: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  successText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
  },
});

export default ProductDetail;