# OAuth Provider Test Applications

Use separate development OAuth applications and test accounts for Google,
GitHub, and Telegram. Do not reuse production client secrets or authorize
customer data.

## Redirect configuration

Set `APP_ORIGIN` to the exact local or isolated staging origin and configure
each provider's callback URL using its provider name:

```text
http://localhost:5000/api/auth/external/google/callback
http://localhost:5000/api/auth/external/github/callback
http://localhost:5000/api/auth/external/telegram/callback
```

Set only the selected provider's `*_CLIENT_ID` and `*_CLIENT_SECRET` in the
ignored local environment or secret manager. Provider consoles may require an
HTTPS staging origin; use a separate isolated staging app in that case.

## Verification

1. Run the credential-free OAuth suites:
   `npx tsx --test server/modules/identity/application/external-auth.service.test.ts server/modules/identity/infrastructure/external-auth.provider.test.ts server/modules/identity/presentation/identity.router.test.ts`.
2. For each enabled test provider, verify sign-in, provider denial, account
   linking, callback state validation, replay rejection, and the same-browser
   session requirement using a dedicated test account.
3. Confirm redirects return to the expected app origin and that credentials,
   authorization codes, state values, and access tokens do not appear in logs.
4. Revoke the test application's client secret and remove test identities when
   finished.

CI uses provider mocks and does not prove that live OAuth registrations,
provider scopes, consent screens, or callback allowlists are configured.
