import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import type { ConversationMessage } from "./memory";

// Define the storage directory
const STORAGE_DIR = join(process.cwd(), "data");

// Ensure the storage directory exists
if (!existsSync(STORAGE_DIR)) {
  mkdirSync(STORAGE_DIR, { recursive: true });
}

// Database file path
const DB_FILE = join(STORAGE_DIR, "conversations.json");

// Define the database schema
interface Database {
  conversations: {
    [channelId: string]: {
      messages: ConversationMessage[];
      lastUpdated: string; // ISO date string
    };
  };
}

// Create database instance
const adapter = new JSONFile<Database>(DB_FILE);
const db = new Low<Database>(adapter, { conversations: {} });

// Initialize db by reading from file
(async () => {
  await db.read();
  db.data ||= { conversations: {} };
})();

/**
 * Save conversations to the database
 */
export function saveConversations(conversations: Map<string, any>): void {
  // Convert Map to a plain object for storage
  const data: Database["conversations"] = {};

  conversations.forEach((conversation, channelId) => {
    data[channelId] = {
      messages: conversation.messages,
      lastUpdated: conversation.lastUpdated.toISOString(),
    };
  });

  // Save to db
  db.data.conversations = data;

  // Write to file (async but we don't need to wait)
  db.write().catch((err) => console.error("Error writing to database:", err));
}

/**
 * Load conversations from the database
 */
export function loadConversations(): Map<string, any> {
  const conversations = new Map<string, any>();

  // Convert plain object back to Map
  Object.entries(db.data.conversations).forEach(([channelId, conversation]) => {
    conversations.set(channelId, {
      messages: conversation.messages,
      lastUpdated: new Date(conversation.lastUpdated),
    });
  });

  return conversations;
}
