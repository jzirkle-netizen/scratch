import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Query JIRA data product via Ask Dataverse MCP Server
 * 
 * Note: This script is designed for remote HTTP MCP servers.
 * For the Ask Dataverse server at https://mcp.dataverse.redhat.com/mcp/,
 * we'll use HTTP requests directly.
 */

const MCP_SERVER_URL = 'https://mcp.dataverse.redhat.com/mcp/';

interface MCPRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

async function sendMCPRequest(method: string, params?: any): Promise<any> {
  const request: MCPRequest = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };

  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MCPResponse = await response.json();
    
    if (data.error) {
      throw new Error(`MCP Error: ${data.error.message} (code: ${data.error.code})`);
    }

    return data.result;
  } catch (error) {
    console.error('Error sending MCP request:', error);
    throw error;
  }
}

async function listTables(): Promise<any> {
  console.log('Listing available tables/data products...');
  try {
    const result = await sendMCPRequest('tools/list');
    return result;
  } catch (error) {
    // Try alternative method
    try {
      const result = await sendMCPRequest('list_tables');
      return result;
    } catch (e) {
      console.error('Could not list tables:', e);
      throw e;
    }
  }
}

async function queryJIRA(query?: string): Promise<any> {
  console.log('Querying JIRA data product...');
  
  // First, try to list available tools
  try {
    const tools = await sendMCPRequest('tools/list');
    console.log('Available tools:', JSON.stringify(tools, null, 2));
  } catch (e) {
    console.log('Could not list tools, proceeding with direct query...');
  }

  // Try to query JIRA data
  // Common MCP tool methods for Dataverse:
  const queries = [
    { method: 'read_query', params: { query: query || 'SELECT TOP 10 * FROM jira_issues' } },
    { method: 'search', params: { keywords: 'jira', limit: 10 } },
    { method: 'fetch', params: { entity: 'jira_issues', id: '1' } }
  ];

  for (const queryAttempt of queries) {
    try {
      console.log(`Trying method: ${queryAttempt.method}...`);
      const result = await sendMCPRequest(`tools/call`, {
        name: queryAttempt.method,
        arguments: queryAttempt.params
      });
      return result;
    } catch (e) {
      console.log(`Method ${queryAttempt.method} failed, trying next...`);
      continue;
    }
  }

  throw new Error('Could not query JIRA data with any available method');
}

async function main() {
  console.log('Connecting to Ask Dataverse MCP Server...');
  console.log(`Server URL: ${MCP_SERVER_URL}\n`);

  try {
    // First, try to list available tables/data products
    const tables = await listTables();
    console.log('\nAvailable tables/data products:');
    console.log(JSON.stringify(tables, null, 2));
    console.log('\n');

    // Query JIRA data
    const jiraData = await queryJIRA();
    console.log('\nJIRA Data:');
    console.log(JSON.stringify(jiraData, null, 2));

  } catch (error: any) {
    console.error('\nError:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify the MCP server is accessible at:', MCP_SERVER_URL);
    console.error('2. Check if authentication is required');
    console.error('3. Verify the server supports the MCP protocol over HTTP');
    console.error('4. Check Cursor MCP server connection status');
    process.exit(1);
  }
}

main();
