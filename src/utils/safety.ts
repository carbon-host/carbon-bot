import { Message } from "discord.js";

// Rate limiting configuration
interface RateLimitConfig {
  // Maximum number of messages per user in the time window
  maxMessages: number;
  // Time window in milliseconds
  timeWindow: number;
  // Support ping threshold - number of messages in quick succession to trigger support ping
  supportPingThreshold: number;
  // Quick succession time window in milliseconds
  quickSuccessionWindow: number;
}

// Default rate limit settings
export const RATE_LIMIT: RateLimitConfig = {
  maxMessages: 15,
  timeWindow: 2 * 60 * 1000, // 2 minutes
  supportPingThreshold: 10,
  quickSuccessionWindow: 30 * 1000, // 30 seconds
};

// Store user message timestamps for rate limiting
const userMessages: Map<string, number[]> = new Map();

/**
 * Check if a user is rate limited
 */
export function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userTimestamps = userMessages.get(userId) || [];

  // Filter timestamps to only include those within the time window
  const recentTimestamps = userTimestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT.timeWindow
  );

  // Update the timestamps
  userMessages.set(userId, recentTimestamps);

  // Check if the user has exceeded the rate limit
  return recentTimestamps.length >= RATE_LIMIT.maxMessages;
}

/**
 * Add a message timestamp for a user
 */
export function addMessageTimestamp(userId: string): void {
  const timestamps = userMessages.get(userId) || [];
  timestamps.push(Date.now());
  userMessages.set(userId, timestamps);
}

/**
 * Check if support should be pinged based on message frequency
 */
export function shouldPingSupport(userId: string): boolean {
  const now = Date.now();
  const userTimestamps = userMessages.get(userId) || [];

  // Count messages in quick succession
  const quickSuccessionCount = userTimestamps.filter(
    (timestamp) => now - timestamp < RATE_LIMIT.quickSuccessionWindow
  ).length;

  return quickSuccessionCount >= RATE_LIMIT.supportPingThreshold;
}

/**
 * Remove mentions of @everyone and @here from a message
 */
export function removeBannedMentions(text: string): string {
  // Replace @everyone and @here with safe versions
  return text.replace(/@everyone/gi, "everyone").replace(/@here/gi, "here");
}

/**
 * Add support ping if needed
 */
export function addSupportPingIfNeeded(
  text: string,
  shouldPing: boolean
): string {
  if (shouldPing) {
    return `<@&${Bun.env.SUPPORT_ROLE_ID}> (Auto-ping due to high message frequency)\n\n${text}`;
  }
  return text;
}

/**
 * Check if a message requires a response
 * Returns true if the message is a question or appears to need a response
 */
export function requiresResponse(message: string): boolean {
  const trimmedMessage = message.trim().toLowerCase();

  // Check if message ends with a question mark
  if (trimmedMessage.endsWith("?")) {
    return true;
  }

  if (trimmedMessage.includes("<@1264764063305437244>") ) {
    return true;
  }

  // Check for question words at the beginning
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
  ];

  for (const starter of questionStarters) {
    if (trimmedMessage.startsWith(starter + " ")) {
      return true;
    }
  }

  // Check for phrases that indicate the user needs help
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
  ];

  for (const phrase of helpPhrases) {
    if (trimmedMessage.includes(phrase)) {
      return true;
    }
  }

  return false;
}
