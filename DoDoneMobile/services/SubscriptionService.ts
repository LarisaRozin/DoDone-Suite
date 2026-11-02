/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import { createApiClient } from '../utils/apiClientWrapper';
import {
  SubscriptionLimitsResponse,
  ValidateSubscriptionActionRequest,
  ValidateSubscriptionActionResponse,
  SubscriptionStatusResponse,
  VerifyPurchaseRequest,
  VerifyPurchaseResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  PurchaseReceiptResponse,
} from '../types/subscription';

/**
 * Service for managing subscription-related API calls
 * Wraps the dodone-shared ApiClient.subscriptions methods
 */
class SubscriptionService {
  /**
   * Get current subscription limits and usage
   */
  async getLimits(baseUrl: string, token: string): Promise<SubscriptionLimitsResponse> {
    const client = createApiClient(baseUrl, token);
    return await client.subscriptions.getLimits();
  }

  /**
   * Validate if a specific action is allowed based on current subscription tier
   */
  async validateAction(
    baseUrl: string,
    token: string,
    request: ValidateSubscriptionActionRequest
  ): Promise<ValidateSubscriptionActionResponse> {
    const client = createApiClient(baseUrl, token);
    return await client.subscriptions.validateAction(request);
  }

  /**
   * Get current subscription status
   */
  async getStatus(baseUrl: string, token: string): Promise<SubscriptionStatusResponse> {
    const client = createApiClient(baseUrl, token);
    return await client.subscriptions.getStatus();
  }

  /**
   * Verify an in-app purchase with the backend
   */
  async verifyPurchase(
    baseUrl: string,
    token: string,
    request: VerifyPurchaseRequest
  ): Promise<VerifyPurchaseResponse> {
    try {
      console.log('Calling backend verifyPurchase API...');
      console.log('Request:', {
        productId: request.productId,
        transactionId: request.transactionId,
        platform: request.platform,
      });
      
      const client = createApiClient(baseUrl, token);
      const result = await client.subscriptions.verifyPurchase(request);
      
      console.log('✓ Backend verification successful:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Backend verification failed:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      });
      throw error;
    }
  }

  /**
   * Cancel current subscription
   */
  async cancelSubscription(
    baseUrl: string,
    token: string,
    request: CancelSubscriptionRequest
  ): Promise<CancelSubscriptionResponse> {
    const client = createApiClient(baseUrl, token);
    return await client.subscriptions.cancelSubscription(request);
  }

  /**
   * Get purchase receipt/history
   */
  async getPurchaseReceipt(baseUrl: string, token: string): Promise<PurchaseReceiptResponse> {
    const client = createApiClient(baseUrl, token);
    return await client.subscriptions.getPurchaseReceipt();
  }
}

// Export singleton instance
export default new SubscriptionService();
