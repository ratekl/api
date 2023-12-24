import {
  MiddlewareSequence,
} from "@loopback/rest";

export class MySequence extends MiddlewareSequence {
  // async handle(context: RequestContext) {
  //   debug(
  //     'Invoking middleware chain %s with groups %s',
  //     this.options.chain,
  //     this.options.orderedGroups,
  //   );

  //   debug('The URL: %s, Headers: %s', context.requestedBaseUrl, context.request.headers);

  //   debug('Original request ips: %s', context.request.ips);

  //   debug('Original request originalUrl: %s', context.request.originalUrl);

  //   // debug('Original request originalUrl: %s', context.);


  //     await this.invokeMiddleware(context, this.options);
  // }
}
