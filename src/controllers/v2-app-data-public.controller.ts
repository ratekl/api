import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  Request,
  RestBindings,
} from '@loopback/rest';
import { AppData } from '../models/app-data.model';
import { AppDataRepository} from '../repositories/app-data.repository';
import { inject } from '@loopback/core';
import { MongoDataSource } from '../datasources/mongo.datasource';

export class AppDataPublicControllerV2 {
  constructor(
    @repository(AppDataRepository)
    protected appDataRepository: AppDataRepository,
    @inject('datasources.mongo')
    protected dataSource: MongoDataSource,
    @inject(RestBindings.Http.REQUEST)
    protected request: Request,
  ) {}
  
  @get('/app-data-public-v2', {
    operationId: 'find',
    responses: {
      '200': {
        description: 'Array of appData public model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(AppData, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(AppData))
    filter?: Filter<AppData>,
  ): Promise<AppData[]> {
    const updatedFilter = { }
    return await this.appDataRepository.find(updateFilter(filter))
  }

  @get('/app-data-public-v2/{id}', {
    operationId: 'findById',
    responses: {
      '200': {
        description: 'AppData public model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(AppData),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(AppData))
    filter?: Filter<AppData>,
  ): Promise<AppData> {
    return await this.appDataRepository.findById(id, updateFilter(filter));
  }
}


function updateFilter(filter: any) {
  return { ...filter, where: { ...filter?.where, access: 'public'} };
}