-- SMART DIGITAL GATE PASS MANAGEMENT SYSTEM --
-- MySQL Database Schema and Seed Scripts --
-- Created for Production Deployment --

CREATE DATABASE IF NOT EXISTS gatepass;
USE gatepass;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS Departments (
  id VARCHAR(50) PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS Students (
  id VARCHAR(50) PRIMARY KEY,
  college_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  roll_no VARCHAR(50) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  photo LONGTEXT,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. HOD Table
CREATE TABLE IF NOT EXISTS HOD (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
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
-- SEED DATA (Password for all pre-seeded accounts is "password")
-- -------------------------------------------------------------

-- Seed Departments
INSERT INTO Departments (id, department_name) VALUES 
('dept-1', 'Computer Science'),
('dept-2', 'Electrical Engineering'),
('dept-3', 'Mechanical Engineering'),
('dept-4', 'Civil Engineering'),
('dept-5', 'Business Administration');

-- Seed HODs (Hashed password for "password" is bcrypt hash '$2a$10$tZ922pYvF72D.86T9u8fBOSoO1iCgW319bObe6Lq1mX3H7KscD0.i')
INSERT INTO HOD (id, name, department, email, password_hash) VALUES
('hod-1', 'Dr. Alice Vance', 'Computer Science', 'hod@college.edu', '$2a$10$tZ922pYvF72D.86T9u8fBOSoO1iCgW319bObe6Lq1mX3H7KscD0.i'),
('hod-2', 'Prof. Robert Dow', 'Electrical Engineering', 'hod2@college.edu', '$2a$10$tZ922pYvF72D.86T9u8fBOSoO1iCgW319bObe6Lq1mX3H7KscD0.i');

-- Seed Guards
INSERT INTO Guards (id, name, email, password_hash) VALUES
('guard-1', 'Officer Rex Johnson', 'guard@college.edu', '$2a$10$tZ922pYvF72D.86T9u8fBOSoO1iCgW319bObe6Lq1mX3H7KscD0.i'),
('guard-2', 'Officer Sarah Connor', 'guard2@college.edu', '$2a$10$tZ922pYvF72D.86T9u8fBOSoO1iCgW319bObe6Lq1mX3H7KscD0.i');

-- Seed Admins
INSERT INTO Admins (id, name, email, password_hash) VALUES
('admin-1', 'System Administrator', 'admin@college.edu', '$2a$10$tZ922pYvF72D.86T9u8fBOSoO1iCgW319bObe6Lq1mX3H7KscD0.i');

-- Seed Students
INSERT INTO Students (id, college_id, name, roll_no, department, email, phone, password_hash, created_at) VALUES
('stud-1', 'C-202601', 'Samir Khorgade', 'CS202601', 'Computer Science', 'student@college.edu', '+1 555-0199', '$2a$10$tZ922pYvF72D.86T9u8fBOSoO1iCgW319bObe6Lq1mX3H7KscD0.i', NOW()),
('stud-2', 'C-202602', 'Jane Doe', 'EE202602', 'Electrical Engineering', 'jane@college.edu', '+1 555-0144', '$2a$10$tZ922pYvF72D.86T9u8fBOSoO1iCgW319bObe6Lq1mX3H7KscD0.i', NOW());
