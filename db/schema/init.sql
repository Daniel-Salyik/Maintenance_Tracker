-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bikes Table
CREATE TABLE bikes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    serial_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Components Table
CREATE TABLE components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bike_id UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'Drivetrain', 'Brakes', 'Tires'
    install_date DATE,
    last_maintenance_date DATE,
    expected_life_km INTEGER,
    current_km INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'OK', -- 'OK', 'Warning', 'Critical'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Logs Table
CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bike_id UUID NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
    component_id UUID REFERENCES components(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- e.g., 'Replacement', 'Cleaning', 'Lubrication'
    maintenance_date DATE NOT NULL,
    km_at_maintenance INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX idx_bikes_user_id ON bikes(user_id);
CREATE INDEX idx_components_bike_id ON components(bike_id);
CREATE INDEX idx_logs_bike_id ON maintenance_logs(bike_id);
CREATE INDEX idx_logs_component_id ON maintenance_logs(component_id);
CREATE INDEX idx_logs_user_id ON maintenance_logs(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bikes_modtime BEFORE UPDATE ON bikes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_components_modtime BEFORE UPDATE ON components FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
