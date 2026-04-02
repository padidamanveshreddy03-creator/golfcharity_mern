import { supabaseServer as supabase } from "./supabase";

/**
 * Generate random draw numbers (5 numbers between 1-45)
 */
export function generateRandomDrawNumbers(): number[] {
  const numbers = new Set<number>();
  while (numbers.size < 5) {
    const num = Math.floor(Math.random() * 45) + 1;
    numbers.add(num);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Generate algorithm-based draw numbers based on score frequency
 * More frequent scores have higher probability of being drawn
 */
export async function generateAlgorithmDrawNumbers(
  excludeDates: Date[] = [],
): Promise<number[]> {
  // Get all scores from the last draw period
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: scores, error } = await supabase
    .from("scores")
    .select("score")
    .gte("score_date", thirtyDaysAgo.toISOString().split("T")[0]);

  if (error) {
    console.error("Error fetching scores:", error);
    return generateRandomDrawNumbers();
  }

  if (!scores || scores.length === 0) {
    return generateRandomDrawNumbers();
  }

  // Calculate frequency of each score
  const frequency = new Map<number, number>();
  for (let i = 1; i <= 45; i++) {
    frequency.set(i, 0);
  }

  scores.forEach((s: { score: number }) => {
    frequency.set(s.score, (frequency.get(s.score) || 0) + 1);
  });

  // Weighted selection based on frequency
  const selectedNumbers = new Set<number>();

  while (selectedNumbers.size < 5) {
    const totalFrequency = Array.from(frequency.values()).reduce(
      (a, b) => a + b,
      0,
    );
    let random = Math.random() * totalFrequency;

    for (let [num, freq] of frequency.entries()) {
      if (!selectedNumbers.has(num)) {
        random -= freq;
        if (random <= 0) {
          selectedNumbers.add(num);
          break;
        }
      }
    }
  }

  return Array.from(selectedNumbers).sort((a, b) => a - b);
}

/**
 * Match user scores against draw numbers
 */
export function matchScores(
  userScores: number[],
  drawNumbers: number[],
): number {
  return userScores.filter((score) => drawNumbers.includes(score)).length;
}

/**
 * Calculate winnings based on matches
 */
export function calculateWinnings(
  matchesCount: number,
  poolAmount: number,
  winnersCount: number,
): number {
  if (matchesCount < 3 || winnersCount === 0) {
    return 0;
  }

  return Math.floor(poolAmount / winnersCount);
}

/**
 * Run a draw (simulate or publish)
 */
export async function runDraw(
  drawDate: string,
  mode: "random" | "algorithm" = "random",
): Promise<{
  drawNumbers: number[];
  winners: {
    five: Array<{ user_id: string; amount: number }>;
    four: Array<{ user_id: string; amount: number }>;
    three: Array<{ user_id: string; amount: number }>;
  };
  stats: {
    totalParticipants: number;
    totalPoolAmount: number;
    fiveMatchers: number;
    fourMatchers: number;
    threeMatchers: number;
  };
}> {
  try {
    // Generate draw numbers
    const drawNumbers =
      mode === "random"
        ? generateRandomDrawNumbers()
        : await generateAlgorithmDrawNumbers();

    // Get all active subscriptions to find participating users
    const { data: activeSubscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active")
      .lte("current_period_start", drawDate)
      .gte("current_period_end", drawDate);

    if (subError) throw subError;

    const participatingUserIds =
      activeSubscriptions?.map((s) => s.user_id) || [];

    // Get last 5 scores for each user
    const userScoresMap = new Map<string, number[]>();

    for (const userId of participatingUserIds) {
      const { data: scores, error: scoreError } = await supabase
        .from("scores")
        .select("score")
        .eq("user_id", userId)
        .order("score_date", { ascending: false })
        .limit(5);

      if (!scoreError && scores) {
        userScoresMap.set(
          userId,
          scores.map((s) => s.score),
        );
      }
    }

    // Match and calculate winnings
    const fiveMatchers: Array<{ user_id: string; matches: number }> = [];
    const fourMatchers: Array<{ user_id: string; matches: number }> = [];
    const threeMatchers: Array<{ user_id: string; matches: number }> = [];

    for (const [userId, userScores] of userScoresMap.entries()) {
      const matches = matchScores(userScores, drawNumbers);
      if (matches === 5) {
        fiveMatchers.push({ user_id: userId, matches: 5 });
      } else if (matches === 4) {
        fourMatchers.push({ user_id: userId, matches: 4 });
      } else if (matches === 3) {
        threeMatchers.push({ user_id: userId, matches: 3 });
      }
    }

    // Calculate total pool (40% of subscription revenue)
    // For now, using a mock calculation
    const totalPoolAmount = participatingUserIds.length * 5 * 100; // $5 per participant in cents

    const fiveMatchPool = Math.floor(totalPoolAmount * 0.4);
    const fourMatchPool = Math.floor(totalPoolAmount * 0.35);
    const threeMatchPool = Math.floor(totalPoolAmount * 0.25);

    // Calculate individual winnings
    const winners = {
      five: fiveMatchers.map((w) => ({
        user_id: w.user_id,
        amount: calculateWinnings(5, fiveMatchPool, fiveMatchers.length),
      })),
      four: fourMatchers.map((w) => ({
        user_id: w.user_id,
        amount: calculateWinnings(4, fourMatchPool, fourMatchers.length),
      })),
      three: threeMatchers.map((w) => ({
        user_id: w.user_id,
        amount: calculateWinnings(3, threeMatchPool, threeMatchers.length),
      })),
    };

    return {
      drawNumbers,
      winners,
      stats: {
        totalParticipants: participatingUserIds.length,
        totalPoolAmount,
        fiveMatchers: fiveMatchers.length,
        fourMatchers: fourMatchers.length,
        threeMatchers: threeMatchers.length,
      },
    };
  } catch (error) {
    console.error("Error running draw:", error);
    throw error;
  }
}

/**
 * Save draw results to database
 */
export async function saveDraw(
  drawDate: string,
  drawNumbers: number[],
  drawMode: "random" | "algorithm",
  userId: string,
  publishResults: boolean = false,
) {
  const { data: draw, error } = await supabase.from("draws").insert({
    draw_date: drawDate,
    draw_numbers: drawNumbers,
    draw_mode: drawMode,
    status: publishResults ? "published" : "simulated",
    total_pool_amount_cents: 0, // Will be calculated by trigger
    five_match_pool_cents: 0,
    four_match_pool_cents: 0,
    three_match_pool_cents: 0,
    created_by: userId,
    results_published: publishResults,
    published_at: publishResults ? new Date().toISOString() : null,
  });

  if (error) throw error;
  return draw;
}
