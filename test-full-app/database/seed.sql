-- Database seed data
INSERT INTO users (id, email, name, role, is_active, created_at, updated_at) VALUES
(1, 'admin@example.com', 'Admin User', 'admin', true, NOW(), NOW()),
(2, 'user@example.com', 'Regular User', 'user', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
