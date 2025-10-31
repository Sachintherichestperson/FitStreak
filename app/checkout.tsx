import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
    description?: string;
}

const BuyNow = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [purchaseComplete, setPurchaseComplete] = useState(false);
    const [userDetails, setUserDetails] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
    });

    useEffect(() => {
        // Handle product parameter parsing with error handling
        try {
            if (params.product) {
                const productData = typeof params.product === 'string' 
                    ? JSON.parse(params.product) 
                    : params.product;
                setProduct(productData);
            } else {
                Alert.alert('Error', 'No product data found');
                router.back();
            }
        } catch (error) {
            console.error('Error parsing product data:', error);
            Alert.alert('Error', 'Invalid product data');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [params.product]);

    const handleInputChange = (field: string, value: string) => {
        setUserDetails(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
        for (const field of requiredFields) {
            if (!userDetails[field as keyof typeof userDetails].trim()) {
                Alert.alert('Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userDetails.email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }

        // Basic phone validation
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(userDetails.phone.replace(/\D/g, ''))) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return false;
        }

        return true;
    };

    const handlePurchase = async () => {
        if (!validateForm() || !product) return;

        setPurchaseLoading(true);
        try {
            // Simulate API call to process purchase
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Here you would typically make an API call to your backend
            // const token = await AsyncStorage.getItem('Token');
            // const response = await fetch('https://backend-hbwp.onrender.com/Store/purchase', {
            //     method: 'POST',
            //     headers: {
            //         Authorization: `Bearer ${token}`,
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({
            //         productId: product._id,
            //         userDetails,
            //         price: product.price
            //     }),
            // });

            // For demo purposes, we'll simulate a successful purchase
            setPurchaseComplete(true);
            
        } catch (error) {
            Alert.alert('Error', 'Failed to process purchase. Please try again.');
        } finally {
            setPurchaseLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <LinearGradient
                    colors={['#0a0a0a', '#121212']}
                    style={StyleSheet.absoluteFill}
                />
                <ActivityIndicator size="large" color="#00f5ff" />
                <Text style={styles.loadingText}>Loading product...</Text>
            </View>
        );
    }

    if (!product) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <LinearGradient
                    colors={['#0a0a0a', '#121212']}
                    style={StyleSheet.absoluteFill}
                />
                <Text style={styles.errorText}>Product not found</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (purchaseComplete) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#0a0a0a', '#121212']}
                    style={StyleSheet.absoluteFill}
                />
                
                <ScrollView contentContainerStyle={styles.successContainer}>
                    <View style={styles.successHeader}>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/Shop')} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#f0f0f0" />
                        </TouchableOpacity>
                        <Text style={styles.successTitle}>Purchase Complete</Text>
                    </View>

                    <View style={styles.successContent}>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark-circle" size={80} color="#00f5ff" />
                        </View>
                        
                        <Text style={styles.successMessage}>
                            You're on the Waitlist!
                        </Text>
                        
                        <Text style={styles.successSubMessage}>
                            Thank you for your purchase! You will receive your product soon. 
                            We'll send you tracking information once your order ships.
                        </Text>

                        <View style={styles.productSummary}>
                            <Image 
                                source={{ uri: product.image }} 
                                style={styles.productImage}
                                resizeMode="cover"
                            />
                            <View style={styles.productInfo}>
                                <Text style={styles.productName} numberOfLines={2}>
                                    {product.name}
                                </Text>
                                <Text style={styles.productPrice}>
                                    ₹{product.price}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.orderDetails}>
                            <Text style={styles.orderDetailsTitle}>Order Details</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Order Number:</Text>
                                <Text style={styles.detailValue}>#{Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Estimated Delivery:</Text>
                                <Text style={styles.detailValue}>5-7 business days</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Shipping Address:</Text>
                                <Text style={styles.detailValue}>
                                    {userDetails.address}, {userDetails.city}, {userDetails.state} {userDetails.zipCode}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.continueShoppingButton}
                            onPress={() => router.push('/(tabs)/Shop')}
                        >
                            <Text style={styles.continueShoppingButtonText}>Continue Shopping</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.trackOrderButton}
                            onPress={() => router.push('/(tabs)/Orders')}
                        >
                            <Text style={styles.trackOrderButtonText}>Track Your Order</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
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
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#f0f0f0" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Buy Now</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Product Summary */}
                <View style={styles.productCard}>
                    <Image 
                        source={{ uri: product.image }} 
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                    <View style={styles.productDetails}>
                        <Text style={styles.productName} numberOfLines={2}>
                            {product.name}
                        </Text>
                        <Text style={styles.productDescription} numberOfLines={3}>
                            {product.description || 'Premium quality product with excellent features.'}
                        </Text>
                        <View style={styles.priceContainer}>
                            <Text style={styles.productPrice}>₹{product.price}</Text>
                            <View style={styles.fitcoinContainer}>
                                <FontAwesome name="diamond" size={16} color="#00f5ff" />
                                <Text style={styles.fitcoinPrice}>
                                    {product?.fitcoinPrice} FitCoins
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Shipping Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shipping Information</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Full Name *</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter your full name"
                            placeholderTextColor="#777"
                            value={userDetails.fullName}
                            onChangeText={(text) => handleInputChange('fullName', text)}
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.inputLabel}>Email *</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="your@email.com"
                                placeholderTextColor="#777"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={userDetails.email}
                                onChangeText={(text) => handleInputChange('email', text)}
                            />
                        </View>
                        
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>Phone *</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="9876543210"
                                placeholderTextColor="#777"
                                keyboardType="phone-pad"
                                value={userDetails.phone}
                                onChangeText={(text) => handleInputChange('phone', text)}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Address *</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            placeholder="Street address, apartment, suite, etc."
                            placeholderTextColor="#777"
                            multiline
                            numberOfLines={3}
                            value={userDetails.address}
                            onChangeText={(text) => handleInputChange('address', text)}
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
                            <Text style={styles.inputLabel}>City *</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="City"
                                placeholderTextColor="#777"
                                value={userDetails.city}
                                onChangeText={(text) => handleInputChange('city', text)}
                            />
                        </View>
                        
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.inputLabel}>State *</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="State"
                                placeholderTextColor="#777"
                                value={userDetails.state}
                                onChangeText={(text) => handleInputChange('state', text)}
                            />
                        </View>
                        
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>ZIP *</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="ZIP"
                                placeholderTextColor="#777"
                                keyboardType="numeric"
                                value={userDetails.zipCode}
                                onChangeText={(text) => handleInputChange('zipCode', text)}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Country</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Country"
                            placeholderTextColor="#777"
                            value={userDetails.country}
                            onChangeText={(text) => handleInputChange('country', text)}
                        />
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Product Price</Text>
                        <Text style={styles.summaryValue}>₹{product.price}</Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Shipping</Text>
                        <Text style={styles.summaryValue}>FREE</Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tax</Text>
                        <Text style={styles.summaryValue}>₹{(product.price * 0.18).toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>
                            ₹{(product.price * 1.18).toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    
                    <TouchableOpacity style={styles.paymentMethod}>
                        <View style={styles.paymentMethodLeft}>
                            <FontAwesome name="credit-card" size={20} color="#00f5ff" />
                            <Text style={styles.paymentMethodText}>Credit/Debit Card</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#777" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.paymentMethod}>
                        <View style={styles.paymentMethodLeft}>
                            <FontAwesome name="paypal" size={20} color="#0070ba" />
                            <Text style={styles.paymentMethodText}>PayPal</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#777" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.paymentMethod}>
                        <View style={styles.paymentMethodLeft}>
                            <FontAwesome name="diamond" size={20} color="#00f5ff" />
                            <Text style={styles.paymentMethodText}>FitCoins</Text>
                        </View>
                        <Text style={styles.fitcoinBalance}>
                            Available: {0} FitCoins
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Purchase Button */}
            <TouchableOpacity 
                style={[styles.purchaseButton, purchaseLoading && styles.purchaseButtonDisabled]}
                onPress={handlePurchase}
                disabled={purchaseLoading}
            >
                {purchaseLoading ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text style={styles.purchaseButtonText}>
                        Complete Purchase - ₹{(product.price * 1.18).toFixed(2)}
                    </Text>
                )}
            </TouchableOpacity>
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
    loadingText: {
        color: '#ffffff',
        marginTop: 10,
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
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 15,
        marginBottom: 25,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 15,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 5,
    },
    productDescription: {
        fontSize: 12,
        color: '#aaa',
        marginBottom: 10,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
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
    section: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 15,
        color: '#ffffff',
        fontSize: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    inputRow: {
        flexDirection: 'row',
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
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#00f5ff',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 15,
    },
    paymentMethod: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
    },
    paymentMethodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentMethodText: {
        fontSize: 14,
        color: '#ffffff',
        marginLeft: 10,
    },
    fitcoinBalance: {
        fontSize: 12,
        color: '#777',
    },
    purchaseButton: {
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
    purchaseButtonDisabled: {
        opacity: 0.7,
    },
    purchaseButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    // Success Screen Styles
    successContainer: {
        flex: 1,
        padding: 20,
    },
    successHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    backButton: {
        marginRight: 15,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
    successContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successIcon: {
        marginBottom: 30,
    },
    successMessage: {
        fontSize: 24,
        fontWeight: '700',
        color: '#00f5ff',
        textAlign: 'center',
        marginBottom: 15,
    },
    successSubMessage: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    productSummary: {
        flexDirection: 'row',
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 15,
        marginBottom: 30,
        width: '100%',
    },
    productInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    orderDetails: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 20,
        marginBottom: 30,
        width: '100%',
    },
    orderDetailsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 14,
        color: '#aaa',
    },
    detailValue: {
        fontSize: 14,
        color: '#ffffff',
        textAlign: 'right',
        flex: 1,
        marginLeft: 10,
    },
    continueShoppingButton: {
        backgroundColor: '#00f5ff',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 15,
    },
    continueShoppingButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    trackOrderButton: {
        backgroundColor: 'rgba(0, 245, 255, 0.1)',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: '#00f5ff',
    },
    trackOrderButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#00f5ff',
    },
});

export default BuyNow;