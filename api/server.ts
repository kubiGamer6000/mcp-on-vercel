import { initializeMcpApiHandler } from "../lib/mcp-api-handler";
import registerTools from "./tools";

const handler = initializeMcpApiHandler(
  (server, apiKey) => {
    // Register Meeting BaaS SDK tools with the provided API key
    server = registerTools(server, apiKey);
  },
  {
    // No need to manually define tool capabilities - they're included with the tools
    capabilities: {
      tools: {},
    },
  }
);

export default handler;
