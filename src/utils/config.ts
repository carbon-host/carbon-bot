/**
 * Configuration for the conversation memory system
 */
export const MEMORY_CONFIG = {
  // Maximum number of messages to keep in memory per channel
  MAX_MESSAGES: 15,

  // Time in milliseconds after which a conversation is considered expired (2 hours)
  CONVERSATION_EXPIRY: 30 * 60 * 1000,

  // Command to clear conversation history
  CLEAR_COMMAND: "!clear",

  // Command to show conversation history
  HISTORY_COMMAND: "!history",
};

/**
 * Configuration for the AI model
 */
export const AI_CONFIG = {
  // Default model to use
  DEFAULT_MODEL: "gemini-2.0-flash-001",

  // Fallback model to use if the default model fails
  FALLBACK_MODEL: "gemini-1.5-flash-001",
};

/**
 * Configuration for the bot
 */
export const BOT_CONFIG = {
  // Whether to show typing indicator while generating response
  SHOW_TYPING: true,

  // Whether to log errors to console
  LOG_ERRORS: true,

  // Whether to log conversation history to console
  LOG_CONVERSATIONS: false,
};
