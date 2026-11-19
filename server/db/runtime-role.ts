export interface RuntimeRoleMetadata {
  isExpectedRole: boolean;
  isSuperuser: boolean;
  canCreateDatabase: boolean;
  canCreateRoles: boolean;
  canReplicate: boolean;
  canBypassRowLevelSecurity: boolean;
  hasRoleMembership: boolean;
  ownsDatabase: boolean;
  ownsPublicSchema: boolean;
  ownsPublicObjects: boolean;
  canCreateSchema: boolean;
  canReadMigrationJournal: boolean;
  canInsertMigrationJournal: boolean;
  canUpdateMigrationJournal: boolean;
  canDeleteMigrationJournal: boolean;
}

export function assertLeastPrivilegeRuntimeRole(
  metadata: RuntimeRoleMetadata | undefined,
): void {
  if (
    !metadata
    || !metadata.isExpectedRole
    || metadata.isSuperuser
    || metadata.canCreateDatabase
    || metadata.canCreateRoles
    || metadata.canReplicate
    || metadata.canBypassRowLevelSecurity
    || metadata.hasRoleMembership
    || metadata.ownsDatabase
    || metadata.ownsPublicSchema
    || metadata.ownsPublicObjects
    || metadata.canCreateSchema
    || metadata.canReadMigrationJournal
    || metadata.canInsertMigrationJournal
    || metadata.canUpdateMigrationJournal
    || metadata.canDeleteMigrationJournal
  ) {
    throw new Error("Production database role violates runtime least-privilege policy");
  }
}
