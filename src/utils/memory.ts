import { Message } from "discord.js";
import { saveConversations, loadConversations } from "./storage";

// Maximum number of messages to keep in memory per channel
const MAX_MESSAGES = 15;

// Time in milliseconds after which a conversation is considered expired (3 hours)
const CONVERSATION_EXPIRY = 3 * 60 * 60 * 1000;

// Define the structure for a conversation message
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

// Define the structure for a conversation
interface Conversation {
  messages: ConversationMessage[];
  lastUpdated: Date;
}

// Map to store conversations by channel ID
const conversations = loadConversations();

// Save conversations periodically
const SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  saveConversations(conversations);
}, SAVE_INTERVAL);

// Save conversations on process exit
process.on("SIGINT", () => {
  saveConversations(conversations);
  console.log("[Storage] Saved conversations before exit");
  process.exit(0);
});

process.on("SIGTERM", () => {
  saveConversations(conversations);
  console.log("[Storage] Saved conversations before exit");
  process.exit(0);
});

/**
 * Add a user message to the conversation memory
 */
export function addUserMessage(message: Message): void {
  const channelId = message.channel.id;
  const conversation = getOrCreateConversation(channelId);

  const userMessage: ConversationMessage = {
    role: "user",
    content: message.content,
    timestamp: new Date(),
  };

  conversation.messages.push(userMessage);

  // Trim conversation if it exceeds the maximum length
  trimConversation(conversation);

  // Update the last updated timestamp
  conversation.lastUpdated = new Date();

  // Save the updated conversation
  conversations.set(channelId, conversation);
}

/**
 * Add an assistant response to the conversation memory
 */
export function addAssistantResponse(channelId: string, content: string): void {
  const conversation = getOrCreateConversation(channelId);

  const assistantMessage: ConversationMessage = {
    role: "assistant",
    content,
    timestamp: new Date(),
  };

  conversation.messages.push(assistantMessage);

  // Trim conversation if it exceeds the maximum length
  trimConversation(conversation);

  // Update the last updated timestamp
  conversation.lastUpdated = new Date();

  // Save the updated conversation
  conversations.set(channelId, conversation);
}

/**
 * Get the conversation history for a channel
 */
export function getConversationHistory(
  channelId: string
): ConversationMessage[] {
  const conversation = conversations.get(channelId);

  // If no conversation exists or it's expired, return an empty array
  if (!conversation || isConversationExpired(conversation)) {
    return [];
  }

  return conversation.messages;
}

/**
 * Get or create a conversation for a channel
 */
function getOrCreateConversation(channelId: string): Conversation {
  const existingConversation = conversations.get(channelId);

  // If a conversation exists and is not expired, return it
  if (existingConversation && !isConversationExpired(existingConversation)) {
    return existingConversation;
  }

  // Otherwise, create a new conversation
  return {
    messages: [],
    lastUpdated: new Date(),
  };
}

/**
 * Check if a conversation is expired
 */
function isConversationExpired(conversation: Conversation): boolean {
  const now = new Date();
  return (
    now.getTime() - conversation.lastUpdated.getTime() > CONVERSATION_EXPIRY
  );
}

/**
 * Trim a conversation to the maximum length
 */
function trimConversation(conversation: Conversation): void {
  if (conversation.messages.length > MAX_MESSAGES) {
    // Keep the most recent messages
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
  }
}
