DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads'
      AND column_name = 'parcel_weight'
  ) THEN
    EXECUTE 'ALTER TABLE leads RENAME COLUMN parcel_weight TO parcel_count';
  END IF;
END
$$;