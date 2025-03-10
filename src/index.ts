#!/usr/bin/env node

/**
 * Protonmail MCP Server
 * 
 * This MCP server provides email sending functionality using Protonmail's SMTP service.
 * It implements a single tool for sending emails with various options.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { EmailService, EmailConfig } from "./email-service.js";

// Get environment variables for SMTP configuration
const PROTONMAIL_USERNAME = process.env.PROTONMAIL_USERNAME;
const PROTONMAIL_PASSWORD = process.env.PROTONMAIL_PASSWORD;
const PROTONMAIL_HOST = process.env.PROTONMAIL_HOST || "smtp.protonmail.ch";
const PROTONMAIL_PORT = parseInt(process.env.PROTONMAIL_PORT || "587", 10);
const PROTONMAIL_SECURE = process.env.PROTONMAIL_SECURE === "true";
const DEBUG = process.env.DEBUG === "true";

// Validate required environment variables
if (!PROTONMAIL_USERNAME || !PROTONMAIL_PASSWORD) {
  console.error("[Error] Missing required environment variables: PROTONMAIL_USERNAME and PROTONMAIL_PASSWORD must be set");
  process.exit(1);
}

// Helper function for debug logging
function debugLog(message: string): void {
  if (DEBUG) {
    console.error(message);
  }
}

// Create email service configuration
const emailConfig: EmailConfig = {
  host: PROTONMAIL_HOST,
  port: PROTONMAIL_PORT,
  secure: PROTONMAIL_SECURE,
  auth: {
    user: PROTONMAIL_USERNAME,
    pass: PROTONMAIL_PASSWORD,
  },
  debug: DEBUG,
};

// Initialize email service
const emailService = new EmailService(emailConfig);

/**
 * Create an MCP server with capabilities for tools (to send emails)
 */
const server = new Server(
  {
    name: "protonmail-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes a single "send_email" tool that lets clients send emails.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  debugLog("[Setup] Listing available tools");
  
  return {
    tools: [
      {
        name: "send_email",
        description: "Send an email using Protonmail SMTP",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "Recipient email address(es). Multiple addresses can be separated by commas."
            },
            subject: {
              type: "string",
              description: "Email subject line"
            },
            body: {
              type: "string",
              description: "Email body content (can be plain text or HTML)"
            },
            isHtml: {
              type: "boolean",
              description: "Whether the body contains HTML content",
              default: false
            },
            cc: {
              type: "string",
              description: "CC recipient(s), separated by commas"
            },
            bcc: {
              type: "string",
              description: "BCC recipient(s), separated by commas"
            }
          },
          required: ["to", "subject", "body"]
        }
      }
    ]
  };
});

/**
 * Handler for the send_email tool.
 * Sends an email with the provided details and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  debugLog(`[Tool] Executing tool: ${request.params.name}`);
  
  switch (request.params.name) {
    case "send_email": {
      const args = request.params.arguments;
      
      // Validate required arguments
      if (!args || typeof args !== "object") {
        throw new McpError(ErrorCode.InvalidParams, "Invalid arguments");
      }
      
      const { to, subject, body, isHtml, cc, bcc } = args as any;
      
      if (!to || typeof to !== "string") {
        throw new McpError(ErrorCode.InvalidParams, "Missing or invalid 'to' parameter");
      }
      
      if (!subject || typeof subject !== "string") {
        throw new McpError(ErrorCode.InvalidParams, "Missing or invalid 'subject' parameter");
      }
      
      if (!body || typeof body !== "string") {
        throw new McpError(ErrorCode.InvalidParams, "Missing or invalid 'body' parameter");
      }
      
      try {
        // Send the email
        const result = await emailService.sendEmail({
          to,
          subject,
          body,
          isHtml: isHtml === true,
          cc: typeof cc === "string" ? cc : undefined,
          bcc: typeof bcc === "string" ? bcc : undefined,
        });
        
        return {
          content: [{
            type: "text",
            text: `Email sent successfully to ${to}${cc ? ` with CC to ${cc}` : ""}${bcc ? ` and BCC to ${bcc}` : ""}.`
          }]
        };
      } catch (error) {
      // Always log errors, even in non-debug mode
      console.error(`[Error] Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
      
      throw new McpError(
          ErrorCode.InternalError,
          `Failed to send email: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    default:
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  debugLog("[Setup] Starting Protonmail MCP server...");
  
  try {
    // Verify SMTP connection on startup
    await emailService.verifyConnection();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    debugLog("[Setup] Protonmail MCP server started successfully");
  } catch (error) {
    console.error(`[Error] Server startup failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Set up error handling
process.on("uncaughtException", (error) => {
  console.error(`[Error] Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(`[Error] Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error(`[Error] Server error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
