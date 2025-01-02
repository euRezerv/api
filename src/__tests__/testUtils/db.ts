import argon2 from "argon2";
import { CompanyEmployeeRole, Prisma } from "@prisma/client";
import { DIGITS, EN_ALPHABET, EN_ALPHABET_LOWERCASE, getRandomString } from "@toolbox/common/strings";
import prisma from "@utils/prisma";
import TestAgent from "supertest/lib/agent";
import { omitKeys } from "@toolbox/common/objects";
import { parsePhoneNumberWithError } from "libphonenumber-js";

export const clearTestDb = async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("clearTestDb should only be used in the test environment");
  }

  // Use raw SQL to disable constraints, truncate all tables, and re-enable constraints
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      row RECORD;
    BEGIN
      -- Disable all triggers (including foreign key constraints)
      EXECUTE 'SET session_replication_role = replica';

      -- Iterate through all user-defined tables and truncate them
      FOR row IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
      LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(row.tablename) || ' CASCADE';
      END LOOP;

      -- Re-enable triggers
      EXECUTE 'SET session_replication_role = DEFAULT';
    END $$;
  `);
};

export const authTestUser = async (identifier: string, plainPassword: string, agent: InstanceType<typeof TestAgent>) => {
  await agent.post("/v1/users/auth/login").send({ identifier, password: plainPassword });
};

export const getTestLocalProfile = async () => {
  const plainPassword = `A${getRandomString(10)}1!`;
  const hashedPassword = await argon2.hash(plainPassword);

  const phoneNumberCountryISO = "RO";
  const phoneNumber = "7" + Math.random().toString().slice(2, 10);
  const phoneNumberFormatted = parsePhoneNumberWithError(phoneNumber, phoneNumberCountryISO);

  return {
    data: {
      givenName: "Test",
      familyName: "User",
      email: `test-${getRandomString(10, `${EN_ALPHABET_LOWERCASE}${DIGITS}`)}@test.com`,
      isEmailVerified: false,
      phoneNumberCountryISO: "RO",
      phoneNumber: "7" + Math.random().toString().slice(2, 10),
      phoneNumberFormatted: phoneNumberFormatted.number,
      isPhoneVerified: false,
      password: hashedPassword,
      isSystemAdmin: false,
    },
    plainPassword,
    hashedPassword,
  };
};

export const getTestGoogleProfileData = () => {
  return {
    googleId: getRandomString(21),
    accessToken: getRandomString(50),
    refreshToken: getRandomString(50),
    responseJson: {
      given_name: "GoogleTest",
      family_name: "GoogleUser",
      email: `google-${getRandomString(10, `${EN_ALPHABET_LOWERCASE}${DIGITS}`)}@test.com`,
      email_verified: true,
    },
  };
};

type CreateTestUserType = {
  userData?: Partial<Prisma.UserCreateInput>;
  localProfileData?: Partial<Omit<Prisma.LocalProfileCreateInput, "user">>;
  googleProfileData?: Omit<Prisma.GoogleProfileCreateInput, "user">;
};

export const createTestUser = async ({ userData, localProfileData, googleProfileData }: CreateTestUserType = {}) => {
  const testUserData = {
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
  const localProfile = (await getTestLocalProfile()).data;

  return await prisma.user.create({
    data: {
      ...testUserData,
      ...userData,
      localProfile: {
        create: {
          ...localProfile,
          ...localProfileData,
        },
      },
      ...(googleProfileData && {
        googleProfile: {
          create: {
            ...googleProfileData,
          },
        },
      }),
    },
    include: { localProfile: true, googleProfile: true },
  });
};

type CreateAndAuthTestUserType = {
  userData?: Partial<Prisma.UserCreateInput>;
  localProfileData?: Omit<Partial<Prisma.LocalProfileCreateInput>, "password"> & { plainPassword?: string };
};

export const createAndAuthTestUser = async (
  agent: InstanceType<typeof TestAgent>,
  { userData = {}, localProfileData = {} }: CreateAndAuthTestUserType = {}
) => {
  const localProfile = await getTestLocalProfile();
  const plainPassword = localProfileData.plainPassword || localProfile.plainPassword;
  const hashedPassword = await argon2.hash(plainPassword);

  const user = await createTestUser({
    userData: userData,
    localProfileData: {
      ...localProfile.data,
      ...omitKeys(localProfileData, ["plainPassword"]),
      password: hashedPassword,
    },
  });

  await authTestUser(user.localProfile!.email, plainPassword, agent);

  return user;
};

export const getTestCompanyData = () => {
  return {
    name: getRandomString([10, 15]),
    country: getRandomString([5, 15], EN_ALPHABET),
    county: getRandomString([5, 15], EN_ALPHABET),
    city: getRandomString([5, 15], EN_ALPHABET),
    street: getRandomString([5, 15]),
    postalCode: getRandomString([4, 10], DIGITS),
    latitude: Number((Math.random() * 90).toFixed(10)),
    longitude: Number((Math.random() * 180).toFixed(10)),
    createdAt: new Date(),
    deletedAt: null,
  };
};

export const createTestCompany = async (createdById: string, data: Partial<Prisma.CompanyCreateInput> = {}) => {
  return await prisma.company.create({
    data: {
      createdBy: { connect: { id: createdById } },
      ...getTestCompanyData(),
      ...data,
    },
  });
};

export const addTestUserToCompany = async (companyId: string, employeeId: string, role: CompanyEmployeeRole) => {
  return await prisma.companyEmployee.create({
    data: {
      company: { connect: { id: companyId } },
      employee: { connect: { id: employeeId } },
      role,
    },
  });
};
