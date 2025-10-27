-- Create tables
CREATE TABLE users (
    user_id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL
);

CREATE TABLE expos (
    expo_id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    date VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    location VARCHAR NOT NULL,
    featured BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE expo_registrations (
    registration_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(user_id),
    expo_id VARCHAR NOT NULL REFERENCES expos(expo_id),
    registered_at VARCHAR NOT NULL
);

CREATE TABLE exhibitors (
    exhibitor_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(user_id),
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    company VARCHAR,
    created_at VARCHAR NOT NULL
);

CREATE TABLE virtual_booths (
    booth_id VARCHAR PRIMARY KEY,
    exhibitor_id VARCHAR NOT NULL REFERENCES exhibitors(exhibitor_id),
    description VARCHAR,
    media_urls VARCHAR,
    product_catalog VARCHAR
);

CREATE TABLE user_interactions (
    interaction_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(user_id),
    exhibitor_id VARCHAR NOT NULL REFERENCES exhibitors(exhibitor_id),
    interaction_type VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL
);

CREATE TABLE notifications (
    notification_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(user_id),
    message VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    created_at VARCHAR NOT NULL
);

CREATE TABLE admin_activity_logs (
    log_id VARCHAR PRIMARY KEY,
    admin_id VARCHAR NOT NULL REFERENCES users(user_id),
    activity_description VARCHAR NOT NULL,
    timestamp VARCHAR NOT NULL
);

CREATE TABLE event_schedules (
    schedule_id VARCHAR PRIMARY KEY,
    expo_id VARCHAR NOT NULL REFERENCES expos(expo_id),
    event_name VARCHAR NOT NULL,
    event_time VARCHAR NOT NULL,
    speaker_info VARCHAR
);

CREATE TABLE feedbacks (
    feedback_id VARCHAR PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(user_id),
    feedback_content VARCHAR NOT NULL,
    submitted_at VARCHAR NOT NULL
);

-- Seed data
INSERT INTO users (user_id, email, name, password_hash, created_at) VALUES
('user1', 'alice@example.com', 'Alice', 'password123', '2023-09-01T10:00:00'),
('user2', 'bob@example.com', 'Bob', 'user123', '2023-09-02T11:00:00'),
('admin1', 'admin@example.com', 'Admin', 'admin123', '2023-09-03T12:00:00');

INSERT INTO expos (expo_id, title, description, date, category, location, featured) VALUES
('expo1', 'Tech Expo 2023', 'A grand event showcasing the latest in tech innovations.', '2023-10-05', 'Technology', 'San Francisco', TRUE),
('expo2', 'Art Expo 2023', 'An event displaying contemporary art.', '2023-11-10', 'Art', 'New York', FALSE);

INSERT INTO expo_registrations (registration_id, user_id, expo_id, registered_at) VALUES
('reg1', 'user1', 'expo1', '2023-09-15T09:00:00'),
('reg2', 'user2', 'expo2', '2023-09-18T10:30:00');

INSERT INTO exhibitors (exhibitor_id, user_id, name, email, company, created_at) VALUES
('exhibitor1', 'user1', 'Alice Tech', 'alice@techexample.com', 'Tech Example Inc.', '2023-09-01T10:05:00'),
('exhibitor2', 'user2', 'Bob Art', 'bob@artexample.com', 'Art Example LLC', '2023-09-02T11:10:00');

INSERT INTO virtual_booths (booth_id, exhibitor_id, description, media_urls, product_catalog) VALUES
('booth1', 'exhibitor1', 'Showcasing VR technology.', 'https://picsum.photos/200?image=1', 'Catalog1'),
('booth2', 'exhibitor2', 'Displaying modern art pieces.', 'https://picsum.photos/200?image=2', 'Catalog2');

INSERT INTO user_interactions (interaction_id, user_id, exhibitor_id, interaction_type, created_at) VALUES
('interact1', 'user1', 'exhibitor2', 'chat', '2023-09-16T13:00:00');

INSERT INTO notifications (notification_id, user_id, message, type, created_at) VALUES
('notif1', 'user1', 'Your registration for Tech Expo 2023 is confirmed.', 'registration', '2023-09-15T09:05:00');

INSERT INTO admin_activity_logs (log_id, admin_id, activity_description, timestamp) VALUES
('log1', 'admin1', 'Approved exhibitor registration for Alice Tech', '2023-09-03T15:00:00');

INSERT INTO event_schedules (schedule_id, expo_id, event_name, event_time, speaker_info) VALUES
('schedule1', 'expo1', 'Keynote Speech', '2023-10-05T10:00:00', 'John Doe, CEO of Tech Giant');

INSERT INTO feedbacks (feedback_id, user_id, feedback_content, submitted_at) VALUES
('feedback1', 'user2', 'Great expo, very informative!', '2023-11-11T14:00:00');
