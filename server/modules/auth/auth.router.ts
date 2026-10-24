// Compatibility entrypoint. The implementation lives in the DDD Identity module.
import {
  externalAuthService,
  identityAppOrigin,
  identityService,
} from "../identity/composition";
import { createIdentityRouter } from "../identity/presentation/identity.router";

export { createIdentityRouter };
export default createIdentityRouter({
  externalAuthService,
  identityAppOrigin,
  identityService,
});
