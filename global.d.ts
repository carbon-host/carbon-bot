declare namespace Bun {
  const env: {
    NODE_ENV: "development" | "production" | "test";
    DISCORD_TOKEN?: string;
    SUPPORT_CHANNEL_ID?: string;
    SUPPORT_ROLE_ID?: string;

    [key: string]: string | undefined;
  };
}
