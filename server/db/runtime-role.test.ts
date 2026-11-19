import assert from "node:assert/strict";
import test from "node:test";
import {
  assertLeastPrivilegeRuntimeRole,
  type RuntimeRoleMetadata,
} from "./runtime-role";

const leastPrivilegeRole: RuntimeRoleMetadata = {
  isExpectedRole: true,
  isSuperuser: false,
  canCreateDatabase: false,
  canCreateRoles: false,
  canReplicate: false,
  canBypassRowLevelSecurity: false,
  hasRoleMembership: false,
  ownsDatabase: false,
  ownsPublicSchema: false,
  ownsPublicObjects: false,
  canCreateSchema: false,
  canReadMigrationJournal: false,
  canInsertMigrationJournal: false,
  canUpdateMigrationJournal: false,
  canDeleteMigrationJournal: false,
};

test("runtime role accepts only the least-privilege metadata profile", () => {
  assert.doesNotThrow(() => assertLeastPrivilegeRuntimeRole(leastPrivilegeRole));
  assert.throws(() => assertLeastPrivilegeRuntimeRole(undefined));
  assert.throws(() => assertLeastPrivilegeRuntimeRole({
    ...leastPrivilegeRole,
    isSuperuser: true,
  }));
  assert.throws(() => assertLeastPrivilegeRuntimeRole({
    ...leastPrivilegeRole,
    canCreateDatabase: true,
  }));
  assert.throws(() => assertLeastPrivilegeRuntimeRole({
    ...leastPrivilegeRole,
    ownsPublicObjects: true,
  }));
  assert.throws(() => assertLeastPrivilegeRuntimeRole({
    ...leastPrivilegeRole,
    hasRoleMembership: true,
  }));
  assert.throws(() => assertLeastPrivilegeRuntimeRole({
    ...leastPrivilegeRole,
    canCreateSchema: true,
  }));
  assert.throws(() => assertLeastPrivilegeRuntimeRole({
    ...leastPrivilegeRole,
    canReadMigrationJournal: true,
  }));
});
