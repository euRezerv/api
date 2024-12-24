import argon2 from "argon2";
import { Prisma } from "@prisma/client";
import { DIGITS, EN_ALPHABET, getRandomString } from "@toolbox/common/strings";
import prisma from "@utils/prisma";

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

export const getTestUserData = async () => {
  return {
    firstName: "Test",
    lastName: "User",
    email: `test-${getRandomString(10)}@test.com`,
    isEmailVerified: false,
    phoneNumberCountryISO: "RO",
    phoneNumber: Math.floor(Math.random() * 1000000000).toString(),
    isPhoneVerified: false,
    password: await argon2.hash(`A${getRandomString(10)}1!`),
    isSystemAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
};

export const createTestUser = async (data: Partial<Prisma.UserCreateInput> = {}) => {
  return await prisma.user.create({
    data: {
      ...(await getTestUserData()),
      ...data,
    },
  });
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
