import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Product {
    _id: string;
    name: string;
    price: number;
    fitcoinPrice: number;
    image: string;
    MaxDiscount: number;
}

interface CartItem {
    _id: string;
    product: Product;
    quantity: number;
}

interface CartResponse {
    cart: {
        _id: string;
        user: string;
        products: CartItem[];
    };
}

const Cart = () => {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [fitcoins, setFitcoins] = useState(0);
    const [FITCOIN_TO_INR_RATE, setFitCoinValue] = useState(0);
    const [showFitcoinModal, setShowFitcoinModal] = useState(false);
    const [fitcoinsToUse, setFitcoinsToUse] = useState('');
    const [appliedFitcoins, setAppliedFitcoins] = useState(0);

    const fetchCartItems = async () => {
        try {
            const token = await AsyncStorage.getItem('Token');

            // Fetch cart items
            const cartResponse = await fetch('http://192.168.29.104:3000/Store/Cart', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!cartResponse.ok) {
                throw new Error(`HTTP error! status: ${cartResponse.status}`);
            }

            const cartData: CartResponse = await cartResponse.json();
            setCartItems(cartData.cart?.products || []);

            // Fetch user's fitcoins balance
            const userResponse = await fetch('http://192.168.29.104:3000/Store/', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!userResponse.ok) {
                throw new Error(`HTTP error! status: ${userResponse.status}`);
            }

            const userData = await userResponse.json();
            setFitcoins(userData.FitCoins || 0);
            setFitCoinValue(userData.FitCoinsValue || 0);
        } catch (err) {
            console.error('Fetch cart error:', err);
            setError(err.message);
            Alert.alert('Error', 'Failed to load cart items');
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            const token = await AsyncStorage.getItem('Token');
            const response = await fetch(`http://192.168.29.104:3000/Store/Cart/${itemId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quantity: newQuantity }),
            });

            if (!response.ok) {
                throw new Error('Failed to update quantity');
            }

            // Update local state
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item._id === itemId ? { ...item, quantity: newQuantity } : item
                )
            );
        } catch (err) {
            Alert.alert('Error', 'Failed to update quantity');
        }
    };

    const removeItem = async (itemId: string) => {
        try {
            const token = await AsyncStorage.getItem('Token');
            const response = await fetch(`http://192.168.29.104:3000/Store/Cart/${itemId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to remove item');
            }

            // Update local state
            setCartItems(prevItems => prevItems.filter(item => item._id !== itemId));
        } catch (err) {
            Alert.alert('Error', 'Failed to remove item');
        }
    };

    const calculateMaxAllowedFitcoins = () => {
    // Ensure we have valid values
    if (!FITCOIN_TO_INR_RATE || FITCOIN_TO_INR_RATE <= 0) {
        return 0;
    }

    let maxFitcoins = 0;
    
    cartItems.forEach(item => {
        const maxDiscountForItem = (item.product.MaxDiscount || 0) * item.quantity;
        const maxFitcoinsForItem = Math.floor(maxDiscountForItem / FITCOIN_TO_INR_RATE);
        maxFitcoins += maxFitcoinsForItem;
    });

    
    return maxFitcoins;
};

    const handleApplyFitcoins = () => {
        const fitcoinsToUseNum = parseInt(fitcoinsToUse);
        
        if (isNaN(fitcoinsToUseNum)) {
            Alert.alert('Error', 'Please enter a valid number');
            return;
        }
        
        if (fitcoinsToUseNum <= 0) {
            Alert.alert('Error', 'Fitcoins must be greater than 0');
            return;
        }
        
        if (fitcoinsToUseNum > fitcoins) {
            Alert.alert('Error', `You only have ${fitcoins} Fitcoins available`);
            return;
        }
        
        const maxAllowed = calculateMaxAllowedFitcoins();
        if (fitcoinsToUseNum > maxAllowed) {
            Alert.alert('Error', `You can only use up to ${maxAllowed} Fitcoins for this order based on product discount limits`);
            return;
        }
        
        setAppliedFitcoins(fitcoinsToUseNum);
        setShowFitcoinModal(false);
        setFitcoinsToUse('');
    };

    const handleRemoveFitcoins = () => {
        setAppliedFitcoins(0);
    };

    useEffect(() => {
        fetchCartItems();
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <LinearGradient
                    colors={['#0a0a0a', '#121212']}
                    style={StyleSheet.absoluteFill}
                />
                <ActivityIndicator size="large" color="#00f5ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <LinearGradient
                    colors={['#0a0a0a', '#121212']}
                    style={StyleSheet.absoluteFill}
                />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchCartItems}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) || 0;
    const fitcoinsDiscount = Math.min(appliedFitcoins * FITCOIN_TO_INR_RATE, 
        cartItems.reduce((sum, item) => sum + (item.product.MaxDiscount * item.quantity), 0));
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = Math.max(0, subtotal - fitcoinsDiscount + shipping);

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            {item.product.image ? (
                <Image 
                    source={{ uri: item.product.image }} 
                    style={styles.cartItemImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.cartItemImagePlaceholder}>
                    <Ionicons name="image" size={30} color="#777" />
                </View>
            )}
            <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName} numberOfLines={2}>
                    {item.product.name}
                </Text>
                <Text style={styles.cartItemPrice}>
                    ₹{item.product.price}
                </Text>
                <View style={styles.fitcoinContainer}>
                    <FontAwesome name="diamond" size={14} color="#00f5ff" />
                    <Text style={styles.fitcoinPrice}>
                        {item.product.fitcoinPrice} FitCoins
                    </Text>
                </View>
                <Text style={styles.maxDiscountText}>
                    Max discount: ₹{item.product.MaxDiscount}
                </Text>
            </View>
            <View style={styles.quantityContainer}>
                <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item._id, item.quantity - 1)}
                >
                    <Ionicons name="remove" size={16} color="#777" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item._id, item.quantity + 1)}
                >
                    <Ionicons name="add" size={16} color="#777" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeItem(item._id)}
            >
                <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0a0a0a', '#121212']}
                style={StyleSheet.absoluteFill}
            />
            
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#f0f0f0" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Your Cart</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Cart Items */}
                {cartItems.length === 0 ? (
                    <View style={styles.emptyCartContainer}>
                        <Ionicons name="cart-outline" size={60} color="#777" />
                        <Text style={styles.emptyCartText}>Your cart is empty</Text>
                        <TouchableOpacity 
                            style={styles.shopButton}
                            onPress={() => router.push('/(tabs)/Shop')}
                        >
                            <Text style={styles.shopButtonText}>Shop Now</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={cartItems}
                            renderItem={renderCartItem}
                            keyExtractor={item => item._id}
                            scrollEnabled={false}
                            contentContainerStyle={styles.cartItemsContainer}
                        />

                        {/* Discount Section */}
                        <View style={styles.discountContainer}>
                            <Text style={styles.sectionTitle}>Apply Discount</Text>
                            {appliedFitcoins > 0 ? (
                                <View style={styles.appliedDiscount}>
                                    <View style={styles.discountInfo}>
                                        <FontAwesome name="diamond" size={20} color="#00f5ff" />
                                        <Text style={styles.discountText}>
                                            {appliedFitcoins} Fitcoins applied (-₹{fitcoinsDiscount.toFixed(2)})
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={handleRemoveFitcoins}>
                                        <Text style={styles.removeDiscountText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    style={styles.applyDiscountButton}
                                    onPress={() => setShowFitcoinModal(true)}
                                >
                                    <Text style={styles.applyDiscountButtonText}>Apply Fitcoins</Text>
                                    <Text style={styles.fitcoinBalanceText}>
                                        Available: {fitcoins} (₹{(fitcoins * FITCOIN_TO_INR_RATE).toFixed(2)})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Summary */}
                        <View style={styles.summaryContainer}>
                            <Text style={styles.summaryTitle}>Order Summary</Text>
                            
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal</Text>
                                <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
                            </View>
                            
                            {appliedFitcoins > 0 && (
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Fitcoins Discount</Text>
                                    <Text style={[styles.summaryValue, { color: '#00f5ff' }]}>-₹{fitcoinsDiscount.toFixed(2)}</Text>
                                </View>
                            )}
                            
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Shipping</Text>
                                <Text style={styles.summaryValue}>
                                    {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                                </Text>
                            </View>
                            
                            <View style={styles.summaryDivider} />
                            
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Total</Text>
                                <Text style={[styles.summaryValue, { fontWeight: '700', fontSize: 18 }]}>
                                    ₹{total.toFixed(2)}
                                </Text>
                            </View>
                        </View>

                        {/* Payment Options */}
                        <View style={styles.paymentOptions}>
                            <Text style={styles.sectionTitle}>Payment Method</Text>
                            <TouchableOpacity style={styles.paymentOption}>
                                <View style={styles.paymentOptionLeft}>
                                    <FontAwesome name="credit-card" size={20} color="#00f5ff" />
                                    <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#777" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.paymentOption}>
                                <View style={styles.paymentOptionLeft}>
                                    <FontAwesome name="paypal" size={20} color="#0070ba" />
                                    <Text style={styles.paymentOptionText}>PayPal</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#777" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.paymentOption}>
                                <View style={styles.paymentOptionLeft}>
                                    <FontAwesome name="diamond" size={20} color="#00f5ff" />
                                    <Text style={styles.paymentOptionText}>FitCoins</Text>
                                </View>
                                <Text style={styles.fitcoinBalance}>Balance: {fitcoins} (₹{(fitcoins * FITCOIN_TO_INR_RATE).toFixed(2)})</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Checkout Button - Only show if cart has items */}
            {cartItems.length > 0 && (
                <TouchableOpacity 
                    style={styles.checkoutButton}
                    onPress={() => router.push('/checkout')}
                >
                    <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                </TouchableOpacity>
            )}

            {/* Fitcoin Modal */}
            <Modal
                visible={showFitcoinModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowFitcoinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Apply Fitcoins</Text>
                        
                        <Text style={styles.modalSubtitle}>
                            Available: {fitcoins} Fitcoins (₹{(fitcoins * FITCOIN_TO_INR_RATE).toFixed(2)})
                        </Text>
                        
                        <Text style={styles.modalSubtitle}>
                            Maximum you can use: {calculateMaxAllowedFitcoins()} Fitcoins
                        </Text>
                        
                        <TextInput
                            style={styles.fitcoinInput}
                            placeholder="Enter Fitcoins to use"
                            keyboardType="numeric"
                            value={fitcoinsToUse}
                            onChangeText={setFitcoinsToUse}
                            placeholderTextColor="#777"
                        />
                        
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowFitcoinModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.applyButton]}
                                onPress={handleApplyFitcoins}
                            >
                                <Text style={[styles.modalButtonText, { color: '#000' }]}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
    cartItemsContainer: {
        gap: 15,
        marginBottom: 30,
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
    },
    cartItemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 15,
    },
    cartItemImagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cartItemInfo: {
        flex: 1,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 5,
    },
    cartItemPrice: {
        fontSize: 14,
        color: '#ffffff',
        marginBottom: 5,
    },
    fitcoinContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fitcoinPrice: {
        fontSize: 12,
        color: '#00f5ff',
        marginLeft: 5,
    },
    maxDiscountText: {
        fontSize: 12,
        color: '#aaa',
        marginTop: 5,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
    },
    quantityButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 16,
        color: '#ffffff',
        marginHorizontal: 10,
    },
    removeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    discountContainer: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    appliedDiscount: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    discountInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    discountText: {
        color: '#00f5ff',
        marginLeft: 10,
        fontSize: 14,
    },
    removeDiscountText: {
        color: '#ff4d4d',
        fontSize: 14,
    },
    applyDiscountButton: {
        backgroundColor: 'rgba(0, 245, 255, 0.1)',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
    },
    applyDiscountButtonText: {
        color: '#00f5ff',
        fontWeight: '600',
        fontSize: 16,
    },
    fitcoinBalanceText: {
        color: '#777',
        fontSize: 12,
        marginTop: 5,
    },
    summaryContainer: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 20,
        marginBottom: 30,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#aaa',
    },
    summaryValue: {
        fontSize: 14,
        color: '#ffffff',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 15,
    },
    paymentOptions: {
        marginBottom: 30,
    },
    paymentOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    paymentOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentOptionText: {
        fontSize: 14,
        color: '#ffffff',
        marginLeft: 10,
    },
    fitcoinBalance: {
        fontSize: 12,
        color: '#777',
    },
    checkoutButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#00f5ff',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkoutButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    emptyCartContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyCartText: {
        fontSize: 18,
        color: '#ffffff',
        marginTop: 20,
        marginBottom: 30,
    },
    shopButton: {
        backgroundColor: '#00f5ff',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    shopButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    errorText: {
        color: '#ff4d4d',
        fontSize: 16,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#00f5ff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#000',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 20,
        width: '90%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 5,
        textAlign: 'center',
    },
    fitcoinInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 15,
        color: '#ffffff',
        marginVertical: 15,
        fontSize: 16,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    applyButton: {
        backgroundColor: '#00f5ff',
    },
    modalButtonText: {
        color: '#ffffff',
        fontWeight: '600',
    },
});

export default Cart;