-- App settings stored as a single JSON row
CREATE TABLE IF NOT EXISTS app_settings (
    id          INTEGER PRIMARY KEY DEFAULT 1,
    data        JSONB NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default row if not exists
-- Quốc Trí: seed DISCWAKE as the default public brand name.
INSERT INTO app_settings (id, data)
VALUES (1, '{
  "siteName": "DISCWAKE",
  "siteDescription": "Hệ thống đánh giá DISC",
  "primaryColor": "",
  "secondaryColor": "",
  "logoUrl": "",
  "maintenanceMode": false,
  "allowRegistration": true,
  "maxUsersPerPlan": 1000,
  "defaultSubscriptionDays": 30,
  "referralCommissionRate": 10,
  "maxQuestionsPerTest": 28,
  "maxQuestionsPerTestFree": 14,
  "emailNotifications": true,
  "smsNotifications": false,
  "zaloGroupLink": "",
  "footerDescription": "",
  "contactPhone": "",
  "contactEmail": "",
  "socialFacebook": "",
  "socialYoutube": "",
  "customHomepageHtml": "",
  "bankId": "",
  "bankName": "",
  "accountNumber": "",
  "accountName": "",
  "adminFeatureVisibility": {},
  "landingPageConfig": {},
  "pdfTemplateConfig": {},
  "pdfTemplateConfigPaid": {}
}')
ON CONFLICT (id) DO NOTHING;
