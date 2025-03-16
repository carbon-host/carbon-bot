# Carbon Host Discord Support Bot

A Discord bot for Carbon Host support that uses AI to answer user questions about the Carbon.host Minecraft server hosting platform.

## Features

- **AI-Powered Support**: Uses Google's Gemini AI models to provide helpful responses to user questions
- **Conversation Memory**: Maintains context across multiple messages for more coherent conversations
- **Persistent Storage**: Uses lowdb to save conversation history to disk
- **Smart Response Logic**: Only responds to questions or help requests
- **Rate Limiting**: Prevents spam and abuse
- **Support Pinging**: Automatically pings support staff for urgent issues

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
   SUPPORT_ROLE_ID=your_support_role_id
   ```
4. Run the bot:
   ```
   bun run dev
   ```

## System Design

### Memory System
- Tracks conversation history by channel
- Keeps up to 15 messages per conversation
- Conversations expire after 3 hours of inactivity
- Conversation data is stored using lowdb

### Safety Features
- **Rate Limiting**: Users are limited to 15 messages per 2 minutes
- **Response Filtering**: Bot only responds to questions or help requests
- **Mention Sanitization**: Prevents @everyone and @here mentions
- **Support Pinging**: Alerts support staff for urgent issues or high message frequency

### Conversation Handling
- Bot tracks user messages even when not responding
- Maintains context for future interactions
- Preserves memory across bot restarts

## System Prompt

The system prompt in `src/utils/prompt.ts` provides context to the AI about Carbon Host and how to respond to users, including:

- Information about Carbon Host services and features
- Description of the Carbon Host UI
- Guidelines for responding to users
- Links to relevant resources

## Development

Run the bot in development mode with hot reloading:

```
bun run dev
```

## License

MIT
