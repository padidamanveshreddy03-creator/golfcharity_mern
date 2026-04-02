// Auth Types
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// Charity Types
export interface Charity {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  website_url?: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// Subscription Types
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_type: "monthly" | "yearly";
  status: "active" | "cancelled" | "expired" | "pending";
  amount_in_cents: number;
  currency: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// Score Types
export interface GolfScore {
  id: string;
  user_id: string;
  score: number;
  score_date: string;
  created_at: string;
}

// Draw Types
export interface Draw {
  id: string;
  draw_date: string;
  draw_numbers: number[];
  draw_mode: "random" | "algorithm";
  status: "simulated" | "published" | "archived";
  total_pool_amount_cents: number;
  five_match_pool_cents: number;
  four_match_pool_cents: number;
  three_match_pool_cents: number;
  five_match_winners_carried_over: boolean;
  results_published: boolean;
  published_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Winning Types
export interface Winning {
  id: string;
  user_id: string;
  draw_id: string;
  matches_count: 3 | 4 | 5;
  amount_won_cents: number;
  proof_image_url?: string;
  verification_status: "pending" | "approved" | "rejected";
  payment_status: "pending" | "paid";
  verified_by?: string;
  verified_at?: string;
  paid_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// User Charity Selection
export interface UserCharity {
  id: string;
  user_id: string;
  charity_id: string;
  contribution_percentage: number;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pricing Plans
export interface PricingPlan {
  id: string;
  type: "monthly" | "yearly";
  name: string;
  price: number;
  discount?: number;
  features: string[];
  stripePriceId: string;
}

// Draw Statistics
export interface DrawStats {
  total_players: number;
  total_pool_amount: number;
  five_match_winners: number;
  four_match_winners: number;
  three_match_winners: number;
}

// Admin Dashboard Stats
export interface AdminStats {
  total_users: number;
  active_subscriptions: number;
  total_revenue_cents: number;
  total_charity_contributions_cents: number;
  average_charity_percentage: number;
  total_players_participated: number;
}

// Stripe Types
export interface StripeCustomer {
  customerId: string;
  email: string;
  created: number;
}

export interface StripeSubscriptionData {
  subscriptionId: string;
  customerId: string;
  status: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
}
