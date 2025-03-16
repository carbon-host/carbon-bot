// import discord.js
import { SYSTEM_PROMPT } from "@/utils/prompt";
import {
  addUserMessage,
  addAssistantResponse,
  getConversationHistory,
} from "@/utils/memory";
import {
  isRateLimited,
  trackUserMessage,
  shouldPingSupport,
  sanitizeResponse,
  addSupportPingIfNeeded,
  requiresResponse,
  aiRequestedSupportPing,
  aiIndicatedNoResponse,
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
  allowedMentions: {
    roles: [Bun.env.SUPPORT_ROLE_ID!],
  },
});

// listen for the client to be ready
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.channel.id !== Bun.env.SUPPORT_CHANNEL_ID) return;
  if (message.author.bot) return;

  // Track message for rate limiting
  trackUserMessage(message.author.id);

  // Check if user is rate limited
  if (isRateLimited(message.author.id)) {
    await message.reply(
      "You're sending messages too quickly. Please wait a moment before trying again."
    );
    return;
  }

  // Add message to conversation memory
  addUserMessage(message);

  // Check if the message requires a response
  if (!requiresResponse(message.content)) {
    return; // Don't respond if not needed
  }

  // Get conversation history
  const conversationHistory = getConversationHistory(message.channel.id);

  try {
    // Show typing indicator
    await message.channel.sendTyping();

    // Generate response using the conversation history
    const { text } = await generateText({
      model: google("gemini-2.0-flash-001"),
      system: SYSTEM_PROMPT,
      messages: conversationHistory,
    });

    // Check if AI indicated no response was needed
    if (aiIndicatedNoResponse(text)) {
      console.log("AI indicated no response was needed");
      return; // Don't respond
    }

    // Add the response to conversation memory (after removing directives)
    const cleanedText = sanitizeResponse(text);
    addAssistantResponse(message.channel.id, cleanedText);

    // Check if we should ping support (programmatic check or AI directive)
    const shouldPingProgrammatic = shouldPingSupport(
      message.author.id,
      message.content
    );
    const shouldPingByAI = aiRequestedSupportPing(text);
    const needsSupportPing = shouldPingProgrammatic || shouldPingByAI;

    // Reason for support ping (for logging)
    if (shouldPingByAI) {
      console.log("Support ping requested by AI");
    } else if (shouldPingProgrammatic) {
      console.log("Support ping determined programmatically");
    }

    // Add support ping if needed
    const finalText = addSupportPingIfNeeded(cleanedText, needsSupportPing);

    // Reply to the user
    await message.reply(finalText);
  } catch (error) {
    console.error("Error generating response:", error);
    await message.reply(
      "I'm having trouble processing your request right now. Please try again later."
    );
  }
});

// login with the token from .env
client.login(Bun.env.DISCORD_TOKEN);
