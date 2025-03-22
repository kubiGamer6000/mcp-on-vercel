import { ServerOptions } from "@modelcontextprotocol/sdk/server/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { IncomingMessage, ServerResponse } from "http";

export function initializeMcpApiHandler(
  initializeServer: (server: McpServer) => void,
  serverOptions: ServerOptions = {}
) {
  return async function mcpApiHandler(
    req: IncomingMessage,
    res: ServerResponse
  ) {
    // Use a placeholder base URL just for parsing - this is never actually used for requests
    const url = new URL(req.url || "", "http://localhost");

    // Handle SSE connections
    if (url.pathname === "/sse") {
      console.log("Got new SSE connection");

      // Initialize SSE transport and server
      const transport = new SSEServerTransport("/message", res);
      const server = new McpServer(
        {
          name: "mcp-typescript server",
          version: "0.1.0",
        },
        serverOptions
      );

      // Initialize server with tools
      initializeServer(server);

      // Set up connection close handler
      server.server.onclose = () => {
        console.log("SSE connection closed");
        res.end();
      };

      // Set up client disconnect handler
      req.on("close", () => {
        console.log("Client disconnected");
        server.server.onclose?.();
      });

      // Connect transport
      await server.connect(transport);
    } else if (url.pathname === "/message") {
      // Handle POST messages from client
      if (req.method === "POST") {
        const transport = new SSEServerTransport("/message", res);
        await transport.handlePostMessage(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Method not allowed");
      }
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  };
}
