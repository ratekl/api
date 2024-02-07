import { model, property } from "@loopback/repository";
import { BaseModel } from "./_base-model";

@model()
export class Domain extends BaseModel {
  @property({ id: true, type: "string", required: true })
  hostname: string;

  @property({ type: "string", required: true })
  database: string;

  @property({ type: "string", required: false })
  redirect: string;

  @property({ type: "boolean", default: false })
  active: string;

  constructor(data?: Partial<Domain>) {
    super(data);
  }
}
