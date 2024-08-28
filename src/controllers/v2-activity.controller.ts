import {
  get,
  getModelSchemaRef,
  put,
  Request,
  requestBody,
  RestBindings,
} from '@loopback/rest';
import { inject } from '@loopback/core';
import { authenticate } from '@loopback/authentication';
import { ActivityService, ActivityServiceBindings } from '../ratekl/services/activity.service';
import { Activity } from '../models/activity.model';

const securityRequirement = [{jwt: []}];

@authenticate('jwt')
export class ActivityControllerV2 {
  constructor(
    @inject(ActivityServiceBindings.ACTIVITY_SERVICE)
    protected activityService: ActivityService,
    @inject(RestBindings.Http.REQUEST)
    protected request: Request,
  ) {}
  @get('/activity-v2', {
    operationId: 'get',
    security: securityRequirement,
    responses: {
      '200': {
        description: 'The activity Data',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Activity, {includeRelations: true})
          },
        },
      },
    },
  })
  async find(): Promise<Activity> {
    const data = await this.activityService.getAllDomainActivity();
    return new Activity({ data });
  }

  @put('/activity-v2', {
    operationId: 'replace',
    security: securityRequirement,
    responses: {
      '204': {
        description: 'Product PUT success',
      },
    },
  })
  async replace(
    @requestBody() activity: Activity,
  ): Promise<void> {
    await this.activityService.setAllDomainActivity(activity.data);
  }
}
