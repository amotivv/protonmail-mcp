# Protonmail MCP Server

This MCP server provides email sending functionality using Protonmail's SMTP service. It allows Cline to send emails on your behalf using your Protonmail credentials.

## Features

- Send emails to one or multiple recipients
- Support for CC and BCC recipients
- Support for both plain text and HTML email content
- Comprehensive error handling and logging

## Configuration

The server requires the following environment variables to be set in the MCP settings file:

- `PROTONMAIL_USERNAME`: Your Protonmail email address
- `PROTONMAIL_PASSWORD`: Your Protonmail SMTP password (not your regular login password)
- `PROTONMAIL_HOST`: SMTP server hostname (default: smtp.protonmail.ch)
- `PROTONMAIL_PORT`: SMTP server port (default: 587 for STARTTLS, 465 for SSL/TLS)
- `PROTONMAIL_SECURE`: Whether to use a secure connection (default: "false" for port 587, "true" for port 465)
- `DEBUG`: Enable debug logging (set to "true" to see detailed logs, "false" to hide them)

For detailed information about Protonmail's SMTP service, including how to get your SMTP password, please refer to the [official Protonmail SMTP documentation](https://proton.me/support/smtp-submission).

## Usage

Once configured, you can use the MCP server to send emails with the following tool:

### send_email

Sends an email using your Protonmail SMTP account.

**Parameters:**

- `to`: Recipient email address(es). Multiple addresses can be separated by commas.
- `subject`: Email subject line
- `body`: Email body content (can be plain text or HTML)
- `isHtml`: (Optional) Whether the body contains HTML content (default: false)
- `cc`: (Optional) CC recipient(s), separated by commas
- `bcc`: (Optional) BCC recipient(s), separated by commas

**Example:**

```
<use_mcp_tool>
<server_name>protonmail-mcp</server_name>
<tool_name>send_email</tool_name>
<arguments>
{
  "to": "recipient@example.com",
  "subject": "Test Email from Cline",
  "body": "This is a test email sent via the Protonmail MCP server.",
  "cc": "optional-cc@example.com"
}
</arguments>
</use_mcp_tool>
```

## Troubleshooting

If you encounter issues with the MCP server, check the following:

1. Ensure your Protonmail SMTP credentials are correct
2. Verify that the SMTP port is not blocked by your firewall
3. Check if your Protonmail account has any sending restrictions
4. Look for error messages in the Claude desktop app logs

## Development

To build the project:

```bash
cd protonmail-mcp
npm install
npm run build
```

To modify the server, edit the files in the `src` directory and rebuild the project.

## Resources

- [Protonmail SMTP Documentation](https://proton.me/support/smtp-submission) - Official guide for using Protonmail's SMTP service
- [Nodemailer Documentation](https://nodemailer.com/) - The email sending library used by this MCP server
- [Model Context Protocol Documentation](https://github.com/modelcontextprotocol/mcp) - Documentation for the MCP protocol
