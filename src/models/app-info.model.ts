import { Entity, model, property } from "@loopback/repository";

interface Info {
  [key: string]: string | number | boolean | null | Info | Info[];
}

@model()
export class AppInfo extends Entity {
  @property({ type: "string", id: true })
  name: string;

  @property({ type: "boolean", default: false })
  published: boolean;

  @property({ type: "boolean", default: true })
  draft: boolean;

  @property({ type: "boolean", default: false })
  previous: boolean;

  @property({ type: "boolean", default: false })
  history: boolean;

  @property({ type: "date" })
  publishedDate?: string;

  @property({ type: "object" })
  info?: Info;

  constructor(data?: Partial<AppInfo>) {
    super(data);
  }
}
