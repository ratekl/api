import { Entity, model, property } from "@loopback/repository";

interface Info {
  [key: string]: string | number | boolean | null | Info | Info[];
}

@model()
export class AppInfo extends Entity {
  @property({ type: "string", id: true })
  name: string;

  @property({ type: "object" })
  info?: Info;

  constructor(data?: Partial<AppInfo>) {
    super(data);
  }
}
