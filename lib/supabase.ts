import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@supabase/supabase-js";

function normalizeEnv(value: string | undefined): string {
  return (value || "").trim().replace(/^['\"]|['\"]$/g, "");
}

const supabaseUrl = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const supabaseServiceKey = normalizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
const hasValidSupabaseUrl = /^https?:\/\//i.test(supabaseUrl);
const hasSupabaseAnonKey = supabaseAnonKey.length > 0;
const hasSupabaseServiceKey = supabaseServiceKey.length > 0;

export const isSupabaseClientConfigured =
  hasValidSupabaseUrl && hasSupabaseAnonKey;
export const isSupabaseServerConfigured =
  hasValidSupabaseUrl && hasSupabaseServiceKey;

const fallbackUrl = "https://placeholder.supabase.co";
const fallbackAnonKey = "public-anon-key-placeholder";
const fallbackServiceRoleKey = "service-role-key-placeholder";

function getSupabaseClientConfigError(): string {
  if (!hasValidSupabaseUrl) {
    return "NEXT_PUBLIC_SUPABASE_URL is missing or invalid";
  }

  if (!hasSupabaseAnonKey) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing";
  }

  return "Supabase client configuration is invalid";
}

export function assertSupabaseClientConfigured() {
  if (!isSupabaseClientConfigured) {
    throw new Error(getSupabaseClientConfigError());
  }
}

export function assertSupabaseServerConfigured() {
  if (!isSupabaseServerConfigured) {
    throw new Error(
      "Server Supabase config is missing. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
}

// Client-side Supabase client (uses anon key)
const browserSupabaseConfig = {
  url: isSupabaseClientConfigured ? supabaseUrl : fallbackUrl,
  key: isSupabaseClientConfigured ? supabaseAnonKey : fallbackAnonKey,
};

const globalForSupabase = globalThis as typeof globalThis & {
  __golfCharitySupabaseClient?: ReturnType<typeof createClient>;
};

export const supabase =
  globalForSupabase.__golfCharitySupabaseClient ||
  createClient(browserSupabaseConfig.url, browserSupabaseConfig.key);

if (typeof window !== "undefined") {
  globalForSupabase.__golfCharitySupabaseClient = supabase;
}

// Server-side Supabase client (uses service role key)
const serverSupabaseClient =
  typeof window === "undefined"
    ? createServerClient(
        hasValidSupabaseUrl ? supabaseUrl : fallbackUrl,
        hasSupabaseServiceKey ? supabaseServiceKey : fallbackServiceRoleKey,
        {
          auth: {
            persistSession: false,
          },
        },
      )
    : null;

export const supabaseServer =
  serverSupabaseClient ||
  createServerClient(fallbackUrl, fallbackServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

// Helper function to get current user
export async function getCurrentUser() {
  assertSupabaseClientConfigured();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Helper function to get user profile
export async function getUserProfile(userId: string) {
  assertSupabaseClientConfigured();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

// Helper function to check subscription status
export async function checkSubscriptionStatus(userId: string) {
  assertSupabaseClientConfigured();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Helper function to get user's last 5 scores
export async function getUserScores(userId: string) {
  assertSupabaseClientConfigured();
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", userId)
    .order("score_date", { ascending: false })
    .limit(5);

  if (error) throw error;
  return data || [];
}

// Helper function to get user's charity selection
export async function getUserCharity(userId: string) {
  assertSupabaseClientConfigured();
  const { data, error } = await supabase
    .from("user_charity")
    .select("*, charities(*)")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Helper function to upload image to storage
export async function uploadImage(
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  assertSupabaseClientConfigured();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

// Helper function to get all charities
export async function getAllCharities() {
  assertSupabaseClientConfigured();
  const { data, error } = await supabase
    .from("charities")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Helper function to get featured charity
export async function getFeaturedCharity() {
  assertSupabaseClientConfigured();
  const { data, error } = await supabase
    .from("charities")
    .select("*")
    .eq("is_featured", true)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}
