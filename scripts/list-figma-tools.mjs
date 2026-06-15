import http from 'node:http';

class McpSseClient {
  constructor(sseUrl) {
    this.sseUrl = sseUrl;
    this.postUrl = null;
    this.pendingRequests = new Map();
    this.nextId = 1;
    this.sseReq = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.sseReq = http.request(this.sseUrl, {
        method: 'GET',
        headers: { 'Accept': 'text/event-stream' }
      });

      this.sseReq.on('response', (res) => {
        let buffer = '';
        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            console.log(`[RAW LINE]: ${line}`);
            if (line.startsWith('data:')) {
              const dataStr = line.slice(5).trim();
              if (dataStr.startsWith('http://') || dataStr.startsWith('https://') || dataStr.startsWith('/')) {
                this.postUrl = dataStr.startsWith('/') ? new URL(dataStr, this.sseUrl).toString() : dataStr;
                resolve();
              } else {
                try {
                  const message = JSON.parse(dataStr);
                  console.log(`[RECEIVED MESSAGE]:`, JSON.stringify(message, null, 2));
                  this.handleMessage(message);
                } catch (e) {
                  console.log(`[JSON PARSE ERROR]:`, e.message);
                }
              }
            }
          }
        });
      });

      this.sseReq.on('error', reject);
      this.sseReq.end();
    });
  }

  handleMessage(message) {
    if (message.id !== undefined) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);
        if (message.error) {
          pending.reject(new Error(JSON.stringify(message.error)));
        } else {
          pending.resolve(message.result);
        }
      }
    }
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pendingRequests.set(id, { resolve, reject });

      const payload = { jsonrpc: '2.0', id, method, params };
      this.postJson(payload).catch((err) => {
        this.pendingRequests.delete(id);
        reject(err);
      });
    });
  }

  sendNotification(method, params = {}) {
    const payload = { jsonrpc: '2.0', method, params };
    return this.postJson(payload);
  }

  async postJson(body) {
    console.log(`[POST JSON] Sending: ${body.method || 'notification'} (id: ${body.id})`);
    try {
      const res = await fetch(this.postUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      console.log(`[POST JSON RESPONSE] Status: ${res.status} for ${body.method || 'notification'}`);
      const text = await res.text();
      if (text) {
        console.log(`[POST JSON RESPONSE BODY]: ${text}`);
      }
    } catch (err) {
      console.error(`[POST JSON ERROR] for ${body.method || 'notification'}:`, err.message);
      throw err;
    }
  }

  close() {
    if (this.sseReq) {
      this.sseReq.destroy();
    }
  }
}

async function run() {
  const client = new McpSseClient('http://127.0.0.1:3845/sse');
  console.log("Connecting to SSE...");
  await client.connect();
  console.log(`Connected. Post URL: ${client.postUrl}`);

  console.log("Initializing...");
  const initResult = await client.sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'list-tools-client', version: '1.0.0' }
  });
  console.log("Init success.");

  await client.sendNotification('notifications/initialized');

  console.log("Fetching tools list...");
  const toolsResult = await client.sendRequest('tools/list');
  console.log("\n--- AVAILABLE TOOLS ---");
  console.log(JSON.stringify(toolsResult, null, 2));
  console.log("-----------------------\n");

  client.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("Error running client:", err);
  process.exit(1);
});
