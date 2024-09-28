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
import { AppMember } from '../models/app-member.model';
import { AppMemberRepository} from '../repositories/app-member.repository';
import { inject } from '@loopback/core';
import { MongoDataSource } from '../datasources/mongo.datasource';

export class AppMemberPublicControllerV2 {
  constructor(
    @repository(AppMemberRepository)
    protected appMemberRepository: AppMemberRepository,
    @inject('datasources.mongo')
    protected dataSource: MongoDataSource,
    @inject(RestBindings.Http.REQUEST)
    protected request: Request,
  ) {}
  
  @get('/app-member-public-v2', {
    operationId: 'find',
    responses: {
      '200': {
        description: 'Array of appMember public model instances',
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
    const items = cleanPublicMembers(await this.appMemberRepository.find(filter));
  
    return items;
  }

  @get('/app-member-public-v2/{userName}', {
    operationId: 'findByUserName',
    responses: {
      '200': {
        description: 'AppMember public model instance',
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
    const member: any = cleanPublicMember(await this.appMemberRepository.findById(userName, filter));
    
    return member;
  }
}

function cleanPublicMembers(members: AppMember[]) {
  return members.map((member) => {
    return cleanPublicMember(member);
  });
}

function cleanPublicMember(member: AppMember) {
  const cleanMember: any = { ...member };

  if (cleanMember.password) {
    delete cleanMember.password;
  }
  
  if (cleanMember.memberData?.pushToken) {
    delete cleanMember.memberData.pushToken;
  }
  
  if (cleanMember.memberData?.pushType) {
    delete cleanMember.memberData.pushType;
  }

  return cleanMember
}
