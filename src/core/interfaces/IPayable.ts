/**
 * IPayable Interface - Payment Contract
 * ==================
 * @interface IPayable
 * @description Defines a contract for entities that can process payments.
 * Demonstrates ABSTRACTION by abstracting payment processing logic.
 * 
 * Allows different payment methods (credit card, PayPal, crypto) to be
 * implemented without changing the calling code.
 * 
 * @example
 * ```typescript
 * async function processOrder(payable: IPayable, amount: number) {
 *   const result = await payable.processPayment(amount);
 *   if (result.success) {
 *     console.log(`Payment successful: ${result.transactionId}`);
 *   }
 * }
 * 
 * // Works with any IPayable implementation:
 * await processOrder(shipment, 150.00);
 * await processOrder(subscription, 29.99);
 * ```
 * 
 * @see Shipment
 * @see PaymentResult
 * @see PaymentRecord
 */
export interface IPayable {
    /**
     * Process a payment for a given amount
     * @param amount The amount to charge
     * @returns Transaction result
     */
    processPayment(amount: number): Promise<PaymentResult>;

    /**
     * Refund a previous payment
     * @param transactionId The original transaction ID
     * @param amount Amount to refund (partial refunds supported)
     */
    refund(transactionId: string, amount: number): Promise<PaymentResult>;

    /**
     * Get payment history
     */
    getPaymentHistory(): PaymentRecord[];
}

export interface PaymentResult {
    success: boolean;
    transactionId: string;
    amount: number;
    timestamp: Date;
    message: string;
}

export interface PaymentRecord {
    transactionId: string;
    amount: number;
    type: 'CHARGE' | 'REFUND' | 'PAYMENT';
    status: 'COMPLETED' | 'PENDING' | 'FAILED';
    timestamp: Date;
}
