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

  definePersistedModel(entityClass: typeof Domain) {
    const modelClass = super.definePersistedModel(entityClass);
    modelClass.observe('before save', async (ctx: any) => {
      const domain = ctx.instance ?? ctx.data;
      if (ctx.isNewInstance) {
        domain.createdAt = new Date();
        domain.updatedAt = new Date();
      } else {
        domain.updatedAt = new Date();
      }
    });

    return modelClass;
  }
}
