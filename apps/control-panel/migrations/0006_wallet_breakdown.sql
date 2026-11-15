-- The charge behind a credit.
--
-- `amountUsd` is what lands in the wallet. A charge is more than that: a
-- platform fee we set, tax we do not yet calculate, and a total. Storing each
-- line rather than deriving it at render time means a receipt issued today
-- still reconciles after the fee percentage changes.
ALTER TABLE "walletCredit" ADD COLUMN "platformFeeUsd" text NOT NULL DEFAULT '0.000000';
ALTER TABLE "walletCredit" ADD COLUMN "taxUsd" text NOT NULL DEFAULT '0.000000';
ALTER TABLE "walletCredit" ADD COLUMN "totalUsd" text NOT NULL DEFAULT '0.000000';
-- Null until a payment provider exists. Not 'none' — a string that reads like
-- a method is worse than an absent one.
ALTER TABLE "walletCredit" ADD COLUMN "paymentMethod" text;

-- Rows written before the breakdown existed: the credit was the whole charge,
-- because no fee was taken. Backfilling the total to the amount keeps them
-- arithmetically true rather than showing a $0.00 total against $100 credited.
UPDATE "walletCredit" SET "totalUsd" = "amountUsd" WHERE "totalUsd" = '0.000000';
