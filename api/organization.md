// fill up with details on how in @server.ts and @tools.s we create an MPC server so that a co-worker can EXACTLY replicate it, thanks.

# MPC Server Implementation with Meeting BaaS SDK 0.3.0

This document explains how the Model Context Protocol (MCP) server is implemented in our codebase, focusing specifically on the interaction between `api/server.ts` and `api/tools.ts`.

## Overview

Our implementation follows a two-file pattern leveraging the pre-generated tools from Meeting BaaS SDK 0.3.0:

- `api/server.ts` - Sets up the MCP API handler
- `api/tools.ts` - Registers the pre-generated tools from the Meeting BaaS SDK

## api/server.ts

This file initializes the MCP API handler and registers all tools:

```typescript
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
```

Key components:

1. `initializeMcpApiHandler` - Creates the API handler that processes incoming requests
2. First parameter - A callback function that receives the server instance and API key
3. Second parameter - Server capabilities object is now empty since tools bring their own capabilities
4. The handler is exported as the default export to be used by the API route

## api/tools.ts

This file leverages the pre-generated tools from the Meeting BaaS SDK:

```typescript
import { BaasClient } from "@meeting-baas/sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

// Helper to import Meeting BaaS tools
// Note: Update tsconfig.json moduleResolution to "node16" or "bundler" for proper type resolution
const baasToolsImport = "@meeting-baas/sdk/dist/tools.js";
const { allTools, registerTools: registerBaasTools } = require(baasToolsImport);

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

  // Add custom tools if needed
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
```

Key components:

1. Import Meeting BaaS tools - We import pre-generated tools from the SDK
2. `registerTools` function - Takes the server instance and API key and returns the modified server
3. `BaasClient` initialization - Creates a client with the provided API key for tool handlers
4. `registerBaasTools` - Registers all pre-generated tools with a single function call
5. Custom binding - Binds the tool handlers to the BaaS client for proper execution

## Benefits of This Approach

Using the pre-generated tools from Meeting BaaS SDK 0.3.0 provides several advantages:

1. **Simplicity** - No need to manually implement each API endpoint as a tool
2. **Completeness** - All API methods are available as tools automatically
3. **Maintenance** - When the SDK updates, your tools update automatically
4. **Consistency** - All tools follow the same patterns and error handling
5. **Extensibility** - You can still add custom tools as needed

## Adding Custom Tools

To add a custom tool alongside the pre-generated ones, simply add more `server.tool()` calls after registering the SDK tools:

```typescript
server.tool(
  "custom_tool_name",
  "Custom tool description",
  {
    param1: z.string(),
    param2: z.boolean().optional(),
  },
  async ({ param1, param2 }) => {
    try {
      // Use baasClient for API calls if needed
      const result = await baasClient.someMethod(param1);

      return {
        content: [
          {
            type: "text",
            text: `Result: ${JSON.stringify(result)}`,
          },
        ],
      };
    } catch (error) {
      console.error("Custom tool error:", error);
      return {
        content: [
          {
            type: "text",
            text: "An error occurred in the custom tool",
          },
        ],
        isError: true,
      };
    }
  }
);
```

## Module Resolution Note

If you encounter TypeScript errors when importing from `@meeting-baas/sdk/tools`, you may need to update your `tsconfig.json` to use a more modern module resolution strategy:

```json
{
  "compilerOptions": {
    "moduleResolution": "node16" // or "bundler"
  }
}
```

Alternatively, use the require approach as shown in the code example to work around module resolution issues.
