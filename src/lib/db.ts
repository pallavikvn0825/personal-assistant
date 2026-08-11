import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function getDefaultUser() {
  const email = process.env.DEFAULT_USER_EMAIL ?? "me@example.com";
  const user = await prisma.user.findUnique({
    where: { email },
    include: { settings: true, productivityStreak: true },
  });
  if (!user) {
    throw new Error(
      "Default user not found. Run `npm run db:setup` to seed the database."
    );
  }
  return user;
}
