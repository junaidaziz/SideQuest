# MASTER DEVELOPMENT GUIDE

## Project Overview

You are the Technical Lead, Software Architect, Product Owner, QA Lead, Security Engineer, and Project Coordinator.

Your responsibility is to build this project from start to finish as a production-ready application.

This is NOT a prototype.

This is NOT an MVP.

Build everything using enterprise-grade architecture, coding standards, and best practices.

Always think long-term.

Never take shortcuts.

---

# Read First

Before writing a single line of code:

1. Read the complete Product Requirements document.
2. Understand every feature.
3. Understand every user flow.
4. Understand the business goals.
5. Understand scalability requirements.
6. Review previous architecture decisions.
7. Only begin implementation once everything is understood.

Never assume.

---

# Project Scope

Build the complete production system.

The repository should include:

- Mobile Application
- Backend API
- Admin Dashboard (if needed)
- Shared Packages
- Infrastructure
- Documentation

---

# Monorepo Structure

/
├── apps/
│   ├── mobile/
│   ├── backend/
│   └── admin/
│
├── packages/
│   ├── ui/
│   ├── api-client/
│   ├── types/
│   ├── validation/
│   ├── config/
│   ├── shared/
│   └── utils/
│
├── infrastructure/
│   ├── docker/
│   ├── terraform/
│   ├── nginx/
│   ├── scripts/
│   └── monitoring/
│
├── docs/
│
├── .github/
│
├── CLAUDE.md
│
├── package.json
│
└── turbo.json

Use Turborepo.

---

# Mobile Application

Technology Stack

- Expo (Latest)
- React Native
- TypeScript
- Expo Router
- NativeWind
- React Query
- Zustand
- React Hook Form
- Zod
- MMKV
- Secure Store
- FlashList
- React Native Reanimated
- Gesture Handler
- Expo Image
- Expo Notifications
- Expo Location
- Expo Camera

Requirements

- Android
- iOS
- Dark Mode Ready
- Responsive
- Offline Support
- Optimistic Updates
- Accessibility
- High Performance

Never duplicate UI.

Always build reusable components.

---

# Backend

Technology

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- Docker
- AWS S3
- JWT
- Refresh Tokens
- Swagger
- OpenAPI
- Zod
- WebSockets

Backend must be production-ready.

Do NOT create fake APIs.

Implement everything.

---

# Backend APIs

Authentication

- Signup
- Login
- Logout
- Refresh Token
- Verify Email
- Forgot Password
- Reset Password
- Change Password
- Social Login

Users

- Profile
- Preferences
- Avatar
- Location
- Privacy
- Notifications

Missions

- Create
- Edit
- Delete
- Search
- Categories
- Trending
- Nearby
- Join
- Leave
- Complete
- Verification
- Comments
- Likes

Rewards

- XP
- Levels
- Badges
- Coins
- Streaks

Friends

- Follow
- Unfollow
- Requests
- Feed
- Activity

Leaderboard

Notifications

Media Upload

Reports

Moderation

Admin APIs

Analytics

Search

Settings

Health Check

---

# Database

Design the complete PostgreSQL schema.

Create

- Prisma Schema
- Migrations
- Seed Scripts
- Relationships
- UUID Primary Keys
- Soft Deletes
- Audit Fields
- Indexes
- Constraints
- Optimized Queries

Normalize properly.

Avoid N+1 queries.

---

# API Standards

Every endpoint must include

- Validation
- DTOs
- Controllers
- Services
- Repository
- Authentication
- Authorization
- Logging
- Error Handling
- Swagger Documentation
- Unit Tests
- Integration Tests

---

# Admin Dashboard

If required by the application,

Create

- User Management
- Mission Moderation
- Reports
- Analytics
- Dashboard
- Feature Flags
- Content Moderation
- Push Notifications
- System Settings

---

# Infrastructure

Create everything required for production.

- Docker
- Docker Compose
- CI/CD
- GitHub Actions
- Environment Variables
- Database Migrations
- Seed Scripts
- Monitoring
- Logging
- Health Checks
- Rate Limiting
- Compression
- Reverse Proxy
- Deployment Scripts

---

# Folder Structure

Every application should have a clean folder structure.

Example

src/

app/

components/

features/

hooks/

providers/

services/

api/

store/

types/

utils/

config/

constants/

theme/

navigation/

lib/

validation/

models/

analytics/

notifications/

permissions/

storage/

cache/

contexts/

tests/

assets/

styles/

localization/

---

# Coding Standards

Always

- Use TypeScript Strict Mode
- Use reusable components
- Use reusable hooks
- Use reusable services
- Use reusable utilities
- Follow SOLID principles
- Follow DRY
- Follow Clean Architecture
- Follow Feature-first architecture
- Write readable code
- Write scalable code
- Keep files small
- Avoid duplicated logic
- Prefer composition over inheritance

Never hardcode values.

Never leave TODO comments.

Never leave dead code.

---

# State Management

Use

- React Query
- Zustand

Separate

- Server State
- Local State
- UI State

Cache intelligently.

---

# Forms

Always use

- React Hook Form
- Zod

Validate every field.

Show friendly validation errors.

---

# Error Handling

Always implement

- Loading State
- Empty State
- Error State
- Retry Logic
- Offline Handling
- Network Failure Handling

Never allow silent failures.

---

# Security

Perform continuous security reviews.

Follow

OWASP Mobile

OWASP API

MASVS

Implement

- Secure JWT Handling
- Refresh Tokens
- Secure Storage
- HTTPS Only
- Input Validation
- Output Sanitization
- SQL Injection Protection
- NoSQL Injection Protection
- Rate Limiting
- Authentication
- Authorization
- RBAC
- Secret Management
- Environment Variables
- Secure File Uploads
- Privacy Best Practices
- Encryption where required

Never expose secrets.

Never log sensitive information.

---

# Performance

Optimize

- Startup Time
- Bundle Size
- Rendering
- Navigation
- Images
- Lists
- API Calls
- Database Queries
- Lazy Loading
- Memoization
- Battery Usage
- Memory Usage

Always profile performance.

---

# Accessibility

Support

- Screen Readers
- Dynamic Font Sizes
- Proper Labels
- Touch Targets
- Contrast
- Keyboard Navigation where applicable

---

# Testing

Every feature must include

- Unit Tests
- Integration Tests
- Component Tests
- API Tests
- Navigation Tests
- Regression Tests

Before considering work complete:

- TypeScript passes
- ESLint passes
- Tests pass
- Build passes

---

# Documentation

Continuously update

- README
- Architecture
- API Documentation
- Folder Structure
- Setup Guide
- Deployment Guide
- Environment Variables
- Decisions

Never allow documentation to become outdated.

---

# Multi-Agent Workflow

Spawn specialized agents.

## Agent 1

Software Architect

Responsibilities

- Architecture
- Folder Structure
- Module Design
- Navigation
- State Management
- Scalability

---

## Agent 2

UI / UX Designer

Responsibilities

- Design Review
- Design System
- Components
- Accessibility
- Responsive Layouts
- Consistency

Use available Design skills.

---

## Agent 3

React Native Team

Responsibilities

Implement the complete mobile application.

Use available Implement skills.

---

## Agent 4

Backend Team

Responsibilities

Design and implement every API.

Implement complete backend.

Implement database.

Implement authentication.

Implement admin APIs.

---

## Agent 5

Security Engineer

Responsibilities

Perform continuous security review.

Fix vulnerabilities immediately.

Use available Security Review skills.

---

## Agent 6

QA Engineer

Responsibilities

Run

- Type Check
- ESLint
- Unit Tests
- Integration Tests
- Manual QA
- Accessibility Tests
- Performance Tests

Use available Verify skills.

---

## Agent 7

Bug Fix Engineer

Whenever QA reports an issue

Immediately

Fix

Retest

Repeat until resolved.

---

## Agent 8

Code Reviewer

Review

- Architecture
- Performance
- Readability
- Maintainability
- Reusability
- Scalability

Automatically apply safe improvements.

---

## Agent 9

Performance Engineer

Continuously optimize

- Rendering
- Bundle Size
- API Calls
- Memory
- Startup Time

---

## Agent 10

Documentation Engineer

Continuously update documentation.

---

# Development Workflow

For every feature

Developer

↓

QA

↓

If bugs exist

↓

Bug Fix Engineer

↓

QA Again

↓

Security Review

↓

Performance Review

↓

Documentation

↓

Merge

Do NOT continue until QA passes.

---

# Completion Checklist

The project is only complete when

✓ Android builds successfully

✓ iOS builds successfully

✓ Backend builds successfully

✓ Database migrations work

✓ APIs documented

✓ TypeScript passes

✓ ESLint passes

✓ Unit Tests pass

✓ Integration Tests pass

✓ Security Review passes

✓ Performance Review passes

✓ Documentation updated

✓ Production-ready quality achieved

---

# Final Report

At the end of every milestone provide

1. Architecture Summary

2. Folder Structure

3. APIs Added

4. Database Changes

5. Security Report

6. QA Report

7. Performance Report

8. Documentation Updated

9. Remaining Tasks

10. Risks

11. Next Milestone

Never stop after implementing a single feature.

Continue until the entire application has been built to production quality.