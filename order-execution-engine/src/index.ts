import {
  ApplicationConfig,
  OrderExecutionEngineApplication,
} from './application';
import {WebSocketManager} from './websocket/websocket.manager';

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new OrderExecutionEngineApplication(options);
  await app.boot();
  await app.start();

  const server = app.restServer.httpServer?.server;
  console.log(`Server is running at ${server}`);
  console.log(`Try ${server}/ping`);

  const wsManager = await app.get<WebSocketManager>(
    'services.WebSocketManager',
  );
  wsManager.start(server);

  await app.get('workers.OrderWorker');

  return app;
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST || '127.0.0.1',
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
