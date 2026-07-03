-- Track the last provisioning failure so stuck merchants are observable
ALTER TABLE "merchants" ADD COLUMN "provision_error" TEXT;
