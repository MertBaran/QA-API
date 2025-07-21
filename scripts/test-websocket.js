const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', function open() {
  console.log('🔌 Connected to WebSocket monitoring server');

  // Ping the server
  ws.send(
    JSON.stringify({
      type: 'ping',
      data: {},
      timestamp: new Date(),
    })
  );

  // Request status
  ws.send(
    JSON.stringify({
      type: 'get_status',
      data: {},
      timestamp: new Date(),
    })
  );

  // Request alerts
  ws.send(
    JSON.stringify({
      type: 'get_alerts',
      data: { limit: 5 },
      timestamp: new Date(),
    })
  );

  // Request stats
  ws.send(
    JSON.stringify({
      type: 'get_stats',
      data: {},
      timestamp: new Date(),
    })
  );
});

ws.on('message', function message(data) {
  const message = JSON.parse(data);

  console.log('\n📨 Received message:');
  console.log('Type:', message.type);
  console.log('Timestamp:', message.timestamp);

  switch (message.type) {
    case 'pong':
      console.log('🏓 Server responded to ping');
      break;

    case 'connection_status':
      console.log('📊 Connection Status:');
      message.data.forEach(status => {
        console.log(
          `  ${status.service}: ${status.status} (${status.lastCheck})`
        );
        if (status.details) {
          console.log(`    Details:`, status.details);
        }
      });
      break;

    case 'alert':
      console.log('🚨 Alerts:');
      message.data.forEach(alert => {
        console.log(`  ${alert.timestamp}: ${alert.message}`);
      });
      break;

    case 'stats':
      console.log('📈 Monitoring Stats:');
      console.log('  Monitoring Active:', message.data.isMonitoring);
      console.log('  Total Alerts:', message.data.totalAlerts);
      console.log('  Connection Lost:', message.data.connectionLost);
      console.log('  Connection Restored:', message.data.connectionRestored);
      console.log('  Connected Clients:', message.data.connectedClients);
      break;

    default:
      console.log('❓ Unknown message type:', message.type);
  }
});

ws.on('close', function close() {
  console.log('🔌 Disconnected from WebSocket server');
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});

// Keep connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: 'ping',
        data: {},
        timestamp: new Date(),
      })
    );
  }
}, 30000);

console.log('🚀 WebSocket monitoring client started');
console.log('Press Ctrl+C to exit');
