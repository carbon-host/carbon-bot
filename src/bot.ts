// import discord.js
import { SYSTEM_PROMPT } from "@/utils/prompt";
import {
  addUserMessage,
  addAssistantResponse,
  getConversationWithSystemPrompt,
  clearConversation,
  getFormattedHistory,
} from "@/utils/memory";
import { MEMORY_CONFIG, AI_CONFIG, BOT_CONFIG } from "@/utils/config";
import {
  isRateLimited,
  addMessageTimestamp,
  shouldPingSupport,
  removeBannedMentions,
  addSupportPingIfNeeded,
  requiresResponse,
} from "@/utils/safety";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { Client, Events, GatewayIntentBits } from "discord.js";

// create a new Client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// listen for the client to be ready
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.channel.id !== Bun.env.SUPPORT_CHANNEL_ID) return;
  if (message.author.bot) return;

  // Check if the message is a command to clear conversation history
  if (message.content.trim() === MEMORY_CONFIG.CLEAR_COMMAND) {
    clearConversation(message.channel.id);
    await message.reply(
      "Conversation history cleared! I've forgotten our previous conversation."
    );
    return;
  }

  // Check if the message is a command to show conversation history
  if (message.content.trim() === MEMORY_CONFIG.HISTORY_COMMAND) {
    const history = getFormattedHistory(message.channel.id);
    await message.reply(`**Conversation History**\n\n${history}`);
    return;
  }

  // Check if user is rate limited
  if (isRateLimited(message.author.id)) {
    await message.reply(
      "You're sending messages too quickly. Please wait a moment before trying again."
    );
    return;
  }

  // Add message timestamp for rate limiting
  addMessageTimestamp(message.author.id);

  // Check if the message requires a response
  if (!requiresResponse(message.content)) {
    // Still add to conversation memory but don't respond
    addUserMessage(message);
    return;
  }

  // Add the user's message to conversation memory
  addUserMessage(message);

  // Get the conversation history with system prompt
  const conversationHistory = getConversationWithSystemPrompt(
    message.channel.id,
    SYSTEM_PROMPT
  );

  try {
    // Set typing indicator while processing
    if (BOT_CONFIG.SHOW_TYPING) {
      await message.channel.sendTyping();
    }

    // Generate response using the full conversation history
    const { text } = await generateText({
      model: google(AI_CONFIG.DEFAULT_MODEL),
      messages: conversationHistory,
    });

    // Add the assistant's response to conversation memory
    addAssistantResponse(message.channel.id, text);

    // Check if we should ping support
    const needsSupportPing = shouldPingSupport(message.author.id);

    // Remove banned mentions and add support ping if needed
    const safeText = removeBannedMentions(text);
    const finalText = addSupportPingIfNeeded(safeText, needsSupportPing);

    // Reply to the user
    await message.reply(finalText);
  } catch (error) {
    if (BOT_CONFIG.LOG_ERRORS) {
      console.error("Error generating response:", error);
    }

    try {
      // Try with fallback model if available
      if (AI_CONFIG.FALLBACK_MODEL) {
        if (BOT_CONFIG.SHOW_TYPING) {
          await message.channel.sendTyping();
        }

        const { text } = await generateText({
          model: google(AI_CONFIG.FALLBACK_MODEL),
          messages: conversationHistory,
        });

        // Add the assistant's response to conversation memory
        addAssistantResponse(message.channel.id, text);

        // Remove banned mentions and add support ping if needed
        const safeText = removeBannedMentions(text);
        const finalText = addSupportPingIfNeeded(
          safeText,
          shouldPingSupport(message.author.id)
        );

        await message.reply(finalText);
      } else {
        throw new Error("No fallback model available");
      }
    } catch (fallbackError) {
      if (BOT_CONFIG.LOG_ERRORS) {
        console.error("Fallback model error:", fallbackError);
      }
      await message.reply(
        "I'm having trouble processing your request right now. Please try again later."
      );
    }
  }
});

// login with the token from .env
client.login(Bun.env.DISCORD_TOKEN);
