import { Entity, model, property } from "@loopback/repository";

@model()
export class BaseModel extends Entity {
  @property({ type: "date", index: true })
  createdAt: Date;

  @property({ type: "date", index: true })
  updatedAt: Date;

  constructor(data?: Partial<BaseModel>) {
    super(data);
  }
}
