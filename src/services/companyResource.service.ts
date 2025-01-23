import { DayOfWeek, Prisma } from "@prisma/client";
import { normalizeError } from "@toolbox/common/errors";
import log from "@utils/logger";
import prisma from "@utils/prisma";

type CreateResourceProps = {
  companyId: string;
  data: Omit<Prisma.ResourceCreateInput, "company" | "availabilityTime"> & {
    availabilityTime: {
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
    }[];
  };
};

export default class CompanyResourceService {
  static async createResource({ companyId, data }: CreateResourceProps) {
    try {
      return await prisma.resource.create({
        data: {
          ...data,
          company: { connect: { id: companyId } },
          availabilityTime: {
            create: data.availabilityTime,
          },
        },
        include: {
          availabilityTime: true,
        },
      });
    } catch (error) {
      log.error(error);
      throw normalizeError(error);
    }
  }
}
