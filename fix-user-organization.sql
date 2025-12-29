-- Fix user organization setup
-- This script will:
-- 1. Check if user has organization_id
-- 2. Create organization if needed
-- 3. Update user with organization_id

DO $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_org_id UUID;
    v_existing_org_id UUID;
BEGIN
    -- Get the first (and likely only) user from auth.users
    SELECT id, email INTO v_user_id, v_user_email
    FROM auth.users
    LIMIT 1;

    RAISE NOTICE 'Found user: % (%)', v_user_email, v_user_id;

    -- Check if user already has an organization_id in schedulable_users
    SELECT organization_id INTO v_existing_org_id
    FROM schedulable_users
    WHERE id = v_user_id;

    IF v_existing_org_id IS NOT NULL THEN
        RAISE NOTICE 'User already has organization_id: %', v_existing_org_id;
    ELSE
        RAISE NOTICE 'User has no organization_id, creating one...';

        -- Check if there's already an organization (maybe from previous attempts)
        SELECT id INTO v_org_id
        FROM organizations
        LIMIT 1;

        IF v_org_id IS NULL THEN
            -- Create new organization
            INSERT INTO organizations (company_name, created_at)
            VALUES ('Mitt Företag', NOW())
            RETURNING id INTO v_org_id;

            RAISE NOTICE 'Created new organization: %', v_org_id;
        ELSE
            RAISE NOTICE 'Using existing organization: %', v_org_id;
        END IF;

        -- Update or insert user in schedulable_users with organization_id
        INSERT INTO schedulable_users (id, email, name, organization_id, role, created_at)
        VALUES (v_user_id, v_user_email, 'Admin', v_org_id, 'admin', NOW())
        ON CONFLICT (id)
        DO UPDATE SET
            organization_id = v_org_id,
            updated_at = NOW();

        RAISE NOTICE 'Updated user with organization_id: %', v_org_id;
    END IF;

    -- Update all customers to have this organization_id if they don't have one
    UPDATE customers
    SET organization_id = COALESCE(
        (SELECT organization_id FROM schedulable_users WHERE id = v_user_id),
        v_org_id
    )
    WHERE organization_id IS NULL;

    RAISE NOTICE 'Updated customers with organization_id';

END $$;

-- Verify the setup
SELECT
    'User Details' as info,
    su.id,
    su.email,
    su.name,
    su.organization_id,
    su.role
FROM schedulable_users su
LIMIT 1;

SELECT
    'Organization Details' as info,
    o.id,
    o.company_name
FROM organizations o
LIMIT 1;

SELECT
    'Customer Count' as info,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as customers_with_org
FROM customers;
