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
import { AppMember } from '../models/app-member.model';
import { AppMemberRepository} from '../repositories/app-member.repository';
import { inject } from '@loopback/core';
import { MongoDataSource } from '../datasources/mongo.datasource';
import { generateToken, verifyPw } from '../util/auth';
import { authenticate } from '@loopback/authentication';

const securityRequirement = [{jwt: []}];

@authenticate('jwt')
export class AppMemberControllerV2 {
  constructor(
    @repository(AppMemberRepository)
    protected appMemberRepository: AppMemberRepository,
    @inject('datasources.mongo')
    protected dataSource: MongoDataSource,
    @inject(RestBindings.Http.REQUEST)
    protected request: Request,
  ) {}

  @post('/app-member-v2', {
    operationId: 'create',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'AppMember model instance',
        content: {'application/json': {schema: getModelSchemaRef(AppMember)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppMember),
        },
      },
    })
    appMember: AppMember,
  ): Promise<AppMember> {
    return this.appMemberRepository.create(appMember);
  }

  @get('/app-member-v2/count', {
    operationId: 'count',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'AppMember model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(AppMember))
    where?: Where<AppMember>,
  ): Promise<Count> {
    return this.appMemberRepository.count(where);
  }

  @get('/app-member-v2', {
    operationId: 'find',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'Array of appMember model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(AppMember, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(AppMember))
    filter?: Filter<AppMember>,
  ): Promise<AppMember[]> {
    return this.appMemberRepository.find(filter);
  }

  @patch('/app-member-v2', {
    operationId: 'updateAll',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'AppMember PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppMember, {partial: true}),
        },
      },
    })
    appMember: AppMember,
    @param.query.object('where', getWhereSchemaFor(AppMember))
    where?: Where<AppMember>,
  ): Promise<Count> {
    return this.appMemberRepository.updateAll(appMember, where);
  }

  @get('/app-member-v2/{userName}', {
    operationId: 'findByUserName',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'AppMember model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(AppMember),
          },
        },
      },
    },
  })
  async findByUserName(
    @param.path.string('userName') userName: string,
    @param.query.object('filter', getFilterSchemaFor(AppMember))
    filter?: Filter<AppMember>,
  ): Promise<AppMember> {
    return this.appMemberRepository.findById(userName, filter);
  }

  @patch('/app-member-v2/{userName}', {
    operationId: 'updateByUserName',
    security: securityRequirement,
    responses: {
      '204': {
        description: 'AppMember PATCH success',
      },
    },
  })
  async updateByUserName(
    @param.path.string('userName') userName: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppMember, {partial: true}),
        },
      },
    })
    appMember: AppMember,
  ): Promise<void> {
    await this.appMemberRepository.updateById(userName, appMember);
  }

  @put('/app-member-v2/{userName}', {
    operationId: 'replaceByUserName',
    security: securityRequirement,
    responses: {
      '204': {
        description: 'Product PUT success',
      },
    },
  })
  async replaceByUserName(
    @param.path.string('userName') userName: string,
    @requestBody() appMember: AppMember,
  ): Promise<void> {
    await this.appMemberRepository.replaceById(userName, appMember);
  }

  @del('/app-member-v2/{userName}', {
    operationId: 'deleteByUserName',
    security: securityRequirement,
    responses: {
      '204': {
        description: 'AppMember DELETE success',
      },
    },
  })
  async deleteByUserName(
    @param.path.string('userName') userName: string,
  ): Promise<void> {
    await this.appMemberRepository.deleteById(userName);
  }

  _clean(hostname: string) {
    return hostname.replace('www.', '').replace('.preview.ratekl.com','').replace('-', '.').replace(/\.local$/, '');
  }

  // @post('/migrate', {
  //   operationId: 'migrate',
  //   responses: {
  //     '200': {
  //       description: 'Migration model instance',
  //       content: {'application/json': {schema: CountSchema}},
  //     },
  //   },
  // })
  // async migrate(): Promise<Count> {
  //   // const existingSchema = 'alter';
  //   // this.app.migrateSchema({existingSchema});

  //   const result = await this.appMemberRepository.count();

  //   let hostName;
  //   if (this.request.headers['x-forwarded-host']){
  //     hostName = this._clean(this.request.headers['x-forwarded-host'].toString().split(':')[0]);
  //   } else {
  //     hostName  = this._clean(this.request.hostname);
  //   }

  //   const modelName =  'AppMember_app_' + hostName?.replace(/\./g, "_");

  //   this.dataSource.automigrate(modelName);

  //   return result;
  // }
}
