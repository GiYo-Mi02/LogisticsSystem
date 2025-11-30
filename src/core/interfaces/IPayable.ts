/**
 * IPayable Interface
 * ==================
 * ABSTRACTION: Defines a contract for entities that can process payments.
 * 
 * This interface abstracts the payment processing logic, allowing
 * different payment methods to be implemented without changing
 * the calling code.
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
