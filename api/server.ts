import { BaasClient } from "@meeting-baas/sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { initializeMcpApiHandler } from "../lib/mcp-api-handler";

// Create handler function
const createHandler = (server: McpServer) => {
  // Initialize BaaS client
  const baasClient = new BaasClient({
    apiKey: process.env.BAAS_API_KEY!,
  });

  // Register Meeting BaaS tools
  server.tool(
    "joinMeeting",
    { meetingUrl: z.string() },
    async ({ meetingUrl }) => {
      try {
        await baasClient.joinMeeting({
          botName: "Agent",
          meetingUrl,
          reserved: false,
        });
        return {
          content: [
            {
              type: "text",
              text: `Successfully joined meeting: ${meetingUrl}`,
            },
          ],
        };
      } catch (error: any) {
        console.error("Error joining meeting:", error);
        return {
          content: [
            {
              type: "text",
              text: `Failed to join meeting: ${
                error?.message || "Unknown error"
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Keep our simple echo tool for testing
  server.tool("echo", { message: z.string() }, async ({ message }) => ({
    content: [{ type: "text", text: `Tool echo: ${message}` }],
  }));
};

// Server configuration
const serverConfig = {
  name: "mcp-typescript server",
  version: "0.1.0",
};

// Define tool capabilities
const capabilities = {
  tools: {
    joinMeeting: {
      description: "Join a meeting using the Meeting BaaS API",
    },
    echo: {
      description: "Echo a message",
    },
  },
};

// Create and export the HTTP handler
const handler = initializeMcpApiHandler(createHandler, { capabilities });
export default handler;

// Handle stdio transport if needed
if (process.env.TRANSPORT === "stdio") {
  const server = new McpServer(serverConfig, { capabilities });
  createHandler(server);

  const transport = new StdioServerTransport(process.stdin, process.stdout);
  server.connect(transport).catch((error) => {
    console.error("Failed to connect:", error);
    process.exit(1);
  });
}
