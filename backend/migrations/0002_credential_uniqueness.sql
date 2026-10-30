CREATE UNIQUE INDEX account_provider_id_unique ON account(providerId, accountId);
CREATE UNIQUE INDEX account_credential_user_unique ON account(userId, providerId) WHERE providerId = 'credential';
