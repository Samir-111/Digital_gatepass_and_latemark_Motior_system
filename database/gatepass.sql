-- SMART DIGITAL GATE PASS MANAGEMENT SYSTEM --
-- MySQL Database Schema and Seed Scripts --
-- Created for Production Deployment (Clean Initial State) --

CREATE DATABASE IF NOT EXISTS gatepass;
USE gatepass;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS Departments (
    id VARCHAR(50) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. HOD Table (Moved up so Students can reference it if needed, or link via Department)
CREATE TABLE IF NOT EXISTS HOD (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    FOREIGN KEY (department_id) REFERENCES Departments(id) ON DELETE RESTRICT
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS Students (
    id VARCHAR(50) PRIMARY KEY,
    college_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    roll_no VARCHAR(50) NOT NULL UNIQUE,
    department_id VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    photo LONGTEXT,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES Departments(id) ON DELETE RESTRICT
);

-- 4. Guards Table
CREATE TABLE IF NOT EXISTS Guards (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

-- 5. Admins Table
CREATE TABLE IF NOT EXISTS Admins (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

-- 6. GatePass Table
CREATE TABLE IF NOT EXISTS GatePass (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    destination VARCHAR(255) NOT NULL,
    exit_time TIMESTAMP NOT NULL,
    return_time TIMESTAMP NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'exited', 'closed', 'cancelled') DEFAULT 'pending',
    qr_code LONGTEXT,
    approved_by VARCHAR(100),
    remarks TEXT,
    exit_marked_at TIMESTAMP NULL,
    return_marked_at TIMESTAMP NULL,
    token VARCHAR(255) UNIQUE,
    risk_level ENUM('low', 'medium', 'high'),
    risk_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE
);

-- 7. ActivityLogs Table
CREATE TABLE IF NOT EXISTS ActivityLogs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- INITIAL BOOTSTRAP SEED (Only Admin is created)
-- -------------------------------------------------------------

-- Seed Only the System Administrator (Password: "password")
-- This allows you to log in to the fresh dashboard and begin data entry.
INSERT INTO Admins (id, name, email, password_hash) 
VALUES ('admin-1', 'System Administrator', 'admin@college.edu', '$2a$10$tZ922pYvF72D.86T9u8fBOSoO1iCgW319bObe6Lq1mX3H7KscD0.i');

