import { DomainError, systemClock, type Clock } from "../../../../packages/kernel/src";
import type { ExternalIdentityProfile, PublicUser } from "../../../../packages/contracts/src";
import type { OneTimeTokenService } from "../../../../packages/platform/src";
import type {
  ExternalAuthProvider,
  ExternalAuthProviderName,
  ExternalAuthTransactionStore,
  OAuthProofFactory,
} from "../domain/external-auth";

interface IdentityUseCases {
  signInExternal(profile: ExternalIdentityProfile): Promise<PublicUser>;
  linkExternal(userId: number, profile: ExternalIdentityProfile): Promise<PublicUser>;
}

export interface ExternalAuthServiceDependencies {
  providers: ExternalAuthProvider[];
  transactions: ExternalAuthTransactionStore;
  tokenService: OneTimeTokenService;
  proofFactory: OAuthProofFactory;
  identity: IdentityUseCases;
  transactionTtlMs: number;
  clock?: Clock;
}

export class ExternalAuthService {
  private readonly clock: Clock;
  private readonly providers: Map<ExternalAuthProviderName, ExternalAuthProvider>;

  constructor(private readonly dependencies: ExternalAuthServiceDependencies) {
    this.clock = dependencies.clock ?? systemClock;
    this.providers = new Map(
      dependencies.providers.map((provider) => [provider.provider, provider]),
    );
  }

  availableProviders(): ExternalAuthProviderName[] {
    return Array.from(this.providers.values())
      .filter((provider) => provider.isConfigured())
      .map((provider) => provider.provider);
  }

  async begin(providerName: string, userId?: number): Promise<string> {
    const provider = this.getConfiguredProvider(providerName);
    const state = this.dependencies.tokenService.issue();
    const proof = this.dependencies.proofFactory.derive(state.raw);

    await this.dependencies.transactions.create({
      provider: provider.provider,
      stateHash: state.hash,
      userId: userId ?? null,
      expiresAt: new Date(this.clock.now().getTime() + this.dependencies.transactionTtlMs),
    });

    return provider.authorizationUrl({
      state: state.raw,
      nonce: proof.nonce,
      codeChallenge: this.dependencies.proofFactory.challenge(proof.codeVerifier),
    });
  }

  async complete(
    providerName: string,
    input: { code: string; state: string; currentUserId?: number },
  ): Promise<{ user: PublicUser; linked: boolean }> {
    const provider = this.getConfiguredProvider(providerName);
    if (!input.code || !input.state) {
      throw new DomainError("INVALID_EXTERNAL_AUTH_STATE", "Invalid external sign-in response");
    }

    const stateHash = this.dependencies.tokenService.hash(input.state);
    const transaction = await this.dependencies.transactions.consume({
      provider: provider.provider,
      stateHash,
      now: this.clock.now(),
    });
    if (!transaction) {
      throw new DomainError("INVALID_EXTERNAL_AUTH_STATE", "Sign-in request expired or was already used");
    }

    if (transaction.userId !== null && transaction.userId !== input.currentUserId) {
      throw new DomainError("EXTERNAL_AUTH_SESSION_CHANGED", "Sign in again before linking an identity");
    }

    const proof = this.dependencies.proofFactory.derive(input.state);
    const profile = await provider.authenticate({
      code: input.code,
      codeVerifier: proof.codeVerifier,
      nonce: proof.nonce,
    });

    if (transaction.userId !== null) {
      return {
        user: await this.dependencies.identity.linkExternal(transaction.userId, profile),
        linked: true,
      };
    }

    return {
      user: await this.dependencies.identity.signInExternal(profile),
      linked: false,
    };
  }

  async cancel(providerName: string, state: string): Promise<boolean> {
    const provider = this.getProvider(providerName);
    if (!state) {
      throw new DomainError("INVALID_EXTERNAL_AUTH_STATE", "Invalid external sign-in response");
    }
    const transaction = await this.dependencies.transactions.consume({
      provider: provider.provider,
      stateHash: this.dependencies.tokenService.hash(state),
      now: this.clock.now(),
    });
    if (!transaction) {
      throw new DomainError("INVALID_EXTERNAL_AUTH_STATE", "Sign-in request expired or was already used");
    }
    return transaction.userId !== null;
  }

  private getProvider(providerName: string): ExternalAuthProvider {
    const provider = this.providers.get(providerName as ExternalAuthProviderName);
    if (!provider) {
      throw new DomainError("UNSUPPORTED_IDENTITY_PROVIDER", "Unsupported sign-in provider");
    }
    return provider;
  }

  private getConfiguredProvider(providerName: string): ExternalAuthProvider {
    const provider = this.getProvider(providerName);
    if (!provider.isConfigured()) {
      throw new DomainError("EXTERNAL_AUTH_NOT_CONFIGURED", "This sign-in provider is not configured");
    }
    return provider;
  }
}
