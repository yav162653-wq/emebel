import type {
  ExternalIdentityProfile,
  IdentityProvider,
} from "../../../../packages/contracts/src";

export type ExternalAuthProviderName = Extract<
  IdentityProvider,
  "google" | "github" | "telegram"
>;

export interface ExternalAuthTransaction {
  provider: ExternalAuthProviderName;
  stateHash: string;
  userId: number | null;
  expiresAt: Date;
}

export interface ConsumedExternalAuthTransaction {
  userId: number | null;
}

export interface ExternalAuthTransactionStore {
  create(transaction: ExternalAuthTransaction): Promise<void>;
  consume(input: {
    provider: ExternalAuthProviderName;
    stateHash: string;
    now: Date;
  }): Promise<ConsumedExternalAuthTransaction | null>;
}

export interface OAuthProof {
  codeVerifier: string;
  nonce: string;
}

export interface OAuthProofFactory {
  derive(state: string): OAuthProof;
  challenge(codeVerifier: string): string;
}

export interface ExternalAuthProvider {
  readonly provider: ExternalAuthProviderName;
  readonly redirectUri: string | undefined;
  isConfigured(): boolean;
  authorizationUrl(input: {
    state: string;
    nonce: string;
    codeChallenge: string;
  }): Promise<string>;
  authenticate(input: {
    code: string;
    codeVerifier: string;
    nonce: string;
  }): Promise<ExternalIdentityProfile>;
}
