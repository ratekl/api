import { inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { MongoDataSource } from '../datasources/mongo.datasource';
import { AppInfo } from '../models/app-info.model';
import { MultiRepository } from '../multi-repository';
import { Request, RequestContext, RestBindings } from '@loopback/rest';
import { DomainRepository } from './domain.repository';

export class AppInfoRepository extends MultiRepository<
  AppInfo,
  typeof AppInfo.prototype.name
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
    @inject(RestBindings.Http.REQUEST) request: Request,
    @inject(RestBindings.Http.CONTEXT) context: RequestContext,
    @repository(DomainRepository) domainRepository: DomainRepository,
  ) {
    super(AppInfo, dataSource, request, context, domainRepository);
  }
}
