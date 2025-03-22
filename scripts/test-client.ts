import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface ContentItem {
  type: "text";
  text: string;
}

interface ToolResponse {
  content?: ContentItem[];
}

async function main() {
  // Create transport with command configuration
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/api/server.js"],
    env: {
      ...process.env,
      NODE_ENV: "development",
    },
  });

  // Create client
  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {
        prompts: {},
        resources: {},
        tools: {},
      },
    }
  );

  try {
    // Connect to server
    console.log("Connecting to server...");
    await client.connect(transport);
    console.log("Connected!");

    // List available tools
    console.log("\nListing tools:");
    const tools = await client.listTools();
    console.log(JSON.stringify(tools, null, 2));

    // Test echo tool
    console.log("\nTesting echo tool:");
    try {
      const echoResult = (await client.callTool({
        name: "echo",
        arguments: {
          message: "Hello from test client!",
        },
      })) as ToolResponse;

      if (echoResult.content?.length) {
        console.log(
          "Echo response:",
          echoResult.content.map((c: ContentItem) => c.text).join("")
        );
      } else {
        console.log("Echo result:", JSON.stringify(echoResult, null, 2));
      }
    } catch (error) {
      console.error("Echo error:", error);
    }

    // Test joinMeeting tool
    console.log("\nTesting joinMeeting tool:");
    try {
      const joinResult = (await client.callTool({
        name: "joinMeeting",
        arguments: {
          meetingUrl: "https://meet.google.com/gwt-jpqj-exx",
          botName: "TestBot",
          reserved: false,
        },
      })) as ToolResponse;

      if (joinResult.content?.length) {
        console.log(
          "Join response:",
          joinResult.content.map((c: ContentItem) => c.text).join("")
        );
      } else {
        console.log("Join result:", JSON.stringify(joinResult, null, 2));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Join error:", error.message);
      } else {
        console.error("Join error:", error);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error:", error);
    }
  } finally {
    // Clean up
    console.log("\nClosing connection...");
    try {
      await transport.close();
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
}

// Add proper signal handling
process.on("SIGINT", () => {
  console.log("\nReceived SIGINT. Cleaning up...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM. Cleaning up...");
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
