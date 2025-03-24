import { BaasClient } from "@meeting-baas/sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initializeMcpApiHandler } from "../lib/mcp-api-handler";
import registerTools from "./tools";

const handler = async () => {
  const baasClient = new BaasClient({
    apiKey: process.env.BAAS_API_KEY || "",
  });

  let server = new McpServer({
    name: "Meeting BaaS Server",
    version: "1.0.0",
  });

  server = registerTools(server);
  return initializeMcpApiHandler((server: McpServer) => {
    // The server is already configured with all tools
    return server;
  });
};

export default handler;

// Handle stdio transport if specified
if (process.env.TRANSPORT === "stdio") {
  let server = new McpServer({
    name: "Meeting BaaS Server",
    version: "1.0.0",
  });

  // Register all the tools again for the stdio server
  const baasClient = new BaasClient({
    apiKey: process.env.BAAS_API_KEY || "",
  });

  server = registerTools(server);

  const transport = new StdioServerTransport(process.stdin, process.stdout);
  server.connect(transport).catch((error: Error) => {
    console.error("Failed to connect:", error);
    process.exit(1);
  });
}
