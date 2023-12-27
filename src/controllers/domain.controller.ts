import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
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
import { Domain } from '../models/domain.model';
import { DomainRepository} from '../repositories/domain.repository';

const securityRequirement = [{jwt: []}];

export class DomainController {
  constructor(
    @repository(DomainRepository)
    protected domainRepository: DomainRepository,
  ) {}
  
  @post('/domains', {
    operationId: 'create',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'Domain model instance',
        content: {'application/json': {schema: getModelSchemaRef(Domain)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Domain),
        },
      },
    })
    domain: Domain,
  ): Promise<Domain> {
    return this.domainRepository.create(domain);
  }

  // @authenticate('supertokens')
  // @authorize({allowedRoles: ['admin']})
  @get('/domains/count', {
    operationId: 'count',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'Domain model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(Domain))
    where?: Where<Domain>,
  ): Promise<Count> {
    return this.domainRepository.count(where);
  }

  @get('/domains', {
    operationId: 'find',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'Array of domain model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Domain, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(Domain))
    filter?: Filter<Domain>,
  ): Promise<Domain[]> {
    return this.domainRepository.find(filter);
  }

  @patch('/domains', {
    operationId: 'updateAll',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'Domain PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Domain, {partial: true}),
        },
      },
    })
    domain: Domain,
    @param.query.object('where', getWhereSchemaFor(Domain))
    where?: Where<Domain>,
  ): Promise<Count> {
    return this.domainRepository.updateAll(domain, where);
  }

  @get('/domains/{hostname}', {
    operationId: 'findByHostname',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'Domain model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Domain),
          },
        },
      },
    },
  })
  async findByHostname(
    @param.path.string('hostname') hostname: string,
    @param.query.object('filter', getFilterSchemaFor(Domain))
    filter?: Filter<Domain>,
  ): Promise<Domain> {
    return this.domainRepository.findById(hostname, filter);
  }

  @patch('/domains/{hostname}', {
    operationId: 'updateByHostname',
    security: securityRequirement,
    responses: {
      '204': {
        description: 'Domain PATCH success',
      },
    },
  })
  async updateByHostname(
    @param.path.string('hostname') hostname: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Domain, {partial: true}),
        },
      },
    })
    domain: Domain,
  ): Promise<void> {
    await this.domainRepository.updateById(hostname, domain);
  }

  @put('/domains/{hostname}', {
    operationId: 'replaceByHostname',
    security: securityRequirement,
    responses: {
      '204': {
        description: 'Product PUT success',
      },
    },
  })
  async replaceByHostname(
    @param.path.string('hostname') hostname: string,
    @requestBody() domain: Domain,
  ): Promise<void> {
    await this.domainRepository.replaceById(hostname, domain);
  }

  @del('/domains/{hostname}', {
    operationId: 'deleteByHostname',
    security: securityRequirement,
    responses: {
      '204': {
        description: 'Domain DELETE success',
      },
    },
  })
  async deleteByHostname(
    @param.path.string('hostname') hostname: string,
  ): Promise<void> {
    await this.domainRepository.deleteById(hostname);
  }
}
