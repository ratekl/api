// Copyright IBM Corp. 2019,2020. All Rights Reserved.
// Node module: loopback4-example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// import {authenticate} from '@loopback/authentication';
// import {authorize} from '@loopback/authorization';
import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import { AppInfo } from '../models/app-info.model';
import { AppInfoRepository} from '../repositories/app-info.repository';
// import {basicAuthorization} from '../services';
// import {OPERATION_SECURITY_SPEC} from '../utils';

export class AppInfoController {
  constructor(
    @repository(AppInfoRepository)
    protected appInfoRepository: AppInfoRepository,
  ) {}
  
  @post('/app-info', {
    responses: {
      '200': {
        description: 'AppInfo model instance',
        content: {'application/json': {schema: getModelSchemaRef(AppInfo)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppInfo),
        },
      },
    })
    appInfo: AppInfo,
  ): Promise<AppInfo> {
    return this.appInfoRepository.create(appInfo);
  }

  @get('/app-info/count', {
    responses: {
      '200': {
        description: 'AppInfo model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(AppInfo))
    where?: Where<AppInfo>,
  ): Promise<Count> {
    return this.appInfoRepository.count(where);
  }

  @get('/app-info', {
    responses: {
      '200': {
        description: 'Array of appInfo model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(AppInfo, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(AppInfo))
    filter?: Filter<AppInfo>,
  ): Promise<AppInfo[]> {
    return this.appInfoRepository.find(filter);
  }

  @patch('/app-info', {
    responses: {
      '200': {
        description: 'AppInfo PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppInfo, {partial: true}),
        },
      },
    })
    appInfo: AppInfo,
    @param.query.object('where', getWhereSchemaFor(AppInfo))
    where?: Where<AppInfo>,
  ): Promise<Count> {
    return this.appInfoRepository.updateAll(appInfo, where);
  }

  @get('/app-info/{id}', {
    responses: {
      '200': {
        description: 'AppInfo model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(AppInfo),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.query.object('filter', getFilterSchemaFor(AppInfo))
    filter?: Filter<AppInfo>,
  ): Promise<AppInfo> {
    return this.appInfoRepository.findById(id, filter);
  }

  @patch('/app-info/{id}', {
    responses: {
      '204': {
        description: 'AppInfo PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppInfo, {partial: true}),
        },
      },
    })
    appInfo: AppInfo,
  ): Promise<void> {
    await this.appInfoRepository.updateById(id, appInfo);
  }

  @put('/app-info/{id}', {
    responses: {
      '204': {
        description: 'Product PUT success',
      },
    },
  })
  async replaceByHostname(
    @param.path.string('id') id: string,
    @requestBody() appInfo: AppInfo,
  ): Promise<void> {
    await this.appInfoRepository.replaceById(id, appInfo);
  }

  @del('/app-info/{id}', {
    responses: {
      '204': {
        description: 'AppInfo DELETE success',
      },
    },
  })
  async deleteByHostname(
    @param.path.string('id') id: string,
  ): Promise<void> {
    await this.appInfoRepository.deleteById(id);
  }
}
