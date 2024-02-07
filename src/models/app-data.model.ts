import { model, property } from "@loopback/repository";
import { BaseModel } from "./_base-model";

interface Data {
  [key: string]: string | number | boolean | null | Data | Data[];
}

@model()
export class AppData extends BaseModel {
  @property({ type: "string", id: true })
  name: string;

  @property({ type: "string", index: true })
  type: string;

  @property({ type: "object" })
  data?: Data;

  constructor(data?: Partial<AppData>) {
    super(data);
  }
}
