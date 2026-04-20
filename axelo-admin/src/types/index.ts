export interface SafariPackage {
  id: string;
  name: string;
  slug: string;
  destination: string;
  duration_days: number;
  price_usd: number;
  price_kes: number;
  group_size_min: number;
  group_size_max: number;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  images: string[];
  available: boolean;
  category: 'budget' | 'standard' | 'luxury' | 'custom';
  difficulty: 'easy' | 'moderate' | 'challenging';
  best_season: string[];
  itinerary?: {
    day: number;
    title: string;
    description: string;
    accommodation?: string;
    meals?: string;
  }[];
  created_at: string;
}

export interface Client {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  nationality?: string;
  passport_no?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  package_id: string;
  travel_date: string;
  return_date: string;
  num_adults: number;
  num_children: number;
  total_amount: number;
  currency: 'KES' | 'USD';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  special_requests?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  provider: 'intasend' | 'stripe';
  amount: number;
  currency: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata: any;
  created_at: string;
}

export interface ChatMessage {
  id?: string;
  session_token?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface CostSheet {
  id: string;
  name: string;
  package_id: string;
  destination: string;
  park_code: string;
  duration_days: number;
  num_adults: number;
  num_children: number;
  client_type: 'non_resident' | 'resident' | 'east_african';
  lodge_tier: string;
  property_id: string;
  transport_type: 'road' | 'charter_flight' | 'scheduled_flight';
  line_items: any[];
  total_cost_usd: number;
  markup_b2c_pct: number;
  markup_b2b_pct: number;
  contingency_pct: number;
  selling_price_b2c_usd: number;
  selling_price_b2b_usd: number;
  margin_usd: number;
  margin_pct: number;
  ai_analysis: string;
  created_at: string;
}

export interface Voucher {
  id: string;
  voucher_ref: string;
  booking_id: string;
  property_id: string;
  client_names: string[];
  check_in: string;
  check_out: string;
  num_adults: number;
  num_children: number;
  room_type: string;
  meal_plan: 'BB' | 'HB' | 'FB' | 'AI';
  special_requests: string;
  payment_status: 'paid_full' | 'deposit_paid' | 'direct_billing';
  payment_amount_usd: number;
  pdf_url: string;
  sent_at: string;
  lodge_confirmed_at: string;
  sent_to_email: string;
  created_at: string;
}

export interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  website?: string;
  phone?: string;
  country?: string;
  annual_pax?: number;
  partner_type: 'travel_agency' | 'cruise_line' | 'charter_airline' | 'wholesaler' | 'ota' | 'hotel' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  tier: 'silver' | 'gold' | 'platinum';
  api_key?: string;
  created_at: string;
}

export interface GroupQuote {
  id: string;
  partner_id: string;
  quote_ref: string;
  destination: string;
  travel_date: string;
  return_date?: string;
  pax_count: number;
  accommodation_requests: any[];
  activities: any[];
  transport_included: boolean;
  total_net_usd?: number;
  total_sell_usd?: number;
  margin_usd?: number;
  margin_pct?: number;
  notes?: string;
  line_items?: any[];
  valid_until?: string;
  status: 'draft' | 'submitted' | 'pending' | 'sent' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  partner?: Partner;
}

export interface CallLog {
  id: string;
  caller_phone: string;
  caller_name: string;
  duration_seconds: number;
  transcript: any[];
  summary: string;
  booking_intent_score: number;
  interested_package: string;
  sms_sent: boolean;
  created_at: string;
}
