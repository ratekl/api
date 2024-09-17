import {
  repository,
} from '@loopback/repository';
import {
  getModelSchemaRef,
  post,
  Request,
  requestBody,
  RestBindings,
} from '@loopback/rest';
import { AppMember } from '../models/app-member.model';
import { AppMemberRepository} from '../repositories/app-member.repository';
import { inject } from '@loopback/core';
import { MongoDataSource } from '../datasources/mongo.datasource';
import { generateToken, verifyPw } from '../util/auth';

export class AuthControllerV2 {
  constructor(
    @repository(AppMemberRepository)
    protected appMemberRepository: AppMemberRepository,
    @inject('datasources.mongo')
    protected dataSource: MongoDataSource,
    @inject(RestBindings.Http.REQUEST)
    protected request: Request,
  ) {}
  
  @post('/auth-v2', {
    operationId: 'authorize',
    responses: {
      '200': {
        description: 'AppMember model instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              title: 'AuthResponse',
              properties: {
                token: {type: 'string'},
              },
            },
          },
        }
      },
    },
  })
  async authorize(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AppMember),
        },
      },
    })
    appMember: AppMember,
  ): Promise<{ token: string }> {
    try {
      const user = await this.appMemberRepository.findById(appMember.userName);

      if ((await verifyPw(appMember.password, user.password) )|| (user?.password === user?.phone?.replace(/\D/g,'') && user?.password === appMember.password)) {
        return { token: await generateToken(user) };
      } else {
        return { token: '' };
      }
    } catch(e) {
      return { token: ''};
    }
  }

}
