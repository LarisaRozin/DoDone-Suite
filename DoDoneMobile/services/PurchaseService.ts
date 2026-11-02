/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
  Purchase,
  Product,
  ProductSubscription,
  PurchaseError,
} from 'react-native-iap';
import { Linking, Platform } from 'react-native';
import { SUBSCRIPTION_PRODUCT_IDS } from '../types/subscription';

export interface PurchaseProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: string;
  currency: string;
  type: 'subscription' | 'product';
}

type PurchaseListener = (purchase: Purchase) => void;
type ErrorListener = (error: PurchaseError) => void;

// const USE_MOCK_DATA = __DEV__; // or process.env.NODE_ENV === 'development'
const USE_MOCK_DATA = false; // or process.env.NODE_ENV === 'development'

/**
 * Service for managing in-app purchases using react-native-iap
 * Handles connection to stores, product fetching, and purchase flow
 */
class PurchaseService {
  private isInitialized = false;
  private purchaseUpdateSubscription: any;
  private purchaseErrorSubscription: any;
  private purchaseListeners: PurchaseListener[] = [];
  private errorListeners: ErrorListener[] = [];

  /**
   * Initialize connection to the store (App Store or Google Play)
   * Must be called before any other operations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('PurchaseService already initialized');
      return;
    }

    try {
      console.log('Initializing PurchaseService...');
      await initConnection();
      console.log('IAP connection initialized');

      this.isInitialized = true;
      console.log('PurchaseService initialized successfully');
      
      // Check for stuck transactions and log them, but don't try to clear
      // This allows testing to continue even with corrupted sandbox transactions
      try {
        const availablePurchases = await getAvailablePurchases();
        if (availablePurchases.length > 0) {
          console.log(`Found ${availablePurchases.length} pending transaction(s) on init:`);
          availablePurchases.forEach(p => {
            console.log(`  - ${p.productId} (${p.transactionId}) from ${p.transactionDate}`);
          });
          console.log('Note: These will be ignored during new purchase attempts');
        }
      } catch (err) {
        console.warn('Could not check pending purchases on init:', err);
      }
    } catch (error) {
      console.error('Failed to initialize PurchaseService:', error);
      throw error;
    }
  }

  /**
   * Clean up and close connection to the store
   * Should be called when the app is closing or purchase flow is complete
   */
  async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }

      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      await endConnection();
      this.isInitialized = false;
      this.purchaseListeners = [];
      this.errorListeners = [];
      console.log('PurchaseService cleaned up');
    } catch (error) {
      console.error('Error cleaning up PurchaseService:', error);
    }
  }

  /**
   * Get available subscription products from the store
   */
  async getSubscriptionProducts(): Promise<PurchaseProduct[]> {
    this.ensureInitialized();

    // For development, return mock products
    if (USE_MOCK_DATA) {
      console.log('[DEV] Returning mock products for development');
      return [
        {
          productId: SUBSCRIPTION_PRODUCT_IDS.PRO_MONTHLY,
          title: 'DoDone Pro (Monthly)',
          description: 'Unlock all premium features',
          price: '6.99',
          localizedPrice: '$6.99',
          currency: 'USD',
          type: 'subscription',
        },
        {
          productId: SUBSCRIPTION_PRODUCT_IDS.PRO_YEARLY,
          title: 'DoDone Pro (Yearly)',
          description: 'Save 29%!',
          price: '59.99',
          localizedPrice: '$59.99',
          currency: 'USD',
          type: 'subscription',
        },
      ];
    }

    try {
      const productIds = Object.values(SUBSCRIPTION_PRODUCT_IDS);
      console.log('Fetching subscription products:', productIds);

      // Fetch subscriptions from the store
      const products = await fetchProducts({ skus: productIds, type: 'subs' });
      console.log('Subscriptions fetched:', products);

      return products.map((product) => this.mapProductToPurchaseProduct(product as ProductSubscription));
    } catch (error) {
      console.error('Failed to fetch subscription products:', error);
      throw error;
    }
  }

  /**
   * Map a Product/ProductSubscription to PurchaseProduct
   */
  private mapProductToPurchaseProduct(product: Product | ProductSubscription): PurchaseProduct {
    return {
      productId: product.id,
      title: product.title || product.displayName || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      localizedPrice: product.displayPrice || '',
      currency: product.currency || 'USD',
      type: 'subscription' as const,
    };
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<Purchase | null> {
    this.ensureInitialized();

    try {
      console.log('***Requesting subscription purchase:', productId);

      // Request purchase for subscriptions
      await requestPurchase({
        type: 'subs',
        request: {
          apple: { sku: productId },
          google: { skus: [productId] },
        },
      });

      console.log('***Purchase request sent successfully');
      // Purchase result will come through the purchase update listener
      return null;
    } catch (error: any) {
      console.error('***Failed to purchase subscription:', error);
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        productId,
      });
      throw error;
    }
  }

  /**
   * Finish a transaction after it has been processed
   * This is required to acknowledge the purchase with the store
   */
  async finishPurchase(purchase: Purchase): Promise<void> {
    try {
      console.log('Finishing transaction:', purchase.transactionId);
      await finishTransaction({ purchase, isConsumable: false });
      console.log('Transaction finished successfully');
    } catch (error) {
      console.error('Failed to finish transaction:', error);
      throw error;
    }
  }

  /**
   * Add a listener for purchase updates
   * Sets up the native listener on first call to avoid duplicates
   */
  addPurchaseListener(listener: PurchaseListener): () => void {
    this.purchaseListeners.push(listener);
    
    // Set up native listeners only once when first listener is added
    if (this.purchaseListeners.length === 1 && !this.purchaseUpdateSubscription) {
      console.log('Setting up native IAP listeners (first listener added)');
      this.purchaseUpdateSubscription = purchaseUpdatedListener((purchase: Purchase) => {
        console.log('Purchase updated:', purchase);
        this.notifyPurchaseListeners(purchase);
      });

      this.purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
        console.error('Purchase error:', error);
        this.notifyErrorListeners(error);
      });
    }
    
    // Return unsubscribe function
    return () => {
      this.purchaseListeners = this.purchaseListeners.filter(l => l !== listener);
      
      // Clean up native listeners when last listener is removed
      if (this.purchaseListeners.length === 0 && this.purchaseUpdateSubscription) {
        console.log('Removing native IAP listeners (last listener removed)');
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
        
        if (this.purchaseErrorSubscription) {
          this.purchaseErrorSubscription.remove();
          this.purchaseErrorSubscription = null;
        }
      }
    };
  }

  /**
   * Add a listener for purchase errors
   * Works with lazy listener setup in addPurchaseListener
   */
  addErrorListener(listener: ErrorListener): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all purchase listeners
   */
  private notifyPurchaseListeners(purchase: Purchase): void {
    this.purchaseListeners.forEach(listener => {
      try {
        listener(purchase);
      } catch (error) {
        console.error('Error in purchase listener:', error);
      }
    });
  }

  /**
   * Notify all error listeners
   */
  private notifyErrorListeners(error: PurchaseError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * Ensure the service is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('PurchaseService not initialized. Call initialize() first.');
    }
  }

  /**
   * Open the native subscription management screen
   * iOS: Opens Settings → Subscriptions
   * Android: Opens Google Play Store subscription page
   * 
   * NOTE: Wraps with additional error handling to catch uncaught Objective-C exceptions
   * that can occur when native modules throw errors not properly bridged to JS
   */
  async openSubscriptionManagement(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // iOS - opens Settings app to subscriptions
        const url = 'https://apps.apple.com/account/subscriptions';
        
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
          } else {
            throw new Error('Cannot open subscription management URL');
          }
        } catch (linkError) {
          // Catch potential native exceptions from Linking module
          console.error('Error opening iOS subscription link:', linkError);
          throw new Error('Failed to open subscription management on iOS');
        }
      } else {
        // Android - opens Play Store subscription page
        const packageName = 'com.larisarozin.dodone'; // Your app's package name
        const url = `https://play.google.com/store/account/subscriptions?package=${packageName}`;
        
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
          } else {
            throw new Error('Cannot open subscription management URL');
          }
        } catch (linkError) {
          console.error('Error opening Android subscription link:', linkError);
          throw new Error('Failed to open subscription management on Android');
        }
      }
    } catch (error) {
      console.error('Failed to open subscription management:', error);
      // Don't re-throw - let caller decide how to handle
      // This prevents unhandled exceptions from crashing the app
      throw new Error(`Subscription management unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Restore previous purchases
   * Useful when user reinstalls app or signs in on new device
   * 
   * NOTE: Wraps with additional error handling to catch uncaught Objective-C exceptions
   * that can occur when native IAP modules throw errors not properly bridged to JS
   */
  async restorePurchases(): Promise<void> {
    this.ensureInitialized();

    try {
      console.log('Restoring purchases...');
      
      try {
        const purchases = await getAvailablePurchases();
        console.log('Available purchases found:', purchases);

        // Process each purchase through the listeners
        for (const purchase of purchases) {
          try {
            this.notifyPurchaseListeners(purchase);
          } catch (listenerError) {
            console.error('Error notifying purchase listener:', listenerError);
            // Continue processing other purchases even if one fails
          }
        }

        console.log('Restore purchases completed');
      } catch (iapError) {
        // Catch potential native exceptions from react-native-iap
        console.error('Error during IAP restore:', iapError);
        throw new Error(`Failed to restore purchases: ${iapError instanceof Error ? iapError.message : String(iapError)}`);
      }
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      // Don't re-throw - let caller decide how to handle
      throw new Error(`Failed to restore purchases: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get currently available purchases (for debugging)
   * Returns all purchases that haven't been finished
   */
  async getAvailablePurchases(): Promise<Purchase[]> {
    this.ensureInitialized();

    try {
      const purchases = await getAvailablePurchases();
      console.log('Current available purchases:', purchases);
      return purchases;
    } catch (error) {
      console.error('Failed to get available purchases:', error);
      throw error;
    }
  }

  /**
   * Clear all pending/cached purchases by finishing them
   * This is useful for TestFlight testing when you need to reset the purchase state
   */
  async clearPendingPurchases(): Promise<void> {
    this.ensureInitialized();

    try {
      console.log('Clearing pending purchases...');
      const purchases = await getAvailablePurchases();
      
      if (purchases.length === 0) {
        console.log('No pending purchases to clear');
        return;
      }

      console.log(`Found ${purchases.length} pending purchase(s):`);
      purchases.forEach(p => {
        console.log(`  - ${p.productId} (${p.transactionId})`);
      });
      
      for (const purchase of purchases) {
        try {
          console.log(`Finishing: ${purchase.productId} - ${purchase.transactionId}`);
          await finishTransaction({ purchase, isConsumable: false });
          console.log(`✓ Cleared: ${purchase.transactionId}`);
        } catch (err) {
          console.warn(`Could not finish ${purchase.transactionId}:`, err);
          // Don't throw - continue with other purchases
        }
      }

      console.log('Pending purchase cleanup completed');
    } catch (error) {
      console.error('Failed to clear pending purchases:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new PurchaseService();
