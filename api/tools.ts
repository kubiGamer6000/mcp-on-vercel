import { BaasClient } from "@meeting-baas/sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

// Helper to import Meeting BaaS tools
// Note: Update tsconfig.json moduleResolution to "node16" or "bundler" for proper type resolution
const {
  allTools,
  registerTools: registerBaasTools,
} = require("@meeting-baas/sdk/tools");

export function registerTools(server: McpServer, apiKey: string): McpServer {
  // Create BaaS client for tools that might need it
  const baasClient = new BaasClient({ apiKey });

  // Register all pre-generated tools with a single function call
  registerBaasTools(allTools, (tool: any) => {
    server.tool(
      tool.name,
      tool.description,
      tool.parameters,
      async (...args: any[]) => {
        // Bind the handler to the BaaS client to ensure it has access to the client
        return tool.handler.apply({ client: baasClient }, args);
      }
    );
  });

  // Add a simple echo tool for testing
  server.tool(
    "echo",
    "Simple echo tool for testing",
    { message: z.string() },
    async ({ message }) => ({
      content: [
        {
          type: "text",
          text: `Tool echo: ${message}`,
        },
      ],
    })
  );

  return server;
}

export default registerTools;
