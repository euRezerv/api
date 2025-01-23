import { CompanyEmployeeRole } from "@prisma/client";

export const employeeAccess = (employeeRole: CompanyEmployeeRole) => {
  const isRegular = employeeRole === CompanyEmployeeRole.REGULAR;
  const isManager = employeeRole === CompanyEmployeeRole.MANAGER;
  const isOwner = employeeRole === CompanyEmployeeRole.OWNER;

  return {
    canInviteEmployeeToCompany: isOwner,
    canCancelEmployeeToCompanyInvitation: isOwner,
    canCreateResource: isManager || isOwner,
  };
};
