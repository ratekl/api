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
import { authenticate } from '@loopback/authentication';

const securityRequirement = [{jwt: []}];

@authenticate('jwt')
export class AppInfoControllerV2 {
  constructor(
    @repository(AppInfoRepository)
    protected appInfoRepository: AppInfoRepository,
  ) {}

  @post('/publish-v2/', {
    operationId: 'publish',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'AppInfo model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async publish(
    @requestBody({
      content: {
        'application/json': {
          schema: { type: 'object', properties: { name: { type: 'string' } }},
        },
      },
    })
    publishInfo: { name: string },
  ): Promise<Count> {
    let count = 0;
    // get `published` and set as `previous` (don't unpublish yet, publish new version first)
    const appInfoPrevious = (await this.appInfoRepository.find({ fields: { "name": true }, where: { published: { 'eq': true } }}))[0];
    if (appInfoPrevious) {
      await this.appInfoRepository.updateById(appInfoPrevious.name, { previous: true });
      count += 1;
    }

    // update status of draft to publish
    const appInfoPublish: AppInfo = new AppInfo({ published: true, publishedDate: (new Date()).toISOString(), draft: false, previous: false, history: false });
    await this.appInfoRepository.updateById(publishInfo.name, appInfoPublish);
    count += 1;

    // set all others status to unpublished
    const appInfoDraft: AppInfo = new AppInfo({ published: false });
    const resUnpublish = await this.appInfoRepository.updateAll(appInfoDraft, { name: { 'neq': publishInfo.name } });
    count += resUnpublish.count;

    // clear old previous entry and set as history (has previous flag set true but not same name as previous published)
    const appInfoHistory: AppInfo = new AppInfo({ previous: false, history: true });
    const resHistory = await this.appInfoRepository.updateAll(appInfoHistory, { name: { 'neq': appInfoPrevious.name }, previous: { 'eq': true } });
    count += resHistory.count;

    // number of updated models
    return { count };
  }
  
  @post('/revert-v2/', {
    operationId: 'revert',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'AppInfo model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async revert(
    @requestBody({
      content: {
        'application/json': {
          schema: { type: 'object', properties: { name: { type: 'string' } }},
        },
      },
    })
    publishInfo: { name: string },
  ): Promise<Count> {
    let count = 0;
    // get `previous` and set as `published`
    const appInfoPrevious = (await this.appInfoRepository.find({ fields: { "name": true }, where: { previous: { 'eq': true } }}))[0];
    if (appInfoPrevious) {
      await this.appInfoRepository.updateById(appInfoPrevious.name, { published: true, previous: false });
      count += 1;
    } else {
      throw new Error(`Unable to revert '${publishInfo.name}' - previous published intance not found`);
    }

    // clear old published entry and set as previous (has published flag set true but not same name as previous published)
    const appInfoRevert: AppInfo = new AppInfo({ published: false, previous: true });
    const resUnpublish = await this.appInfoRepository.updateAll(appInfoRevert, { name: { 'neq': appInfoPrevious.name }, published: { 'eq': true } });
    count += resUnpublish.count;

    // number of updated models
    return { count };
  }
  
  @post('/app-info-v2', {
    operationId: 'create',
    security: securityRequirement,
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

  @get('/app-info-v2/count', {
    operationId: 'count',
    security: securityRequirement,
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

  @get('/app-info-v2', {
    operationId: 'find',
    security: securityRequirement,
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

  @patch('/app-info-v2', {
    operationId: 'updateAll',
    security: securityRequirement,
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

  @get('/app-info-v2/{id}', {
    operationId: 'findById',
    security: securityRequirement,
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

  @patch('/app-info-v2/{id}', {
    operationId: 'updateById',
    security: securityRequirement,
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

  @put('/app-info-v2/{id}', {
    operationId: 'replaceById',
    security: securityRequirement,
    responses: {
      '204': {
        description: 'Product PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() appInfo: AppInfo,
  ): Promise<void> {
    await this.appInfoRepository.replaceById(id, appInfo);
  }

  @del('/app-info-v2/{id}', {
    operationId: 'deleteById',
    security: securityRequirement,
    responses: {
      '204': {
        description: 'AppInfo DELETE success',
      },
    },
  })
  async deleteById(
    @param.path.string('id') id: string,
  ): Promise<void> {
    await this.appInfoRepository.deleteById(id);
  }
}
