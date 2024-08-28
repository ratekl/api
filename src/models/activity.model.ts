import { Entity, model, property } from "@loopback/repository";
import { BaseModel } from "./_base-model";

export type ActivityItemType = {
  [user: string]: string
};

export type ActivityType = {
  [key: string]: ActivityItemType
};

export type ActivityDomainType = {
  [key: string]: ActivityType
}

@model()
export class Activity extends Entity {

  @property({ type: "object" })
  data?: ActivityDomainType;

  constructor(data?: Partial<Activity>) {
    super(data);
  }
}
