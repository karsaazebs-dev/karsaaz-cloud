import { spawn } from 'node:child_process';

function main() {
  console.log("Starting npx mcp-remote http://127.0.0.1:3845/sse...");
  
  // Spawn the mcp-remote proxy
  const child = spawn('npx', ['mcp-remote', 'http://127.0.0.1:3845/sse'], {
    shell: true
  });

  let buffer = '';
  const pendingRequests = new Map();
  let nextId = 1;

  child.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      console.log(`[STDOUT RECEIVED]: ${trimmed}`);
      try {
        const message = JSON.parse(trimmed);
        if (message.id !== undefined) {
          const pending = pendingRequests.get(message.id);
          if (pending) {
            pendingRequests.delete(message.id);
            if (message.error) {
              pending.reject(message.error);
            } else {
              pending.resolve(message.result);
            }
          }
        }
      } catch (e) {
        // Not JSON
      }
    }
  });

  child.stderr.on('data', (data) => {
    console.error(`[STDERR]: ${data.toString().trim()}`);
  });

  child.on('close', (code) => {
    console.log(`Proxy exited with code ${code}`);
    process.exit(code || 0);
  });

  function sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      pendingRequests.set(id, { resolve, reject });
      const payload = { jsonrpc: '2.0', id, method, params };
      const str = JSON.stringify(payload) + '\n';
      console.log(`[SENDING REQUEST]: ${JSON.stringify(payload)}`);
      child.stdin.write(str);
    });
  }

  function sendNotification(method, params = {}) {
    const payload = { jsonrpc: '2.0', method, params };
    const str = JSON.stringify(payload) + '\n';
    console.log(`[SENDING NOTIFICATION]: ${JSON.stringify(payload)}`);
    child.stdin.write(str);
  }

  // Run the sequence
  async function runSequence() {
    // Wait a brief moment for the proxy to start up
    await new Promise((r) => setTimeout(r, 2000));

    console.log("Sending initialize request...");
    const initResult = await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'list-tools-stdio-client', version: '1.0.0' }
    });
    console.log("Initialize Result:", JSON.stringify(initResult, null, 2));

    sendNotification('notifications/initialized');

    console.log("Sending tools/list request...");
    const toolsResult = await sendRequest('tools/list');
    console.log("\n=== Figma MCP Tools ===");
    console.log(JSON.stringify(toolsResult, null, 2));
    console.log("========================\n");

    child.kill();
    process.exit(0);
  }

  runSequence().catch((err) => {
    console.error("Error during sequence:", err);
    child.kill();
    process.exit(1);
  });
}

main();
