import ms from "milliseconds";
import { InviteEmployeeToCompanyRequestType } from "@toolbox/request/types/companies/invitations";
import { RequestWithBody, RequestWithPath } from "@toolbox/request/types/types";
import { standardResponse } from "@utils/responses";
import { InviteEmployeeToCompanyResponseType } from "@toolbox/response/types/companies/invitations";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import { Response } from "express";
import CompanyService from "src/services/company.service";
import { Company, CompanyEmployee, CompanyEmployeeInvitation, InvitationStatus } from "@prisma/client";
import { CompleteUser } from "src/globalTypes";
import UserService from "src/services/user.service";
import CompanyEmployeeService from "src/services/companyEmployee.service";

export const inviteEmployeeToCompany = async (
  req: RequestWithPath<InviteEmployeeToCompanyRequestType["path"]> &
    RequestWithBody<InviteEmployeeToCompanyRequestType["body"]>,
  res: Response<InviteEmployeeToCompanyResponseType>
) => {
  const { companyId } = req.params;
  const { invitedUserId, role } = req.body;
  const expiresInMillis = ms.weeks(1);

  const senderId = req.user?.id;
  if (!senderId) {
    log.error("No user id found");
    res.status(500).json(standardResponse({ isSuccess: false, res, message: "No user id found" }));
    return;
  }

  let company: Company | null;
  try {
    company = await CompanyService.getCompanyById(companyId);
  } catch (error) {
    log.error(error);
    res
      .status(500)
      .json(standardResponse({ isSuccess: false, res, message: "Failed to fetch company", errors: normalizeError(error) }));
    return;
  }
  if (!company) {
    res.status(404).json(standardResponse({ isSuccess: false, res, message: "Company not found" }));
    return;
  }

  let sender: CompanyEmployee | null;
  try {
    sender = await CompanyEmployeeService.getCompanyEmployee(companyId, senderId);
  } catch (error) {
    log.error(error);
    res
      .status(500)
      .json(standardResponse({ isSuccess: false, res, message: "Failed to fetch sender", errors: normalizeError(error) }));
    return;
  }
  if (!sender) {
    res.status(404).json(standardResponse({ isSuccess: false, res, message: "Sender must be an employee of the company" }));
    return;
  } else if (sender.role !== "OWNER") {
    res
      .status(403)
      .json(
        standardResponse({ isSuccess: false, res, message: "You are not authorized to invite employees to this company" })
      );
    return;
  }

  let invitedUser: CompleteUser | null;
  try {
    invitedUser = await UserService.getUserById(invitedUserId);
  } catch (error) {
    log.error(error);
    res
      .status(500)
      .json(
        standardResponse({ isSuccess: false, res, message: "Failed to fetch invited user", errors: normalizeError(error) })
      );
    return;
  }
  if (!invitedUser) {
    res.status(404).json(standardResponse({ isSuccess: false, res, message: "Invited user not found" }));
    return;
  }

  let invitedUserCompany: CompanyEmployee | null;
  try {
    invitedUserCompany = await CompanyEmployeeService.getCompanyEmployee(companyId, invitedUserId);
  } catch (error) {
    log.error(error);
    res.status(500).json(
      standardResponse({
        isSuccess: false,
        res,
        message: "Failed to fetch invited user's company",
        errors: normalizeError(error),
      })
    );
    return;
  }
  if (invitedUserCompany) {
    res
      .status(400)
      .json(standardResponse({ isSuccess: false, res, message: "This user is already an employee of this company" }));
    return;
  }

  let existingInvitation: CompanyEmployeeInvitation | null;
  try {
    existingInvitation = await CompanyEmployeeService.getCompanyEmployeeInvitation({
      senderId: sender.id,
      invitedUserId: invitedUser.id,
      status: [InvitationStatus.PENDING],
    });
  } catch (error) {
    log.error(error);
    res.status(500).json(
      standardResponse({
        isSuccess: false,
        res,
        message: "Failed to fetch existing invitation",
        errors: normalizeError(error),
      })
    );
    return;
  }
  if (existingInvitation) {
    res.status(400).json(standardResponse({ isSuccess: false, res, message: "This user already has a pending invitation" }));
    return;
  }

  let invitation: CompanyEmployeeInvitation | null;
  try {
    invitation = await CompanyEmployeeService.createCompanyEmployeeInvitation({
      senderId: sender.id,
      invitedUserId: invitedUser.id,
      role: role,
      expiresInMillis: expiresInMillis,
    });
  } catch (error) {
    log.error(error);
    res
      .status(500)
      .json(
        standardResponse({ isSuccess: false, res, message: "Failed to create invitation", errors: normalizeError(error) })
      );
    return;
  }

  res.status(201).json(
    standardResponse({
      isSuccess: true,
      res,
      message: "Invitation sent",
      data: {
        invitation: {
          id: invitation.id,
          senderCompanyEmployeeId: invitation.senderId,
          invitedUserId: invitation.invitedUserId,
          role: invitation.role,
          status: invitation.status,
          expiresIn: expiresInMillis.toString(),
          expiresAt: invitation.expiresAt.toISOString(),
        },
      },
    })
  );
};
