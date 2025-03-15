# Carbon.host Discord Support Bot

A Discord bot for Carbon.host support that uses AI to answer user questions about the Carbon.host Minecraft server hosting platform.

## Features

- **AI-Powered Support**: Uses Google's Gemini AI models to provide helpful responses to user questions
- **Conversation Memory**: Maintains context across multiple messages for more coherent conversations
- **Persistent Storage**: Saves conversation history to disk, preserving context even if the bot restarts
- **Fallback Model Support**: Automatically tries a fallback model if the primary model fails
- **Command Support**:
  - `!clear` - Clears the conversation history
  - `!history` - Shows the recent conversation history

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   bun install
   ```
3. Create a `.env` file with the following variables:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   SUPPORT_CHANNEL_ID=your_support_channel_id
   ```
4. Run the bot:
   ```
   bun run dev
   ```

## Configuration

The bot's behavior can be configured by modifying the following files:

- `src/utils/config.ts` - General configuration settings
- `src/utils/prompt.ts` - System prompt for the AI model

### Memory Configuration

You can adjust the conversation memory settings in `src/utils/config.ts`:

```typescript
export const MEMORY_CONFIG = {
  // Maximum number of messages to keep in memory per channel
  MAX_MESSAGES: 15,
  
  // Time in milliseconds after which a conversation is considered expired (2 hours)
  CONVERSATION_EXPIRY: 2 * 60 * 60 * 1000,
  
  // Command to clear conversation history
  CLEAR_COMMAND: "!clear",
  
  // Command to show conversation history
  HISTORY_COMMAND: "!history",
};
```

### AI Model Configuration

You can configure the AI models in `src/utils/config.ts`:

```typescript
export const AI_CONFIG = {
  // Default model to use
  DEFAULT_MODEL: "gemini-2.0-flash-001",
  
  // Fallback model to use if the default model fails
  FALLBACK_MODEL: "gemini-1.5-flash-001",
};
```

## System Prompt

The system prompt in `src/utils/prompt.ts` provides context to the AI about Carbon.host and how to respond to users. It includes:

- Information about Carbon.host
- Description of the Carbon.host UI
- Guidelines for responding to users

## Persistent Storage

Conversation history is automatically saved to disk in the `data` directory:

- Conversations are saved every 5 minutes
- Conversations are saved when the bot is shut down gracefully
- Conversations are loaded when the bot starts up

This ensures that context is maintained even if the bot needs to be restarted.

## Development

Run the bot in development mode with hot reloading:

```
bun dev
```

## License

MIT
