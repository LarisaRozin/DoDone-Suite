/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth, useConfig } from '@larisarozin/dodone-shared';
// import { AppState, AppStateStatus, Platform } from 'react-native';
import { Platform } from 'react-native';
import SubscriptionService from '../services/SubscriptionService';
import PurchaseService, { PurchaseProduct } from '../services/PurchaseService';
import { Purchase, PurchaseError, getReceiptIOS, getTransactionJwsIOS } from 'react-native-iap';
// import { WindowFrameHelper } from '../utils/WindowFrameHelper';
import {
  SubscriptionLimitsResponse,
  SubscriptionStatusResponse,
  SubscriptionTier,
  SubscriptionAction,
  ValidateSubscriptionActionResponse,
  VerifyPurchaseRequest,
} from '../types/subscription';

interface SubscriptionContextType {
  // State
  limits: SubscriptionLimitsResponse | null;
  status: SubscriptionStatusResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Purchase state
  products: PurchaseProduct[];
  isLoadingProducts: boolean;
  isPurchasing: boolean;
  purchaseError: string | null;
  purchaseSuccess: boolean;

  // Actions
  refreshLimits: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  validateAction: (action: SubscriptionAction) => Promise<ValidateSubscriptionActionResponse>;
  handleSubscriptionUpdate: () => Promise<void>;
  
  // Purchase actions
  initializePurchaseService: () => Promise<void>;
  loadProducts: () => Promise<void>;
  purchaseSubscription: (productId: string) => Promise<void>;
  clearPurchaseSuccess: () => void;
  simulatePurchaseSuccess: (productId: string) => Promise<void>; // For testing
  openSubscriptionManagement: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  clearPendingPurchases: () => Promise<void>; // For TestFlight debugging
  
  // Computed helpers
  isPro: boolean;
  isFree: boolean;
  canAddTeamMember: () => boolean;
  canAddAllowanceInterval: () => boolean;
  canAddTaskItem: () => boolean;
  hasFeature: (feature: keyof SubscriptionLimitsResponse) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

/**
 * Hook to access subscription context
 * Must be used within SubscriptionProvider
 */
export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

/**
 * Provider component for subscription state management
 * Automatically fetches subscription data when user is authenticated
 */
export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const authContext = useAuth();
  const configContext = useConfig();

  const [limits, setLimits] = useState<SubscriptionLimitsResponse | null>(null);
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Purchase state
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  
  // Track explicitly requested purchases to filter out auto-reported pending ones on iOS
  const requestedPurchaseProductIdRef = useRef<string | null>(null);
  
  // Track processed transaction IDs to avoid re-processing on subsequent modal opens
  const processedTransactionIdsRef = useRef<Set<string>>(new Set());

  const baseUrl = configContext.baseUrl || '';
  const token = authContext.token || '';
  const isAuthenticated = !!authContext.token;
  
  // Track auth failures to stop polling spam
  // const authFailureCount = useRef(0);
  // const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch subscription limits from API
   */
  const refreshLimits = useCallback(async () => {
    if (!isAuthenticated || !baseUrl || !token) {
      setLimits(null);
      return;
    }
    
    // Validate token is a well-formed JWT to avoid spamming backend with malformed tokens
    const hasValidJwt = token && token.split('.').length === 3;
    if (!hasValidJwt) {
      console.warn('Token is not a valid JWT format, skipping subscription refresh');
      return;
    }
    
    // // Stop polling if we've had multiple auth failures
    // if (authFailureCount.current >= 2) {
    //   console.warn('Multiple auth failures detected, stopping subscription polling');
    //   return;
    // }

    try {
      setIsLoading(true);
      setError(null);
      const data = await SubscriptionService.getLimits(baseUrl, token);
      setLimits(data);
      // Reset failure count on success
      // authFailureCount.current = 0;
    } catch (err: any) {
      console.error('Failed to fetch subscription limits:', err);
      
      // // Check if it's a 401 auth error
      // if (err?.status === 401 || err?.message?.includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
      //   authFailureCount.current++;
      //   console.warn(`Auth failure ${authFailureCount.current} while fetching limits`);
        
      //   // Stop polling on repeated auth failures
      //   if (authFailureCount.current >= 2 && pollingIntervalRef.current) {
      //     clearInterval(pollingIntervalRef.current);
      //     pollingIntervalRef.current = null;
      //     console.warn('Stopped subscription polling due to repeated auth failures');
      //   }
      // }
      
      setError(err.message || 'Failed to fetch subscription limits');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, baseUrl, token]);

  /**
   * Fetch subscription status from API
   */
  const refreshStatus = useCallback(async () => {
    if (!isAuthenticated || !baseUrl || !token) {
      setStatus(null);
      return;
    }
    
    // Validate token is a well-formed JWT to avoid spamming backend with malformed tokens
    const hasValidJwt = token && token.split('.').length === 3;
    if (!hasValidJwt) {
      console.warn('Token is not a valid JWT format, skipping subscription refresh');
      return;
    }
    
    // Stop polling if we've had multiple auth failures
    // if (authFailureCount.current >= 2) {
    //   console.warn('Multiple auth failures detected, stopping subscription polling');
    //   return;
    // }

    try {
      setIsLoading(true);
      setError(null);
      const data = await SubscriptionService.getStatus(baseUrl, token);
      setStatus(data);
      // Reset failure count on success
      // authFailureCount.current = 0;
    } catch (err: any) {
      console.error('Failed to fetch subscription status:', err);
      
      // // Check if it's a 401 auth error
      // if (err?.status === 401 || err?.message?.includes('401') || err?.message?.toLowerCase().includes('unauthorized')) {
      //   authFailureCount.current++;
      //   console.warn(`Auth failure ${authFailureCount.current} while fetching status`);
        
      //   // Stop polling on repeated auth failures
      //   if (authFailureCount.current >= 2 && pollingIntervalRef.current) {
      //     clearInterval(pollingIntervalRef.current);
      //     pollingIntervalRef.current = null;
      //     console.warn('Stopped subscription polling due to repeated auth failures');
      //   }
      // }
      
      setError(err.message || 'Failed to fetch subscription status');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, baseUrl, token]);

  // // TODO: disable polling and implement push notifications for subscription updates
  // useEffect(() => {
  //   if (!isAuthenticated) return;

  //   const startForegroundInterval = () => {
  //     // Only start if app is actually in foreground
  //     if (AppState.currentState !== 'active') {
  //       console.log('App not active, skipping polling start');
  //       return;
  //     }
      
  //     if (pollingIntervalRef.current) {
  //       clearInterval(pollingIntervalRef.current);
  //     }
  //     // Reset auth failure count when app comes to foreground
  //     authFailureCount.current = 0;
      
  //     // Refresh immediately, then every 3 minutes while foregrounded
  //     refreshLimits();
  //     refreshStatus();
  //     pollingIntervalRef.current = setInterval(() => {
  //       // Double-check app is still active before polling
  //       if (AppState.currentState === 'active') {
  //         refreshLimits();
  //         refreshStatus();
  //       }
  //     }, 3 * 60 * 1000);
  //   };

  //   const stopForegroundInterval = () => {
  //     if (pollingIntervalRef.current) {
  //       console.log('Stopping subscription polling (app backgrounded)');
  //       clearInterval(pollingIntervalRef.current);
  //       pollingIntervalRef.current = null;
  //     }
  //   };

  //   const handleAppStateChange = (nextAppState: AppStateStatus) => {
  //     if (nextAppState === 'active') {
  //       console.log('App foregrounded - starting subscription polling');
  //       startForegroundInterval();
  //     } else {
  //       console.log('App backgrounded - stopping subscription polling');
  //       stopForegroundInterval();
  //     }
  //   };

  //   // Only start polling if app is already active
  //   if (AppState.currentState === 'active') {
  //     startForegroundInterval();
  //   }

  //   const subscription = AppState.addEventListener('change', handleAppStateChange);

  //   return () => {
  //     subscription.remove();
  //     stopForegroundInterval();
  //   };
  // }, [isAuthenticated, refreshLimits, refreshStatus]);

  /**
   * Validate if an action is allowed
   */
  const validateAction = useCallback(
    async (action: SubscriptionAction): Promise<ValidateSubscriptionActionResponse> => {
      if (!isAuthenticated || !baseUrl || !token) {
        return {
          isAllowed: false,
          reason: 'Not authenticated',
          upgradeRequired: SubscriptionTier.Pro,
          currentTier: SubscriptionTier.Free,
        };
      }

      try {
        const response = await SubscriptionService.validateAction(baseUrl, token, { action });
        return response;
      } catch (err: any) {
        console.error('Failed to validate action:', err);
        return {
          isAllowed: false,
          reason: err.message || 'Failed to validate action',
          upgradeRequired: SubscriptionTier.Pro,
          currentTier: limits?.subscriptionTier || SubscriptionTier.Free,
        };
      }
    },
    [isAuthenticated, baseUrl, token, limits]
  );

  /**
   * Load subscription data on mount and when auth changes
   * NOTE: PurchaseService initialization is handled lazily by initializePurchaseService()
   * when the UpgradeModal opens, not here on auth change
   */
  useEffect(() => {
    if (isAuthenticated && baseUrl && token) {
      refreshLimits();
      refreshStatus();
    } else {
      // Clear subscription data when user logs out
      setLimits(null);
      setStatus(null);
      setProducts([]);
      setPurchaseError(null);
      setPurchaseSuccess(false);
      setIsLoadingProducts(false);
      setIsPurchasing(false);
      setError(null);
      
      // Clear processed transaction IDs
      processedTransactionIdsRef.current.clear();
      
      // Clean up PurchaseService when user logs out to prevent dangling listeners
      PurchaseService.cleanup().catch((err) => {
        console.error('Error cleaning up PurchaseService on logout:', err);
      });
    }
  }, [isAuthenticated, baseUrl, token, refreshLimits, refreshStatus]);

  /**
   * Initialize the purchase service (IAP connection)
   */
  const initializePurchaseService = useCallback(async () => {
    try {
      console.log('Initializing purchase service...');
      await PurchaseService.initialize();
      console.log('Purchase service initialized');
    } catch (err: any) {
      console.error('Failed to initialize purchase service:', err);
      setPurchaseError(err.message || 'Failed to initialize purchase service');
      throw err;
    }
  }, []);

  /**
   * Load available subscription products from the store
   */
  const loadProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      setPurchaseError(null);
      console.log('Loading subscription products...');
      
      const fetchedProducts = await PurchaseService.getSubscriptionProducts();
      console.log('Products loaded:', fetchedProducts);
      setProducts(fetchedProducts);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setPurchaseError(err.message || 'Failed to load subscription products');
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  /**
   * Purchase a subscription
   */
  const purchaseSubscription = useCallback(async (productId: string) => {
    if (!isAuthenticated || !baseUrl || !token) {
      setPurchaseError('Please log in to purchase a subscription');
      return;
    }

    try {
      setIsPurchasing(true);
      setPurchaseError(null);
      // Track that this purchase was explicitly requested by the user
      requestedPurchaseProductIdRef.current = productId;
      console.log('Starting purchase flow for:', productId);

      // Initiate purchase
      await PurchaseService.purchaseSubscription(productId);
      
      // Note: The actual purchase completion is handled by the purchase listener
      // which will verify with the backend and update subscription status
      
      // Add a timeout to prevent infinite spinner if listeners never fire
      // This can happen if the purchase was already owned or other edge cases
      setTimeout(() => {
        if (requestedPurchaseProductIdRef.current === productId) {
          console.warn('Purchase timeout: listener did not fire within 60 seconds');
          setIsPurchasing(false);
          requestedPurchaseProductIdRef.current = null;
          setPurchaseError('Purchase verification timed out. Please check your subscription status.');
        }
      }, 60000); // 60 second timeout
    } catch (err: any) {
      console.error('Purchase failed:', err);
      
      // Clear the requested product ID on error
      requestedPurchaseProductIdRef.current = null;
      
      // Handle user cancellation gracefully
      if (err.code === 'E_USER_CANCELLED') {
        console.log('User cancelled purchase');
        setPurchaseError(null); // Don't show error for user cancellation
      } else if (err.code === 'E_ALREADY_OWNED' || err.message?.toLowerCase().includes('already owned')) {
        console.log('***Item already owned error - will auto-clear cached purchases');
        // Auto-clear cached purchases and provide user-friendly error
        setPurchaseError(
          'Apple Sandbox: Item Already Owned\n\n' +
          'Clearing cached purchases automatically...\n\n' +
          'After clearing completes, please try your purchase again.'
        );
        
        // Automatically clear cached purchases in the background
        try {
          console.log('Auto-clearing pending purchases due to already-owned error');
          await PurchaseService.clearPendingPurchases();
          console.log('Auto-clear completed successfully');
          setPurchaseError(
            'Cached purchases cleared! ✓\n\n' +
            'You can now try your purchase again.'
          );
        } catch (clearErr) {
          console.error('Failed to auto-clear pending purchases:', clearErr);
          setPurchaseError(
            'Apple Sandbox Error: This subscription appears as "already owned".\n\n' +
            'To fix this:\n\n' +
            '1. Go to Subscription Management screen\n' +
            '2. Tap "Clear Cached Purchases"\n' +
            '3. Come back and try again\n\n' +
            'If that doesn\'t work:\n' +
            '• Settings > App Store > Sandbox Account > Sign Out\n' +
            '• Wait 30 seconds\n' +
            '• Sign in with a DIFFERENT test account\n' +
            '• Force close app and reopen'
          );
        }
      } else {
        setPurchaseError(err.message || 'Failed to complete purchase');
      }
      setIsPurchasing(false);
    }
  }, [isAuthenticated, baseUrl, token]);

  /**
   * Handle purchase updates from the store
   * CRITICAL: This effect should ONLY depend on auth state, not on the handler functions
   * Listeners must remain stable to catch all purchase events
   */
  useEffect(() => {
    if (!isAuthenticated || !baseUrl || !token) {
      return;
    }

    const getIosReceiptData = async (purchase: Purchase) => {
      if ((purchase as any).transactionReceipt) {
        return (purchase as any).transactionReceipt;
      }

      try {
        // Fetch the app receipt if the transaction receipt is missing
        const refreshed = await getReceiptIOS();
        return refreshed || null;
      } catch (err) {
        console.error('Failed to fetch iOS receipt via getReceiptIOS:', err);
        return null;
      }
    };

    const handlePurchase = async (purchase: Purchase) => {
      try {
        const txId = purchase.transactionId || purchase.productId;
        
        console.log('Processing purchase:', {
          productId: purchase.productId,
          transactionId: purchase.transactionId,
          transactionDate: purchase.transactionDate,
          requestedProductId: requestedPurchaseProductIdRef.current,
          alreadyProcessed: processedTransactionIdsRef.current.has(txId),
        });

        // Skip if we've already processed this transaction
        if (processedTransactionIdsRef.current.has(txId)) {
          console.log(`⏭️ Transaction ${txId} already processed, skipping`);
          return;
        }

        // On iOS, filter out purchases that weren't explicitly requested by the user
        // This prevents auto-triggering of pending/unfinished purchases when the listener attaches
        if (Platform.OS === 'ios') {
          if (requestedPurchaseProductIdRef.current !== purchase.productId) {
            console.log(
              `⚠️ Product mismatch: requested=${requestedPurchaseProductIdRef.current}, received=${purchase.productId} (${purchase.transactionId})`
            );
            console.log('This is likely a stuck transaction from a previous session');
            console.log('Silently finishing it without re-verification (was already verified before)');
            
            // Silently finish old transactions without re-verification
            // They were already verified in a previous session
            try {
              await PurchaseService.finishPurchase(purchase);
              processedTransactionIdsRef.current.add(txId);
              console.log(`✓ Old transaction ${txId} finished and marked as processed`);
            } catch (finishErr) {
              console.error(`Failed to finish old transaction ${txId}:`, finishErr);
            }
            return;
          }
        }

        // Prepare verification request based on platform
        let verifyRequest: VerifyPurchaseRequest;

        if (Platform.OS === 'ios') {
          // PREFER StoreKit 2 JWT (via getTransactionJwsIOS) over StoreKit 1 (receipt)
          console.log('Attempting to fetch StoreKit 2 JWT...');
          let signedTransactionInfo: string | undefined;
          
          try {
            // getTransactionJwsIOS returns the JWT string directly
            signedTransactionInfo = await getTransactionJwsIOS(purchase.productId);
            if (signedTransactionInfo) {
              console.log('✓ StoreKit 2 JWT retrieved successfully');
              console.log('signedTransactionInfo length:', signedTransactionInfo.length);
            } else {
              console.log('getTransactionJwsIOS returned null/undefined');
            }
          } catch (jwtErr) {
            console.log('Failed to fetch StoreKit 2 JWT:', jwtErr);
          }
          
          if (signedTransactionInfo) {
            console.log('✓ Using StoreKit 2 for verification (preferred)');
            
            verifyRequest = {
              productId: purchase.productId,
              platform: Platform.OS,
              signedTransactionInfo,
            };
          } else {
            // Fall back to StoreKit 1 receipt
            console.log('StoreKit 2 data not available, falling back to StoreKit 1 receipt');
            const receiptData = await getIosReceiptData(purchase);
            console.log('StoreKit 1 receipt data length:', receiptData ? receiptData.length : 0);

            if (!receiptData) {
              console.error('❌ Neither StoreKit 2 nor StoreKit 1 data available');
              console.error('This is a known issue with Apple Sandbox environment');
              console.error('Purchase details:', {
                productId: purchase.productId,
                transactionId: purchase.transactionId,
                transactionDate: purchase.transactionDate,
              });
              
              // Finish the transaction so it doesn't stay pending
              try {
                await PurchaseService.finishPurchase(purchase);
                console.log('✓ Transaction finished (will be verified via webhook)');
              } catch (finishErr) {
                console.error('Failed to finish transaction:', finishErr);
              }
              
              // Show user-friendly message
              setPurchaseError(
                'Purchase completed but receipt unavailable.\n\n' +
                  'Your subscription will be activated when Apple sends the webhook notification.\n\n' +
                  'Check Subscription Management in a few minutes.'
              );
              setPurchaseSuccess(true); // Show success UI even though verification failed
              setIsPurchasing(false);
              requestedPurchaseProductIdRef.current = null;
              return;
            }

            verifyRequest = {
              productId: purchase.productId,
              transactionId: purchase.transactionId || '',
              platform: Platform.OS,
              receiptData,
            };
          }
        } else {
          verifyRequest = {
            productId: purchase.productId,
            transactionId: purchase.transactionId || '',
            platform: Platform.OS,
            purchaseToken: (purchase as any).purchaseToken || '',
          };
        }

        // Verify purchase with backend
        console.log('Verifying purchase with backend...');
        console.log('Verification request:', {
          productId: verifyRequest.productId,
          transactionId: verifyRequest.transactionId,
          platform: verifyRequest.platform,
          hasReceipt: Platform.OS === 'ios' ? !!verifyRequest.receiptData : !!verifyRequest.purchaseToken,
        });
        
        const verifyResult = await SubscriptionService.verifyPurchase(
          baseUrl, 
          token, 
          verifyRequest
        );

        console.log('✓ Purchase verified successfully:', verifyResult);

        // Finish the transaction
        await PurchaseService.finishPurchase(purchase);
        
        // Mark as processed
        processedTransactionIdsRef.current.add(txId);

        // Refresh subscription status
        await refreshLimits();
        await refreshStatus();

        // Fix iOS window frame issue after StoreKit modal dismissal
        // The StoreKit payment sheet can cause the window to shrink with black borders
        // if (Platform.OS === 'ios') {
        //   await WindowFrameHelper.resetWindowFrame();
        // }

        setPurchaseSuccess(true);
        setPurchaseError(null);
        // Clear the requested product ID after successful completion
        requestedPurchaseProductIdRef.current = null;
        console.log('Purchase completed successfully');
      } catch (err: any) {
        console.error('❌ Failed to verify purchase:', err);
        console.error('Error details:', {
          message: err?.message,
          status: err?.status,
          response: err?.response?.data,
          stack: err?.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
        });
        
        // IMPORTANT: Finish the transaction even on error to prevent it from staying pending
        try {
          await PurchaseService.finishPurchase(purchase);
          console.log('✓ Transaction finished after verification failure');
        } catch (finishErr) {
          console.error('❌ Failed to finish transaction after error:', finishErr);
        }
        
        // Provide detailed error message to user
        let errorMessage = 'Failed to verify purchase with server';
        if (err?.status === 401 || err?.message?.includes('401')) {
          errorMessage = 'Authentication failed. Please log out and log back in.';
        } else if (err?.status >= 500) {
          errorMessage = 'Server error. Your purchase may still process. Check Subscription Management.';
        } else if (err?.message) {
          errorMessage = `Verification failed: ${err.message}`;
        }
        
        setPurchaseError(errorMessage);
        // Clear the requested product ID after error
        requestedPurchaseProductIdRef.current = null;
      } finally {
        setIsPurchasing(false);
      }
    };

    const handlePurchaseFailed = async (purchaseErr: PurchaseError) => {
      console.error('Purchase error from store:', purchaseErr);
      
      // Clear the requested product ID on error
      requestedPurchaseProductIdRef.current = null;
      
      // Handle user cancellation gracefully
      if ((purchaseErr as any).code === 'E_USER_CANCELLED') {
        console.log('User cancelled purchase');
        setPurchaseError(null);
      } else if ((purchaseErr as any).code === 'E_ALREADY_OWNED' || (purchaseErr as any).code === 'already-owned' || purchaseErr.message?.toLowerCase().includes('already owned')) {
        console.log('⚠️ Already-owned error detected - checking for stuck transactions');
        
        // Check what's actually pending now
        try {
          const pending = await PurchaseService.getAvailablePurchases();
          
          if (pending.length > 0) {
            console.log(`Found ${pending.length} stuck transaction(s):`);
            pending.forEach(p => {
              console.log(`  - ${p.productId} (${p.transactionId}) from ${new Date(p.transactionDate).toISOString()}`);
            });
            
            // Try to aggressively clear ALL pending transactions
            console.log('Attempting to clear all stuck transactions...');
            await PurchaseService.clearPendingPurchases();
            
            // Verify they're gone
            const stillPending = await PurchaseService.getAvailablePurchases();
            if (stillPending.length > 0) {
              console.error(`❌ ${stillPending.length} transaction(s) could not be cleared - Apple Sandbox is corrupted`);
              setPurchaseError(
                `⚠️ ${stillPending.length} Stuck Transaction(s)\n\n` +
                `Transactions: ${stillPending.map(p => p.transactionId).join(', ')}\n\n` +
                `These are permanently stuck in Apple Sandbox.\n\n` +
                `✅ WORKAROUND:\n` +
                `Try the YEARLY subscription instead.\n\n` +
                `OR\n\n` +
                `Settings > App Store > Sandbox Account\n` +
                `Sign out and use a DIFFERENT test account.`
              );
            } else {
              console.log('✓ All transactions cleared successfully!');
              setPurchaseError(
                'Stuck transactions cleared! ✓\n\n' +
                'Please try your purchase again now.'
              );
            }
          } else {
            console.warn('Already-owned error but no pending transactions found');
            setPurchaseError(
              'Item appears as "already owned" but no pending transactions found.\n\n' +
              'This might be a transient Apple Sandbox issue.\n\n' +
              'Please wait 30 seconds and try again.'
            );
          }
        } catch (clearErr) {
          console.error('Failed during stuck transaction check/clear:', clearErr);
          setPurchaseError(
            'Could not resolve "already owned" error.\n\n' +
            'Please try:\n' +
            '1. Wait 30 seconds and retry\n' +
            '2. Subscription Management > Clear Cached Purchases\n' +
            '3. Try the YEARLY subscription instead\n' +
            '4. Use a different Sandbox test account'
          );
        }
      } else {
        setPurchaseError(purchaseErr.message || 'Purchase failed');
      }
      setIsPurchasing(false);
    };

    // Subscribe to purchase updates
    const unsubscribePurchase = PurchaseService.addPurchaseListener(handlePurchase);
    const unsubscribeError = PurchaseService.addErrorListener(handlePurchaseFailed);

    return () => {
      unsubscribePurchase();
      unsubscribeError();
    };
    // CRITICAL: Only depend on auth state - do NOT include refreshLimits/refreshStatus
    // Those functions change frequently and would cause listeners to be torn down/recreated
    // which can cause purchases to be lost
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, baseUrl, token]);

  /**
   * Clear purchase success state
   */
  const clearPurchaseSuccess = useCallback(() => {
    setPurchaseSuccess(false);
  }, []);

  /**
   * Simulate a successful purchase for testing (DEV only)
   * This bypasses the store and directly updates subscription status
   */
  const simulatePurchaseSuccess = useCallback(async (productId: string) => {
    if (!__DEV__) {
      console.warn('simulatePurchaseSuccess should only be used in development');
      return;
    }

    try {
      setIsPurchasing(true);
      setPurchaseError(null);
      console.log('[DEV] Simulating successful purchase for:', productId);

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real scenario, you'd call your backend here
      // For now, just refresh to get updated subscription status from backend
      await refreshLimits();
      await refreshStatus();

      setPurchaseSuccess(true);
      console.log('[DEV] Simulated purchase completed');
    } catch (err: any) {
      console.error('[DEV] Simulated purchase failed:', err);
      setPurchaseError(err.message || 'Simulated purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  }, [refreshLimits, refreshStatus]);

  /**
   * Open native subscription management screen
   * Handles errors gracefully to prevent app crashes
   */
  const openSubscriptionManagement = useCallback(async () => {
    try {
      await PurchaseService.openSubscriptionManagement();
    } catch (err: any) {
      console.error('Failed to open subscription management:', err);
      // Don't re-throw - let the caller handle gracefully
      // This prevents unhandled exceptions from crashing the app
      throw new Error(err?.message || 'Failed to open subscription management');
    }
  }, []);

  /**
   * Restore previous purchases
   */
  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      await PurchaseService.restorePurchases();
      // Refresh subscription status after restore
      await refreshLimits();
      await refreshStatus();
    } catch (err: any) {
      console.error('Failed to restore purchases:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshLimits, refreshStatus]);

  /**
   * Clear pending/cached purchases
   * Useful for TestFlight testing to clear "already owned" errors after clearing Apple sandbox history
   */
  const clearPendingPurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      await PurchaseService.clearPendingPurchases();
      // Refresh subscription status after clearing
      await refreshLimits();
      await refreshStatus();
    } catch (err: any) {
      console.error('Failed to clear pending purchases:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshLimits, refreshStatus]);

  // Computed helpers
  const isPro = limits?.subscriptionTier === SubscriptionTier.Pro;
  const isFree = limits?.subscriptionTier === SubscriptionTier.Free || !limits;

  const canAddTeamMember = useCallback(() => {
    return limits?.teamMembersLimit.canAdd ?? false;
  }, [limits]);

  const canAddAllowanceInterval = useCallback(() => {
    return limits?.allowanceIntervalsLimit.canAdd ?? false;
  }, [limits]);

  const canAddTaskItem = useCallback(() => {
    return limits?.taskItemsLimit.canAdd ?? false;
  }, [limits]);

  const hasFeature = useCallback(
    (feature: keyof SubscriptionLimitsResponse): boolean => {
      if (!limits) return false;
      
      const value = limits[feature];
      // Boolean features
      if (typeof value === 'boolean') {
        return value;
      }
      // Object features (FeatureLimit)
      if (typeof value === 'object' && value !== null && 'canAdd' in value) {
        return (value as any).canAdd;
      }
      return false;
    },
    [limits]
  );

  /**
   * Handle subscription update from push notification
   * Refreshes both limits and status when a subscription_update notification is received
   */
  const handleSubscriptionUpdate = useCallback(async () => {
    console.log('Handling subscription update from push notification');
    try {
      await refreshLimits();
      await refreshStatus();
    } catch (err: any) {
      console.error('Error handling subscription update:', err);
    }
  }, [refreshLimits, refreshStatus]);

  const value: SubscriptionContextType = {
    limits,
    status,
    isLoading,
    error,
    products,
    isLoadingProducts,
    isPurchasing,
    purchaseError,
    purchaseSuccess,
    refreshLimits,
    refreshStatus,
    validateAction,
    handleSubscriptionUpdate,
    initializePurchaseService,
    loadProducts,
    purchaseSubscription,
    clearPurchaseSuccess,
    simulatePurchaseSuccess,
    openSubscriptionManagement,
    restorePurchases,
    clearPendingPurchases,
    isPro,
    isFree,
    canAddTeamMember,
    canAddAllowanceInterval,
    canAddTaskItem,
    hasFeature,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};
