import {Entity, model, property} from '@loopback/repository';

@model()
export class AppInfo extends Entity {
  @property({
    type: 'string',
    id: true,
  })
  name: string;

  @property({
    type: 'object'
  })
  info?: { [key: string]: any };

  constructor(data?: Partial<AppInfo>) {
    super(data);
  }
}
