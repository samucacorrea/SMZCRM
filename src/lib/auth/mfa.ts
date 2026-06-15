const MFA_SETUP_PATH = "/mfa/setup";

export function isMfaSetupPath(pathname: string) {
  return pathname === MFA_SETUP_PATH;
}

export function requiresMandatoryMfa(params: {
  pathname: string;
  roleName?: string | null;
  isSuperAdmin?: boolean;
  twoFactorEnabled?: boolean;
}) {
  const isPrivilegedRole =
    params.isSuperAdmin ||
    params.roleName === "Admin" ||
    params.roleName === "Super Admin";

  if (!isPrivilegedRole) {
    return false;
  }

  if (params.twoFactorEnabled) {
    return false;
  }

  return !isMfaSetupPath(params.pathname);
}

export { MFA_SETUP_PATH };
