import { inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { MongoDataSource } from '../datasources/mongo.datasource';
import { AppData } from '../models/app-data.model';
import { MultiRepository } from '../multi-repository';
import { Request, RequestContext, RestBindings } from '@loopback/rest';
import { DomainRepository } from './domain.repository';

export class AppDataRepository extends MultiRepository<
  AppData,
  typeof AppData.prototype.name
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
    @inject(RestBindings.Http.REQUEST) request: Request,
    @inject(RestBindings.Http.CONTEXT) context: RequestContext,
    @repository(DomainRepository) domainRepository: DomainRepository,
  ) {
    super(AppData, dataSource, request, context, domainRepository);
  }
}
