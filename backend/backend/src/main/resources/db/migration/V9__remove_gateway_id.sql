ALTER TABLE gms.greenhouse
    DROP CONSTRAINT IF EXISTS uq_greenhouse_gateway,
    DROP COLUMN IF EXISTS gateway_id;

-- gateway_status
ALTER TABLE gms.gateway_status
    DROP CONSTRAINT IF EXISTS gateway_status_pkey;

ALTER TABLE gms.gateway_status
    DROP COLUMN IF EXISTS gateway_id;

ALTER TABLE gms.gateway_status
    ADD CONSTRAINT gateway_status_pkey
    PRIMARY KEY (tenant_id, greenhouse_id);

-- command_ack
ALTER TABLE gms.command_ack
    DROP CONSTRAINT IF EXISTS command_ack_pkey;
ALTER TABLE gms.command_ack
    DROP COLUMN IF EXISTS gateway_id;
ALTER TABLE gms.command_ack
    ADD CONSTRAINT command_ack_pkey
    PRIMARY KEY (command_id);

-- alert_event
ALTER TABLE gms.alert_event
    DROP CONSTRAINT IF EXISTS alert_event_pkey CASCADE;
ALTER TABLE gms.alert_event
    DROP COLUMN IF EXISTS gateway_id;
ALTER TABLE gms.alert_event
    ADD CONSTRAINT alert_event_pkey
    PRIMARY KEY (id);

-- threshold_apply_status
ALTER TABLE gms.threshold_apply_status
    DROP CONSTRAINT IF EXISTS threshold_apply_status_pkey CASCADE;
ALTER TABLE gms.threshold_apply_status
    DROP COLUMN IF EXISTS gateway_id;
ALTER TABLE gms.threshold_apply_status
    ADD CONSTRAINT threshold_apply_status_pkey
    PRIMARY KEY (tenant_id, greenhouse_id, zone_id, config_version);
