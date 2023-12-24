import { AuthorizationContext, AuthorizationDecision, AuthorizationMetadata, Authorizer } from "@loopback/authorization";
import { Provider } from "@loopback/core";

export class AuthorizationProvider implements Provider<Authorizer> {
    constructor() {}
  
    /**
     * @returns authenticateFn
     */
    value(): Authorizer {
      return this.authorize.bind(this);
    }
  
    async authorize(
      authorizationCtx: AuthorizationContext,
      metadata: AuthorizationMetadata,
    ) {
        console.log('in authorization provider')
        console.log(authorizationCtx);
        console.log(metadata);
      const clientRole = authorizationCtx.principals[0].role;
      const allowedRoles = metadata.allowedRoles;
      return allowedRoles && allowedRoles.includes(clientRole)
        ? AuthorizationDecision.ALLOW
        : AuthorizationDecision.DENY;
    }
  }