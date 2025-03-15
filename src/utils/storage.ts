import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { ConversationMessage } from "./memory";

// Define the storage directory
const STORAGE_DIR = join(process.cwd(), "data");

// Ensure the storage directory exists
if (!existsSync(STORAGE_DIR)) {
  mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Save data to a JSON file
 */
export function saveData<T>(filename: string, data: T): void {
  try {
    const filePath = join(STORAGE_DIR, `${filename}.json`);
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving data to ${filename}.json:`, error);
  }
}

/**
 * Load data from a JSON file
 */
export function loadData<T>(filename: string, defaultValue: T): T {
  try {
    const filePath = join(STORAGE_DIR, `${filename}.json`);

    if (!existsSync(filePath)) {
      return defaultValue;
    }

    const data = readFileSync(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error loading data from ${filename}.json:`, error);
    return defaultValue;
  }
}

/**
 * Interface for conversation storage
 */
export interface ConversationStorage {
  [channelId: string]: {
    messages: ConversationMessage[];
    lastUpdated: string; // ISO date string
  };
}

/**
 * Save conversations to storage
 */
export function saveConversations(conversations: Map<string, any>): void {
  const data: ConversationStorage = {};

  // Convert Map to a plain object for storage
  conversations.forEach((conversation, channelId) => {
    data[channelId] = {
      messages: conversation.messages,
      lastUpdated: conversation.lastUpdated.toISOString(),
    };
  });

  saveData("conversations", data);
}

/**
 * Load conversations from storage
 */
export function loadConversations(): Map<string, any> {
  const data = loadData<ConversationStorage>("conversations", {});
  const conversations = new Map<string, any>();

  // Convert plain object back to Map
  Object.entries(data).forEach(([channelId, conversation]) => {
    conversations.set(channelId, {
      messages: conversation.messages,
      lastUpdated: new Date(conversation.lastUpdated),
    });
  });

  return conversations;
}
