import { inject } from '@loopback/core';
import { repository } from '@loopback/repository';
import { MongoDataSource } from '../datasources/mongo.datasource';
import { AppMember } from '../models/app-member.model';
import { MultiRepository } from '../multi-repository';
import { Request, RequestContext, RestBindings } from '@loopback/rest';
import { DomainRepository } from './domain.repository';

export class AppMemberRepository extends MultiRepository<
  AppMember,
  typeof AppMember.prototype.userName
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
    @inject(RestBindings.Http.REQUEST) request: Request,
    @inject(RestBindings.Http.CONTEXT) context: RequestContext,
    @repository(DomainRepository) domainRepository: DomainRepository,
  ) {
    super(AppMember, dataSource, request, context, domainRepository);
  }
}
