import {inject, lifeCycleObserver, ValueOrPromise} from '@loopback/core';
import {juggler, AnyObject} from '@loopback/repository';

const config = {
  name: 'mongo',
  connector: 'mongodb',
  url: 'mongodb://127.0.0.1:27017/ratekl_core',
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

function updateConfig(dsConfig: AnyObject) {
  console.log('config.url', config.url)
  console.log('RATEKL_APP_MONGODB_SERVICE_DATABASE_URL', process.env.RATEKL_APP_MONGODB_SERVICE_DATABASE_URL)
  dsConfig.url = process.env.RATEKL_APP_MONGODB_SERVICE_DATABASE_URL ?? config.url;
  
  return dsConfig;
}

@lifeCycleObserver('datasource')
export class MongoDataSource extends juggler.DataSource {
  static readonly dataSourceName = config.name;
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.mongo', {optional: true})
    dsConfig: AnyObject = config,
  ) {
    super(updateConfig(dsConfig));
  }

  /**
   * Disconnect the datasource when application is stopped. This allows the
   * application to be shut down gracefully.
   */
  stop(): ValueOrPromise<void> {
    return super.disconnect();
  }
}
