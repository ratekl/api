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
import { Domain } from '../models/domain.model';
import { DomainRepository} from '../repositories/domain.repository';
// import {basicAuthorization} from '../services';
// import {OPERATION_SECURITY_SPEC} from '../utils';

export class DomainController {
  constructor(
    @repository(DomainRepository)
    protected domainRepository: DomainRepository,
  ) {}
  
  @post('/domains', {
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

  @get('/domains/count', {
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
