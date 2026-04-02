-- Sample data for testing
-- Run this in Supabase SQL Editor

-- Insert sample charities
INSERT INTO charities (name, description, website_url, is_featured) VALUES
('Red Cross', 'International humanitarian organization providing disaster relief, community support, and first aid training worldwide.', 'https://www.redcross.org', true),
('World Wildlife Fund', 'Global organization dedicated to conservation, protecting endangered species and their habitats.', 'https://www.worldwildlife.org', true),
('St. Jude Children''s Research Hospital', 'Leading pediatric cancer research hospital providing free treatment to children.', 'https://www.stjude.org', false),
('UNICEF', 'UN organization providing humanitarian aid and development assistance to children and mothers in developing countries.', 'https://www.unicef.org', false),
('World Food Programme', 'UN organization fighting hunger and malnutrition, providing emergency food assistance.', 'https://www.wfp.org', false)
ON CONFLICT (name) DO UPDATE SET
	description = EXCLUDED.description,
	website_url = EXCLUDED.website_url,
	is_featured = EXCLUDED.is_featured;

-- Insert sample users (use real Supabase auth user IDs)
-- This is just for reference - users will be created through signup
-- INSERT INTO profiles (id, email, full_name, is_admin) VALUES
-- ('user-id-1', 'user1@example.com', 'John Golfer', false),
-- ('user-id-2', 'user2@example.com', 'Jane Fairway', false),
-- ('admin-id-1', 'admin@example.com', 'Admin User', true);
