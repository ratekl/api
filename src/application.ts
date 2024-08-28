import { BootMixin } from "@loopback/boot";
import {
  ApplicationConfig,
  BindingKey,
  createBindingFromClass,
} from "@loopback/core";
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from "@loopback/rest-explorer";
import { RepositoryMixin } from "@loopback/repository";
import { RestApplication } from "@loopback/rest";
import { ServiceMixin } from "@loopback/service-proxy";
import {
  JWTAuthenticationComponent,
  JWTService,
  SecuritySpecEnhancer,
  TokenServiceBindings,
  UserServiceBindings,
} from '@loopback/authentication-jwt';
import path from "path";
import { MySequence } from "./sequence";
import { AuthenticationComponent } from "@loopback/authentication";
import { AuthorizationComponent, AuthorizationDecision, AuthorizationOptions, AuthorizationTags } from '@loopback/authorization';
import crypto from 'crypto';
import { AuthorizationProvider } from './_authorization';
import SuperTokens from "supertokens-node";
import {
  SupertokensComponent,
  SupertokensWebhookHelper,
} from "loopback-supertokens";
import Session from "supertokens-node/recipe/session";
import ThirdPartyEmailPassword from "supertokens-node/recipe/thirdpartyemailpassword";
import { ActivityServiceBindings, RateklActivityService } from "./ratekl/services/activity.service";
// import { RateklUserService } from "./ratekl/services/user.service";

export { ApplicationConfig };

/**
 * Information from package.json
 */
export interface PackageInfo {
  name: string;
  version: string;
  description: string;
}
export const PackageKey = BindingKey.create<PackageInfo>("application.package");

const pkg: PackageInfo = require("../package.json");

export class RateklApiApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication))
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // initSuperTokens();

    // Bind authentication component related elements
    this.component(AuthenticationComponent);
    this.component(AuthorizationComponent);
    this.component(JWTAuthenticationComponent);
    const authBinding = this.component(AuthorizationComponent);

    const authOptions: AuthorizationOptions = {
      precedence: AuthorizationDecision.DENY,
      defaultDecision: AuthorizationDecision.DENY,
    };

    this.configure(authBinding.key).to(authOptions);

    this
      .bind('authorizationProviders.authorizer-provider')
      .toProvider(AuthorizationProvider)
      .tag(AuthorizationTags.AUTHORIZER);

    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);

    // this.component(SupertokensComponent);

    this.add(createBindingFromClass(SecuritySpecEnhancer));

    // Use JWT secret from JWT_SECRET environment variable if set
    // otherwise create a random string of 64 hex digits
    const secret =
      process.env.JWT_SECRET ?? crypto.randomBytes(32).toString('hex');
    this.bind(TokenServiceBindings.TOKEN_SECRET).to(secret);

    // Set up the custom sequence
    this.sequence(MySequence);

    // this.bind(UserServiceBindings.USER_SERVICE).toClass(RateklUserService);

    this.bind(ActivityServiceBindings.ACTIVITY_SERVICE).toClass(RateklActivityService);

    // Set up default home page
    this.static("/", path.join(__dirname, "../public"));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: "/explorer",
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ["controllers"],
        extensions: [".controller.js"],
        nested: true,
      },
    };
  }
}

function initSuperTokens() {
  console.log(
    "env",
    process.env.SUPERTOKEN_URI,
    process.env.SUPERTOKEN_KEY,
    process.env.SUPERTOKEN_WEBHOOK_SIGNATURE_SECRET,
    process.env.SUPERTOKEN_WEBHOOK_ENDPOINT_URL
  );

  const SUPERTOKEN_URI = "" + process.env.SUPERTOKEN_URI;
  const SUPERTOKEN_KEY = "" + process.env.SUPERTOKEN_KEY;
  const SUPERTOKEN_WEBHOOK_SIGNATURE_SECRET = "" + process.env.SUPERTOKEN_WEBHOOK_SIGNATURE_SECRET;
  const SUPERTOKEN_WEBHOOK_ENDPOINT_URL = "" + process.env.SUPERTOKEN_WEBHOOK_ENDPOINT_URL;

  const webhookHelper = new SupertokensWebhookHelper(SUPERTOKEN_WEBHOOK_SIGNATURE_SECRET);

  SuperTokens.init({
    framework: "loopback",
    appInfo: {
      apiDomain: "localhost:3333",
      appName: "ratekl_core",
      websiteDomain: "localhost:3333",
    },
    supertokens: {
      connectionURI: SUPERTOKEN_URI,
      apiKey: SUPERTOKEN_KEY,
    },
    recipeList: [
      ThirdPartyEmailPassword.init({
        providers: [
          {
            config: {
              thirdPartyId: "google",
              clients: [
                {
                  clientId:
                    "1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com",
                  clientSecret: "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",
                },
              ],
            },
          },
        ],
        override: {
          apis: (apiImplementation: any) => {
            return {
              ...apiImplementation,
              signUpPOST: async (input: any) => {
                if (!apiImplementation.signUpPOST) {
                  throw new Error("Should never happen");
                }

                // First we call the original implementation of signUpPOST.
                const response = await apiImplementation.signUpPOST(input);

                if (response.status === "OK") {
                  // Create an event to dispatch based on the response:
                  const userSignUpEvent = webhookHelper
                    .getEventFactory()
                    .createUserSignUpEvent(response);

                  // Dispatch the event:
                  webhookHelper
                    .dispatchWebhookEvent(SUPERTOKEN_WEBHOOK_ENDPOINT_URL, userSignUpEvent)
                    .catch((err: Error) => {
                      console.error(err);
                    });
                }

                return response;
              },
            };
          },
        },
      }),
      Session.init(),
    ],
  });
}
