import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {PostgresDataSource} from './datasources/postgres.datasource';
import {OrderRepository} from './repositories';
import {OrderService} from './services/order.service';
import {WebSocketManager} from './websocket/websocket.manager';
import {OrderWorker} from './workers/order.worker';
import {RaydiumAdapter} from './services/raydium.adapter';
import {MeteoraAdapter} from './services/meteora.adapter';
import {DexRouter} from './services/dex.router';
import {MockRaydiumAdapter} from './services/mock-raydium.adapter';
import {MockMeteoraAdapter} from './services/mock-meteora.adapter';
import {logger} from './helpers/logger';

export {ApplicationConfig};

export class OrderExecutionEngineApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    logger.info('🚀 Booting Order Execution Engine Application...');

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    this.dataSource(PostgresDataSource);

    this.repository(OrderRepository);

    this.service(OrderService);

    this.service(WebSocketManager);

    this.bind('services.MockRaydiumAdapter').toClass(MockRaydiumAdapter);
    this.bind('services.MockMeteoraAdapter').toClass(MockMeteoraAdapter);
    this.bind('services.DexRouter').toClass(DexRouter);

    this.bind('workers.OrderWorker').toClass(OrderWorker);
  }
}
