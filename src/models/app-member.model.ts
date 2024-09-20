import { model, property } from "@loopback/repository";
import { BaseModel } from "./_base-model";

interface MemberData {
  [key: string]: string | number | boolean | null | MemberData | MemberData[];
}

@model()
export class AppMember extends BaseModel {
  @property({ type: "string", id: true })
  userName: string;

  @property({ type: "string"})
  password: string;

  @property({ type: "string", index: true  })
  firstName: string;

  @property({ type: "string", index: true  })
  lastName: string;

  @property({ type: "string", index: true  })
  preferredName: string;

  @property({ type: "string", index: true })
  role: string;

  @property({ type: "string", index: true })
  email: string;

  @property({ type: "string", index: true })
  phone: string;

  @property({ type: "object" })
  memberData?: MemberData;

  constructor(memberData?: Partial<AppMember>) {
    super(memberData);
  }
}
