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
  Request,
  requestBody,
  RestBindings,
} from '@loopback/rest';
import { AppData } from '../models/app-data.model';
import { AppDataRepository} from '../repositories/app-data.repository';
import { inject } from '@loopback/core';
import { MongoDataSource } from '../datasources/mongo.datasource';
import { AppInfoRepository } from '../repositories/app-info.repository';
import { pushBasicComment, pushBasicPost } from '../ratekl/services/push-basic.service';
import { AppMemberRepository } from '../repositories/app-member.repository';
import { ActivityService, ActivityServiceBindings } from '../ratekl/services/activity.service';

export class AppDataController {
  constructor(
    @inject(ActivityServiceBindings.ACTIVITY_SERVICE)
    protected activityService: ActivityService,
    @repository(AppDataRepository)
    protected appDataRepository: AppDataRepository,
    @repository(AppInfoRepository)
    protected appInfoRepository: AppInfoRepository,
    @repository(AppMemberRepository)
    protected appMemberRepository: AppMemberRepository,
    @inject('datasources.mongo')
    protected dataSource: MongoDataSource,
    @inject(RestBindings.Http.REQUEST)
    protected request: Request,
  ) {}
  
  @post('/app-data', {
    operationId: 'create',
    responses: {
      '200': {
        description: 'AppData model instance',
        content: {'application/json': {schema: getModelSchemaRef(AppData)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppData),
        },
      },
    })
    appData: AppData,
  ): Promise<AppData> {
    if (appData.type === 'post' || appData.type === 'comment') {
      try {
        const appInfo = (await this.appInfoRepository.find({
          where: { published: true}
        }))[0];

        if ((appInfo?.info?.features as any)?.pushBasic) {
          try {
            const postUser = await this.appMemberRepository.findById('' + (appData.data?.memberUserName ?? appData.data?.userName));
            const title = (appInfo.info?.content as any)?.title;
            const users = await this.appMemberRepository.find({
              where: {
                userName: {
                  neq: postUser.userName
                }
              }
            });
            const hostName = this._clean(this.request.hostname);

            if (appData.type === 'post') {
              pushBasicPost(appData, postUser, title, users, this.appDataRepository, this.activityService, hostName);
            } else if (appData.type === 'comment') {
              pushBasicComment(appData, postUser, title, users, this.appDataRepository, this.activityService, hostName);;
            }
          } catch(e) {
            console.log(e);
          }
        }
      } catch(e) {
        console.log(e);
      }
    }
  
    return this.appDataRepository.create(appData);
  }

  @get('/app-data/count', {
    operationId: 'count',
    responses: {
      '200': {
        description: 'AppData model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(AppData))
    where?: Where<AppData>,
  ): Promise<Count> {
    return this.appDataRepository.count(where);
  }

  @get('/app-data', {
    operationId: 'find',
    responses: {
      '200': {
        description: 'Array of appData model instances',
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
    return this.appDataRepository.find(filter);
  }

  @patch('/app-data', {
    operationId: 'updateAll',
    responses: {
      '200': {
        description: 'AppData PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppData, {partial: true}),
        },
      },
    })
    appData: AppData,
    @param.query.object('where', getWhereSchemaFor(AppData))
    where?: Where<AppData>,
  ): Promise<Count> {
    return this.appDataRepository.updateAll(appData, where);
  }

  @get('/app-data/{id}', {
    operationId: 'findById',
    responses: {
      '200': {
        description: 'AppData model instance',
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
    return this.appDataRepository.findById(id, filter);
  }

  @patch('/app-data/{id}', {
    operationId: 'updateById',
    responses: {
      '204': {
        description: 'AppData PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppData, {partial: true}),
        },
      },
    })
    appData: AppData,
  ): Promise<void> {
    await this.appDataRepository.updateById(id, appData);
  }

  @put('/app-data/{id}', {
    operationId: 'replaceById',
    responses: {
      '204': {
        description: 'Product PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() appData: AppData,
  ): Promise<void> {
    await this.appDataRepository.replaceById(id, appData);
  }

  @del('/app-data/{id}', {
    operationId: 'deleteById',
    responses: {
      '204': {
        description: 'AppData DELETE success',
      },
    },
  })
  async deleteById(
    @param.path.string('id') id: string,
  ): Promise<void> {
    await this.appDataRepository.deleteById(id);
  }

  _clean(hostname: string) {
    return hostname.replace('www.', '').replace('.preview.ratekl.com','').replace('-', '.').replace(/\.local$/, '');
  }

  @post('/migrate', {
    operationId: 'migrate',
    responses: {
      '200': {
        description: 'Migration model instance',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async migrate(): Promise<Count> {
    // const existingSchema = 'alter';
    // this.app.migrateSchema({existingSchema});

    const result = await this.appDataRepository.count();

    let hostName;
    if (this.request.headers['x-forwarded-host']){
      hostName = this._clean(this.request.headers['x-forwarded-host'].toString().split(':')[0]);
    } else {
      hostName  = this._clean(this.request.hostname);
    }

    const modelName =  'AppData_app_' + hostName?.replace(/\./g, "_");

    this.dataSource.automigrate(modelName);

    return result;
  }
}
