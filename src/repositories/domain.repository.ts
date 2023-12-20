import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { MongoDataSource } from '../datasources/mongo.datasource';
import { Domain } from '../models/domain.model';

export class DomainRepository extends DefaultCrudRepository<
  Domain,
  typeof Domain.prototype.hostname
> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(Domain, dataSource);
  }
}
