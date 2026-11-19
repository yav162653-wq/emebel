# Resend Test-Account Verification

Keep email verification in a dedicated Resend test account or isolated project.
Use a verified test sender domain and recipient mailboxes controlled by the
team; never use the production API key or send test mail to customers.

## Procedure

1. Configure `RESEND_API_KEY` and `AUTH_EMAIL_FROM` through an ignored local
   environment file or secret manager. Verify the sender domain and restrict
   recipients to controlled test mailboxes.
2. Run the mocked sender suite:
   `npx tsx --test server/modules/identity/infrastructure/resend-email.sender.test.ts`.
   It verifies request formatting, bounded retries, non-retryable errors, and
   timeout behavior without contacting Resend.
3. Against the test account, request one magic-link email for a controlled
   address. Confirm delivery, sender, link destination, and expiry.
4. Consume the link once, verify a replay is rejected, and confirm the app
   response does not disclose whether an arbitrary address has an account.
5. Test provider rejection with a disposable invalid key only if the test
   account supports it; confirm the failure is surfaced without logging the key,
   recipient, or message body.
6. Revoke the test key and remove test messages/users when finished.

Live delivery tests require provider credentials and an owned mailbox; they are
not part of the credential-free CI suite.
