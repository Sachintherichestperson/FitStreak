import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
  maxDiscount: number;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'fitcoin' | 'cod';
  name: string;
  details: string;
  icon: string;
}

interface OrderData {
  product: Array<{ product: Product; quantity: number }>;
  fitcoins: number;
  appliedFitcoins?: number;
  fitcoinsDiscount?: number;
  subtotal?: number;
  shipping?: number;
  total?: number;
}

const BuyNow = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const data: OrderData = JSON.parse(params.product as string);
  const product = data.product as Array<{ product: Product; quantity: number }>;
  const appliedFitcoins = data.appliedFitcoins || 0;
  const fitcoinsDiscount = data.fitcoinsDiscount || 0;
  const subtotal = data.subtotal || 0;
  const shipping = data.shipping || 0;
  const total = data.total || 0;

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const paymentMethods: PaymentMethod[] = [
    {
      id: '3',
      type: 'cod',
      name: 'Cash on Delivery',
      details: 'Pay when you receive',
      icon: 'cash'
    }
  ];

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setAddresses([]);
    setSelectedAddress(null);
  };

  const handleAddNewAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      Alert.alert('Error', 'Please fill all address fields');
      return;
    }

    if (newAddress.phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (newAddress.pincode.length < 6) {
      Alert.alert('Error', 'Please enter a valid pincode');
      return;
    }

    try {
      const addressWithId = {
        ...newAddress,
        id: Date.now().toString(),
        isDefault: addresses.length === 0
      };

      setAddresses(prev => [...prev, addressWithId]);
      setSelectedAddress(addressWithId);
      setShowNewAddressForm(false);
      
      // Reset form
      setNewAddress({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pincode: ''
      });
      
      Alert.alert('Success', 'Address added successfully');

    } catch (error) {
      Alert.alert('Error', 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!selectedPayment) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      const token = await AsyncStorage.getItem('Token');
      
      const orderData = {
        products: product,
        address: selectedAddress,
        paymentMethod: selectedPayment.type,
        fitcoinsUsed: appliedFitcoins,
        totalAmount: total,
        subtotal: subtotal,
        shipping: shipping,
        discount: fitcoinsDiscount
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch('https://backend-hbwp.onrender.com/Store/Orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Orderdata: orderData })
      });

      setOrderSuccess(true);
      
      setTimeout(() => {
        router.replace('/(tabs)/Shop');
      }, 3000);

    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate total fitcoin reward from all products
  const calculateTotalFitcoinReward = () => {
    return product.reduce((total, item) => {
      return total + (item.product?.fitcoinPrice * item.quantity);
    }, 0);
  };

  if (orderSuccess) {
    return (
      <View style={styles.successContainer}>
        <LinearGradient
          colors={['#0a0a0a', '#121212']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.successContent}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successText}>
            Your order has been confirmed and will be shipped soon.
          </Text>
          <Text style={styles.successSubText}>
            Redirecting to store...
          </Text>
        </View>
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Product Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {product.map((item, index) => (
            <View key={index} style={styles.productSummary}>
              <Image 
                source={{ uri: item.product.image }} 
                style={styles.productThumbnail}
              />
              <View style={styles.productDetails}>
                <Text style={styles.productName} numberOfLines={2}>{item.product.name}</Text>
                <Text style={styles.productBrand}>{item.product.brand}</Text>
                <Text style={styles.quantityLabel}>Quantity: {item.quantity}</Text>
                <Text style={styles.productPrice}>
                  ₹{(item.product.discountPrice || item.product.price) * item.quantity}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(true)}>
              <Text style={styles.changeText}>
                {addresses.length > 0 ? 'Change' : 'Add Address'}
              </Text>
            </TouchableOpacity>
          </View>
          {selectedAddress ? (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressName}>{selectedAddress.name}</Text>
              </View>
              <Text style={styles.addressText}>{selectedAddress.street}</Text>
              <Text style={styles.addressText}>
                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </Text>
              <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addAddressButton}
              onPress={() => setShowAddressModal(true)}
            >
              <Ionicons name="add" size={24} color="#00f5ff" />
              <Text style={styles.addAddressText}>Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(true)}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
          {selectedPayment ? (
            <View style={styles.paymentCard}>
              <Ionicons 
                name={selectedPayment.icon as any} 
                size={24} 
                color="#00f5ff" 
              />
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentName}>{selectedPayment.name}</Text>
                <Text style={styles.paymentInfo}>{selectedPayment.details}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.selectPaymentButton}
              onPress={() => setShowPaymentModal(true)}
            >
              <Text style={styles.selectPaymentText}>Select Payment Method</Text>
              <Ionicons name="chevron-forward" size={20} color="#777" />
            </TouchableOpacity>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          
          {appliedFitcoins > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fitcoins Discount</Text>
              <Text style={[styles.summaryValue, { color: '#00f5ff' }]}>
                -₹{fitcoinsDiscount.toFixed(2)}
              </Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
          
          {calculateTotalFitcoinReward() > 0 && (
            <View style={styles.fitcoinReward}>
              <FontAwesome name="diamond" size={16} color="#00f5ff" />
              <Text style={styles.fitcoinText}>
                You'll earn {calculateTotalFitcoinReward()} FitCoins with this purchase
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Checkout Bar */}
      <View style={styles.checkoutBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total: ₹{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.placeOrderButton,
            isProcessing && styles.placeOrderButtonDisabled
          ]}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#0a0a0a" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Selection Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {showNewAddressForm ? 'Add New Address' : 'Select Address'}
            </Text>
            <TouchableOpacity onPress={() => {
              if (showNewAddressForm) {
                setShowNewAddressForm(false);
              } else {
                setShowAddressModal(false);
              }
            }}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {showNewAddressForm ? (
            <ScrollView style={styles.addressFormContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#777"
                value={newAddress.name}
                onChangeText={(text) => setNewAddress(prev => ({...prev, name: text}))}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#777"
                value={newAddress.phone}
                onChangeText={(text) => setNewAddress(prev => ({...prev, phone: text}))}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Street Address"
                placeholderTextColor="#777"
                value={newAddress.street}
                onChangeText={(text) => setNewAddress(prev => ({...prev, street: text}))}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#777"
                value={newAddress.city}
                onChangeText={(text) => setNewAddress(prev => ({...prev, city: text}))}
              />
              <TextInput
                style={styles.input}
                placeholder="State"
                placeholderTextColor="#777"
                value={newAddress.state}
                onChangeText={(text) => setNewAddress(prev => ({...prev, state: text}))}
              />
              <TextInput
                style={styles.input}
                placeholder="Pincode"
                placeholderTextColor="#777"
                value={newAddress.pincode}
                onChangeText={(text) => setNewAddress(prev => ({...prev, pincode: text}))}
                keyboardType="numeric"
              />
              <TouchableOpacity 
                style={styles.saveAddressButton}
                onPress={handleAddNewAddress}
              >
                <Text style={styles.saveAddressButtonText}>Save Address</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView>
              {addresses.map(address => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressOption,
                    selectedAddress?.id === address.id && styles.selectedAddressOption
                  ]}
                  onPress={() => {
                    setSelectedAddress(address);
                    setShowAddressModal(false);
                  }}
                >
                  <View style={styles.addressOptionContent}>
                    <Text style={styles.addressOptionName}>{address.name}</Text>
                    <Text style={styles.addressOptionText}>{address.street}</Text>
                    <Text style={styles.addressOptionText}>
                      {address.city}, {address.state} - {address.pincode}
                    </Text>
                    <Text style={styles.addressOptionPhone}>{address.phone}</Text>
                  </View>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={selectedAddress?.id === address.id ? "#00f5ff" : "transparent"} 
                  />
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.addAddressButtonModal}
                onPress={() => setShowNewAddressForm(true)}
              >
                <Ionicons name="add" size={24} color="#00f5ff" />
                <Text style={styles.addAddressText}>Add New Address</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Payment Selection Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {paymentMethods.map(payment => (
              <TouchableOpacity
                key={payment.id}
                style={[
                  styles.paymentOption,
                  selectedPayment?.id === payment.id && styles.selectedPaymentOption
                ]}
                onPress={() => {
                  setSelectedPayment(payment);
                  setShowPaymentModal(false);
                }}
              >
                <Ionicons 
                  name={payment.icon as any} 
                  size={24} 
                  color="#00f5ff" 
                />
                <View style={styles.paymentOptionDetails}>
                  <Text style={styles.paymentOptionName}>{payment.name}</Text>
                  <Text style={styles.paymentOptionInfo}>{payment.details}</Text>
                </View>
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color={selectedPayment?.id === payment.id ? "#00f5ff" : "transparent"} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  scrollContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  changeText: {
    color: '#00f5ff',
    fontSize: 14,
    fontWeight: '500',
  },
  productSummary: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  productThumbnail: {
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
    color: 'white',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  quantityLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00f5ff',
  },
  addressCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 10,
  },
  addressText: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  addAddressText: {
    color: '#00f5ff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  paymentDetails: {
    flex: 1,
    marginLeft: 15,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  paymentInfo: {
    fontSize: 14,
    color: '#777',
  },
  selectPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectPaymentText: {
    color: '#aaa',
    fontSize: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  summaryValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00f5ff',
  },
  fitcoinReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  fitcoinText: {
    color: '#00f5ff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#121212',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  placeOrderButton: {
    backgroundColor: '#00f5ff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    minWidth: 150,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#666',
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  selectedAddressOption: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
  },
  addressOptionContent: {
    flex: 1,
    marginRight: 15,
  },
  addressOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  addressOptionText: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  addressOptionPhone: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  addAddressButtonModal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  addressFormContainer: {
    padding: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 15,
    color: 'white',
    marginBottom: 15,
    fontSize: 16,
  },
  saveAddressButton: {
    backgroundColor: '#00f5ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveAddressButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  selectedPaymentOption: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
  },
  paymentOptionDetails: {
    flex: 1,
    marginLeft: 15,
    marginRight: 15,
  },
  paymentOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  paymentOptionInfo: {
    fontSize: 14,
    color: '#777',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  successSubText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});

export default BuyNow;