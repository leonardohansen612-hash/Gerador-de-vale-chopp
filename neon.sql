-- Execute no SQL Editor do projeto Neon do Vale-Chope.
CREATE TABLE IF NOT EXISTS vale_chope_vouchers (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 code TEXT NOT NULL UNIQUE,
 customer_name VARCHAR(100),
 first_amount NUMERIC(12,2) NOT NULL CHECK (first_amount >= 0),
 issued_by VARCHAR(30) NOT NULL,
 issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
 redeemed_at TIMESTAMPTZ,
 return_amount NUMERIC(12,2) CHECK (return_amount >= 0),
 redeemed_late BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS vale_chope_issued_idx ON vale_chope_vouchers(issued_at);
CREATE INDEX IF NOT EXISTS vale_chope_redeemed_idx ON vale_chope_vouchers(redeemed_at);
