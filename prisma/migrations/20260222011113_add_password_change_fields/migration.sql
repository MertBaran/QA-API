-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordChangeCode" TEXT,
ADD COLUMN     "passwordChangeCodeExpire" TIMESTAMP(3),
ADD COLUMN     "passwordChangeVerificationToken" TEXT,
ADD COLUMN     "passwordChangeVerificationTokenExpire" TIMESTAMP(3);
