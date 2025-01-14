import { Company, CompanyEmployee, CompanyEmployeeRole, CompanyEmployeeInvitation, InvitationStatus } from "@prisma/client";
import { CancelEmployeeToCompanyInvitationRequestType } from "@toolbox/request/types/companies/invitations";
import { RequestWithPath } from "@toolbox/request/types/types";
import { CancelEmployeeToCompanyInvitationResponseType } from "@toolbox/response/types/companies/invitations";
import { standardResponse } from "@utils/responses";
import { Response } from "express";
import CompanyService from "src/services/company.service";
import CompanyEmployeeService from "src/services/companyEmployee.service";

export const cancelEmployeeToCompanyInvitation = async (
  req: RequestWithPath<CancelEmployeeToCompanyInvitationRequestType["path"]>,
  res: Response<CancelEmployeeToCompanyInvitationResponseType>
) => {
  const { companyId, invitationId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(500).json(standardResponse({ isSuccess: false, res, message: "No user id found" }));
    return;
  }

  let company: Company | null;
  try {
    company = await CompanyService.getCompanyById(companyId);
  } catch {
    res.status(500).json(standardResponse({ isSuccess: false, res, message: "Failed to fetch company" }));
    return;
  }
  if (!company) {
    res.status(404).json(standardResponse({ isSuccess: false, res, message: "Company not found" }));
    return;
  }

  let currentCompanyEmployee: CompanyEmployee | null;
  try {
    currentCompanyEmployee = await CompanyEmployeeService.getCompanyEmployee(companyId, userId);
  } catch {
    res.status(500).json(standardResponse({ isSuccess: false, res, message: "Failed to fetch company employee" }));
    return;
  }
  if (!currentCompanyEmployee || currentCompanyEmployee.role !== CompanyEmployeeRole.OWNER) {
    res.status(403).json(standardResponse({ isSuccess: false, res, message: "You must be an owner of the company" }));
    return;
  }

  let invitation: CompanyEmployeeInvitation | null;
  try {
    invitation = await CompanyEmployeeService.getCompanyEmployeeInvitationById(invitationId);
  } catch {
    res.status(500).json(standardResponse({ isSuccess: false, res, message: "Failed to fetch invitation" }));
    return;
  }
  if (!invitation) {
    res.status(404).json(standardResponse({ isSuccess: false, res, message: "Invitation not found" }));
    return;
  }

  if (
    invitation.status === InvitationStatus.DECLINED ||
    invitation.status === InvitationStatus.CANCELLED ||
    invitation.status === InvitationStatus.EXPIRED ||
    invitation.expiresAt < new Date()
  ) {
    let message: string;
    switch (invitation.status) {
      case InvitationStatus.DECLINED:
        message = "This invitation has already been rejected";
        break;
      case InvitationStatus.CANCELLED:
        message = "This invitation has already been cancelled";
        break;
      case InvitationStatus.EXPIRED:
        message = "This invitation has expired";
        break;
      default:
        message = "This invitation has expired";
        break;
    }

    res.status(200).json(
      standardResponse({
        isSuccess: true,
        res,
        message: message,
        data: {
          existingInvitation: {
            id: invitation.id,
            senderCompanyEmployeeId: invitation.senderId,
            invitedUserId: invitation.invitedUserId,
            role: invitation.role,
            status: invitation.status,
            expiresAt: invitation.expiresAt.toISOString(),
          },
        },
      })
    );
    return;
  }

  if (invitation.status === InvitationStatus.ACCEPTED) {
    res.status(400).json(standardResponse({ isSuccess: false, res, message: "This invitation has already been accepted" }));
    return;
  }

  let updatedInvitation: CompanyEmployeeInvitation | null;
  try {
    updatedInvitation = await CompanyEmployeeService.updateCompanyEmployeeInvitation({
      invitationId: invitation.id,
      data: { status: InvitationStatus.CANCELLED },
    });
  } catch {
    res.status(500).json(standardResponse({ isSuccess: false, res, message: "Failed to cancel invitation" }));
    return;
  }

  res.status(200).json(
    standardResponse({
      isSuccess: true,
      res,
      message: "Invitation cancelled successfully",
      data: {
        invitation: {
          id: updatedInvitation.id,
          senderCompanyEmployeeId: updatedInvitation.senderId,
          invitedUserId: updatedInvitation.invitedUserId,
          role: updatedInvitation.role,
          status: updatedInvitation.status,
          expiresAt: updatedInvitation.expiresAt.toISOString(),
        },
      },
    })
  );
};
