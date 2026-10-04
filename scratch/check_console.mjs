async function main() {
  const tabs = await fetch('http://localhost:9222/json').then(r => r.json());
  const pageTab = tabs.find(t => t.url && t.url.includes('fany-schools1'));
  if (!pageTab) {
    console.log('No page tab found');
    return;
  }
  console.log('Page tab:', pageTab.webSocketDebuggerUrl);

  const ws = new globalThis.WebSocket(pageTab.webSocketDebuggerUrl);

  ws.onopen = () => {
    console.log('Connected to CDP');
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
    ws.send(JSON.stringify({ id: 4, method: 'Page.reload' }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('EXCEPTION THROWN:', JSON.stringify(msg.params.exceptionDetails, null, 2));
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
    }
  };

  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 6000);
}

main().catch(console.error);
