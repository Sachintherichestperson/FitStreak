import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

type Product = {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  maxDiscount: number; // Maximum discount allowed in INR
  fitcoinPrice: number; // FitCoins needed for maximum discount
  category: 'supplements' | 'equipment' | 'apparel' | 'accessories';
  image: string;
  rating: number;
  reviews: number;
  description: string;
  stock: number;
  sold: number;
};


const AppStore = () => {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [fitcoins, setFitcoins] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [FITCOIN_TO_INR_RATE, setFitCoinValue] = useState(0);
  const [cartItems, setCartItems] = useState<{productId: string, quantity: number}[]>([]);

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'supplements', name: 'Supplements' },
    { id: 'equipment', name: 'Equipment' },
    { id: 'apparel', name: 'Apparel' },
    { id: 'accessories', name: 'Accessories' },
  ];

  const fetchBackendData = async () => {
    try {
      const token = await AsyncStorage.getItem('Token');
      const productsResponse = await fetch('http://192.168.141.177:3000/Store/', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

      if (!productsResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const productsData = await productsResponse.json();
      
      const mappedProducts = productsData.store.map((item: any) => ({
        id: item._id,
        name: item.Name,
        price: item.SellingPrice,
        costPrice: item.CostPrice,
        maxDiscount: item.MaxDiscount || 0,
        fitcoinPrice: item.fitcoinPrice || Math.floor(item.MaxDiscount / FITCOIN_TO_INR_RATE),
        category: mapCategory(item.Category),
        image: item.Image || null,
        rating: item.rating || 4.5,
        reviews: item.reviews || 0,
        description: item.Description || 'No description available',
        stock: item.Stock || 0,
        sold: item.Sold || 0
      }));
      
      setProducts(mappedProducts);
      setFitcoins(productsData.FitCoins);
      setLoading(false);
      setFitCoinValue(productsData.FitCoinsValue);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError('Failed to load products. Please try again.');
      setLoading(false);
    }
  };

  const FuncAddToCart = async (productId: string) => {
  const cartItem = {
    productId: productId,  // ✅ match backend expectation
    quantity: 1            // ✅ default quantity
  };

  try {
    const token = await AsyncStorage.getItem('Token');

    const response = await fetch('http://192.168.141.177:3000/Store/Cart', {
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

  } catch (error) {
    console.error('Error:', error);
  }
};

  const mapCategory = (backendCategory: string): 'supplements' | 'equipment' | 'apparel' | 'accessories' => {
    switch (backendCategory.toLowerCase()) {
      case 'supplement':
        return 'supplements';
      case 'equipment':
        return 'equipment';
      case 'apparel':
        return 'apparel';
      case 'accessory':
        return 'accessories';
      default:
        return 'accessories';
    }
  };

  const addToCart = (productId: string) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.productId === productId);
      if (existingItem) {
        return prev.map(item => 
          item.productId === productId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prev, { productId, quantity: 1 }];
      }
    });
  };

  const calculateDiscount = (product: Product, fitcoinsToUse: number) => {
    if (fitcoinsToUse <= 0) return 0;
    
    // Calculate potential discount based on FitCoin to INR rate
    const potentialDiscount = fitcoinsToUse * FITCOIN_TO_INR_RATE;
    
    // Don't allow discount more than the product's maxDiscount
    const discount = Math.min(potentialDiscount, product.maxDiscount);
    
    // Also don't allow discount more than product price
    return Math.min(discount, product.price);
  };

  const showFitcoinDialog = (product: Product) => {
    // Calculate maximum FitCoins that can be used for this product
    const maxUsableFitcoins = Math.min(
      Math.floor(product.maxDiscount / FITCOIN_TO_INR_RATE), // Based on max discount
      Math.floor(product.price / FITCOIN_TO_INR_RATE), // Can't discount more than product price
      fitcoins,
      product.fitcoinPrice
    );

    Alert.prompt(
      'Use FitCoins',
      `5 FitCoins = ₹1.65\n1 FitCoin = ₹0.33\n\nMax discount for this product: ₹${product.maxDiscount.toFixed(2)}\nYou can use up to 100 FitCoins (worth ₹${(maxUsableFitcoins * FITCOIN_TO_INR_RATE).toFixed(2)}).\n\nYour FitCoins balance: ${fitcoins}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Apply',
          onPress: (fitcoinsInput) => {
            const fitcoinsToUse = parseInt(fitcoinsInput || '0', 10);
            
            if (isNaN(fitcoinsToUse)) {
              Alert.alert('Invalid Input', 'Please enter a valid number of FitCoins');
              return;
            }
            
            if (fitcoinsToUse > fitcoins) {
              Alert.alert('Not Enough FitCoins', 'You don\'t have enough FitCoins');
              return;
            }
            
            if (fitcoinsToUse > maxUsableFitcoins) {
              Alert.alert('Max FitCoins Exceeded', `You can only use up to ${maxUsableFitcoins} FitCoins for this product (₹${product.maxDiscount.toFixed(2)} discount)`);
              return;
            }
            
            const discount = calculateDiscount(product, fitcoinsToUse);
            const finalPrice = product.price - discount;
            
            Alert.alert(
              'Discount Applied',
              `You've used ${fitcoinsToUse} FitCoins (worth ₹${(fitcoinsToUse * FITCOIN_TO_INR_RATE).toFixed(2)}) for a discount of ₹${discount.toFixed(2)}.\n\nOriginal Price: ₹${product.price.toFixed(2)}\nFinal Price: ₹${finalPrice.toFixed(2)}`,
              [
                { text: 'OK', onPress: () => {
                  // Deduct the used fitcoins
                  setFitcoins(prev => prev - fitcoinsToUse);
                  addToCart(product.id);
                }}
              ]
            );
          },
        },
      ],
      'plain-text',
      maxUsableFitcoins.toString(),
      'numeric'
    );
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(product => product.category === activeCategory);

      const renderProduct = ({ item }: { item: Product }) => (
        <TouchableOpacity 
          style={styles.productCard}
          onPress={() => router.push({
            pathname: '/product-detail',
            params: { 
              data: JSON.stringify({ product: item, fitcoins }) 
            }
          })}
      >
      <View style={styles.productImageContainer}>
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image" size={40} color="#777" />
          </View>
        )}
        
        {item.maxDiscount > 0 && (
          <View style={styles.fitcoinBadge}>
            <FontAwesome name="diamond" size={10} color="#00f5ff" />
            <Text style={styles.fitcoinBadgeText}>
              Save up to ₹{item.maxDiscount.toFixed(2)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        
        <View style={styles.stockContainer}>
          <Text style={[
            styles.stockText,
            item.stock < 10 ? styles.lowStockText : styles.inStockText
          ]}>
            {item.stock > 0 ? `${item.stock} left` : 'Out of stock'}
          </Text>
          {item.sold > 0 && (
            <Text style={styles.soldText}>{item.sold} sold</Text>
          )}
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>₹{item.price.toFixed(2)}</Text>
        </View>
        
        {item.maxDiscount > 0 && (
          <View style={styles.fitcoinContainer}>
            <FontAwesome name="diamond" size={12} color="#00f5ff" />
            <Text style={styles.fitcoinPrice}>
              Use up to {item.fitcoinPrice} FitCoins (Save ₹ 33)
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[
            styles.addToCartButton,
            item.stock <= 0 && styles.disabledButton
          ]}
          onPress={() => {
            FuncAddToCart(item.id);
          }}
          disabled={item.stock <= 0}
        >
          <Text style={styles.addToCartText}>
            {item.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        activeCategory === item.id && styles.activeCategoryButton
      ]}
      onPress={() => setActiveCategory(item.id)}
    >
      <Text style={[
        styles.categoryButtonText,
        activeCategory === item.id && styles.activeCategoryButtonText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00f5ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchBackendData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0a', '#121212']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>FitPulse Store</Text>
            <Text style={styles.subtitle}>Premium fitness products</Text>
          </View>
          <TouchableOpacity 
            style={styles.fitcoinBalance}
            onPress={() => router.push('/fitcoin-rewards')}
          >
            <FontAwesome name="diamond" size={16} color="#00f5ff" />
            <Text style={styles.fitcoinBalanceText}>
              {fitcoins} (₹{(fitcoins * FITCOIN_TO_INR_RATE).toFixed(2)})
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        />

        {filteredProducts.length > 0 ? (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.productsRow}
            scrollEnabled={false}
            contentContainerStyle={styles.productsContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="sad-outline" size={48} color="#777" />
            <Text style={styles.emptyText}>No products found in this category</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Special Offers</Text>
        <View style={styles.specialOfferCard}>
          <View style={styles.specialOfferContent}>
            <Text style={styles.specialOfferTitle}>Double FitCoins Week!</Text>
            <Text style={styles.specialOfferText}>
              Earn double FitCoins on all workouts this week. 5 FitCoins = ₹1.65
            </Text>
            <TouchableOpacity 
              style={styles.specialOfferButton}
              onPress={() => router.push('/fitcoin-rewards')}
            >
              <Text style={styles.specialOfferButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.specialOfferImage}>
            <FontAwesome name="diamond" size={40} color="#00f5ff" />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.cartButton}
        onPress={() => router.push('/Cart')}
      >
        {cartItems.length > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>
              {cartItems.reduce((total, item) => total + item.quantity, 0)}
            </Text>
          </View>
        )}
        <Ionicons name="cart" size={24} color="white" />
      </TouchableOpacity>
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
    paddingBottom: 100,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#00f5ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0a0a0a',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#777',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
  },
  fitcoinBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  fitcoinBalanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00f5ff',
    marginLeft: 8,
  },
  categoriesContainer: {
    gap: 10,
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeCategoryButton: {
    backgroundColor: '#00f5ff',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#777',
  },
  activeCategoryButtonText: {
    color: '#0a0a0a',
    fontWeight: '600',
  },
  productsContainer: {
    marginBottom: 30,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  productCard: {
    width: (width - 50) / 2,
    backgroundColor: '#121212',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 15,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
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
  fitcoinBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 245, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.5)',
  },
  fitcoinBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00f5ff',
    marginLeft: 5,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    height: 36,
  },
  stockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inStockText: {
    color: '#4CAF50',
  },
  lowStockText: {
    color: '#FF9800',
  },
  soldText: {
    fontSize: 12,
    color: '#777',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  fitcoinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  fitcoinPrice: {
    fontSize: 12,
    color: '#00f5ff',
    marginLeft: 5,
  },
  addToCartButton: {
    backgroundColor: '#00f5ff',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#777',
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 15,
  },
  specialOfferCard: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
    marginBottom: 30,
  },
  specialOfferContent: {
    flex: 1,
    paddingRight: 10,
  },
  specialOfferTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00f5ff',
    marginBottom: 8,
  },
  specialOfferText: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 12,
    lineHeight: 18,
  },
  specialOfferButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#00f5ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  specialOfferButtonText: {
    fontSize: 12,
    color: '#00f5ff',
  },
  specialOfferImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButton: {
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
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4d4d',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
});

export default AppStore;