import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import prisma from "@utils/prisma";

type AddEmployeeToResourceProps = {
  resourceId: string;
  employeeId: string;
};

export default class ResoruceEmployeeService {
  static async addEmployeeToResource({ resourceId, employeeId }: AddEmployeeToResourceProps) {
    try {
      const resourceEmployee = await prisma.resourceEmployee.create({
        data: {
          resource: { connect: { id: resourceId } },
          employee: { connect: { id: employeeId } },
        },
      });

      return resourceEmployee;
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }
}
