import http from 'node:http';

async function main() {
  console.log("Connecting to Figma MCP SSE server...");
  const sseUrl = 'http://127.0.0.1:3845/sse';
  
  // Create an SSE request
  const req = http.request(sseUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream'
    }
  });

  req.on('response', (res) => {
    console.log(`SSE Status: ${res.statusCode}`);
    let postUrl = '';
    let buffer = '';

    res.on('data', async (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          const eventType = line.slice(6).trim();
          console.log(`Event type: ${eventType}`);
        } else if (line.startsWith('data:')) {
          const dataStr = line.slice(5).trim();
          console.log(`Event data: ${dataStr}`);
          try {
            // Check if it's the endpoint URL
            if (dataStr.startsWith('http://') || dataStr.startsWith('https://') || dataStr.startsWith('/')) {
              postUrl = dataStr.startsWith('/') ? new URL(dataStr, sseUrl).toString() : dataStr;
              console.log(`Message POST endpoint discovered: ${postUrl}`);
              
              // Now initialize
              await initializeMcp(postUrl);
            } else {
              const parsed = JSON.parse(dataStr);
              console.log("Parsed SSE JSON:", parsed);
            }
          } catch (e) {
            // Not JSON or other error
          }
        }
      }
    });
  });

  req.on('error', (err) => {
    console.error("SSE connection error:", err.message);
    process.exit(1);
  });

  req.end();
}

async function initializeMcp(postUrl) {
  console.log("Initializing MCP...");
  const initPayload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  const response = await postJson(postUrl, initPayload);
  console.log("Initialize Response:", JSON.stringify(response, null, 2));

  // Send initialized notification
  const initializedPayload = {
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  };
  await postJson(postUrl, initializedPayload);
  console.log("Sent notifications/initialized");

  // List tools
  console.log("Listing tools...");
  const listToolsPayload = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  const toolsResponse = await postJson(postUrl, listToolsPayload);
  console.log("Tools List Response:", JSON.stringify(toolsResponse, null, 2));
  process.exit(0);
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (data) {
            resolve(JSON.parse(data));
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

main().catch(console.error);
