import {inject} from '@loopback/core';
import {
  Request,
  RestBindings,
  get,
  ResponseObject,
} from '@loopback/rest';

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          timestamp: {type: 'string'},
        },
      },
    },
  },
};

/**
 * A simple controller to bounce back http requests
 */
export class PingController {
  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {}

  // Map to `GET /ping`
  @get('/ping', {
    operationId: 'ping',
    responses: {
      '200': {
        description: 'Ping Response Data',
        content: {
          'application/json': {
            schema: PING_RESPONSE,
          },
        },
      },
    },
  })
  ping(): object {
    return {
      timestamp: new Date(),
    };
  }
}
