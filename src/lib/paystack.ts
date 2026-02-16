export const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      risk_action: string;
    };
    plan: any;
    order_id: string | null;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_id: string | null;
    source: string | null;
    fees_breakdown: any;
    transaction_date: string;
    plan_object: any;
    subaccount: {
      id: number;
      subaccount_code: string;
      business_name: string;
      description: string;
      primary_contact_name: string | null;
      primary_contact_email: string | null;
      primary_contact_phone: string | null;
      metadata: any;
      percentage_charge: number;
      settlement_bank: string;
      account_number: string;
    } | null;
  };
}

export async function initializeTransaction(params: {
  email: string;
  amount: number; // in NGN
  reference?: string;
  callback_url?: string;
  subaccount?: string;
  metadata?: any;
}) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not defined');

  // Paystack expects amount in kobo
  const amountInKobo = Math.round(params.amount * 100);

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: amountInKobo,
      reference: params.reference,
      callback_url: params.callback_url || `${process.env.NEXT_PUBLIC_BASE_URL}/api/paystack/callback`,
      ...(params.subaccount ? { subaccount: params.subaccount } : {}),
      metadata: params.metadata,
    }),
  });

  const result: PaystackInitializeResponse = await response.json();
  if (!result.status) {
    throw new Error(result.message || 'Failed to initialize Paystack transaction');
  }

  return result.data;
}

export async function verifyTransaction(reference: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not defined');

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  const result: PaystackVerifyResponse = await response.json();
  if (!result.status) {
    throw new Error(result.message || 'Failed to verify Paystack transaction');
  }

  return result.data;
}
