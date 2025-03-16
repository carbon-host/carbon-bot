import { Message } from "discord.js";

// User message tracker for rate limiting
interface UserTracker {
  timestamps: number[];
  lastActivity: number;
}

// Store user message timestamps for rate limiting
const userMessages = new Map<string, UserTracker>();

// Rate limit settings
const MAX_MESSAGES = 15;
const TIME_WINDOW = 2 * 60 * 1000; // 2 minutes
const SUPPORT_THRESHOLD = 10;
const QUICK_SUCCESSION_WINDOW = 30 * 1000; // 30 seconds

// Response control directives
const PING_SUPPORT_DIRECTIVE = "[[PING_SUPPORT]]";
const NO_RESPONSE_DIRECTIVE = "[[NO_RESPONSE_NEEDED]]";

/**
 * Check if a user is rate limited
 */
export function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const user = userMessages.get(userId) || {
    timestamps: [],
    lastActivity: now,
  };

  // Clean up old timestamps
  user.timestamps = user.timestamps.filter(
    (timestamp) => now - timestamp < TIME_WINDOW
  );

  // Update user data
  userMessages.set(userId, user);

  // Check if user has exceeded rate limit
  return user.timestamps.length >= MAX_MESSAGES;
}

/**
 * Add a message timestamp for a user
 */
export function trackUserMessage(userId: string): void {
  const now = Date.now();
  const user = userMessages.get(userId) || {
    timestamps: [],
    lastActivity: now,
  };

  user.timestamps.push(now);
  user.lastActivity = now;

  userMessages.set(userId, user);
}

/**
 * Determine if the message content should trigger a support ping
 * Either due to high message frequency or content analysis
 */
export function shouldPingSupport(userId: string, content: string): boolean {
  const now = Date.now();
  const user = userMessages.get(userId);

  if (!user) return false;

  // Count messages in quick succession
  const quickMessages = user.timestamps.filter(
    (timestamp) => now - timestamp < QUICK_SUCCESSION_WINDOW
  ).length;

  // Check for urgent keywords in message content
  const urgentKeywords = [
    "urgent",
    "emergency",
    "critical",
    "immediately",
    "help!!!",
    "broken",
  ];
  const containsUrgentKeywords = urgentKeywords.some((word) =>
    content.toLowerCase().includes(word)
  );

  // Ping support if user is sending many messages quickly or using urgent language
  return quickMessages >= SUPPORT_THRESHOLD || containsUrgentKeywords;
}

/**
 * Check if AI response contains directive to ping support
 */
export function aiRequestedSupportPing(text: string): boolean {
  return text.includes(PING_SUPPORT_DIRECTIVE);
}

/**
 * Check if AI indicated no response was needed
 */
export function aiIndicatedNoResponse(text: string): boolean {
  return text.includes(NO_RESPONSE_DIRECTIVE);
}

/**
 * Sanitize AI response to remove problematic content and directives
 */
export function sanitizeResponse(text: string): string {
  return (
    text
      // Remove directives
      .replace(PING_SUPPORT_DIRECTIVE, "")
      .replace(NO_RESPONSE_DIRECTIVE, "")
      // Remove @everyone and @here mentions
      .replace(/@everyone/gi, "everyone")
      .replace(/@here/gi, "here")
      // Move code blocks to new line
      .replace(/```\s*$/g, "```\n")
      .trim()
  );
}

/**
 * Add support ping if needed
 */
export function addSupportPingIfNeeded(
  text: string,
  shouldPing: boolean
): string {
  if (shouldPing) {
    return `<@&${Bun.env.SUPPORT_ROLE_ID}> (Support needed - high message frequency or urgent issue)\n\n${text}`;
  }
  return text;
}

/**
 * Determine if a user message requires a response
 */
export function requiresResponse(message: string): boolean {
  const content = message.trim().toLowerCase();

  // Always respond if bot is mentioned
  if (content.includes("<@1264764063305437244>")) {
    return true;
  }

  // Respond to questions (ending with ? or starting with question words)
  if (content.endsWith("?")) {
    return true;
  }

  // Common question starters
  const questionStarters = [
    "what",
    "how",
    "why",
    "when",
    "where",
    "who",
    "which",
    "can",
    "could",
    "would",
    "should",
    "is",
    "are",
    "am",
    "do",
    "does",
    "did",
    "help",
    "what's",
    "whats",
  ];

  for (const starter of questionStarters) {
    if (content.startsWith(starter + " ")) {
      return true;
    }
  }

  // Help-seeking phrases
  const helpPhrases = [
    "i need help",
    "help me",
    "having trouble",
    "not working",
    "can't figure out",
    "having an issue",
    "having a problem",
    "error",
    "broken",
    "stuck",
    "assistance",
    "support",
    "how do i",
    "how to",
    "please help",
  ];

  for (const phrase of helpPhrases) {
    if (content.includes(phrase)) {
      return true;
    }
  }

  // Default to not responding
  return false;
}
