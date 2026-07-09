# TravelVault PRD

**Version:** 1.0 (Hackathon MVP)\
**Hackathon:** Supermemory Local Hackathon\
**Product:** TravelVault

------------------------------------------------------------------------

# Vision

TravelVault is a **local-first AI travel identity and booking
assistant** that securely stores traveler profiles, travel documents,
and preferences on the user's device using **Supermemory Local**.

Its primary goal is to drastically reduce the time required to fill
booking forms---especially **IRCTC Tatkal** bookings---through
intelligent, local autofill while keeping user data private.

------------------------------------------------------------------------

# Problem

Users repeatedly enter:

-   Passenger information
-   Aadhaar / Passport details
-   Contact information
-   Berth preferences
-   Meal preferences

For Tatkal bookings, these extra seconds often determine whether a
ticket is booked.

------------------------------------------------------------------------

# Goals

-   Local-first
-   Zero cloud storage
-   AI powered memory
-   One-click booking form autofill
-   Beautiful desktop experience
-   Chrome extension companion

------------------------------------------------------------------------

# Tech Stack

## Desktop

-   Tauri

## Frontend

-   Next.js 15
-   React
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   Framer Motion

## Monorepo

-   Turborepo

## Database

-   SQLite
-   Drizzle ORM

## Memory

-   Supermemory Local

## Chrome Extension

-   Plasmo

## OCR

-   Tesseract.js

------------------------------------------------------------------------

# Architecture

``` text
TravelVault Desktop (Tauri)

        │

Next.js Application

        │

Next.js Route Handlers

        │

 ┌──────────────┬─────────────┐
 │              │             │
 ▼              ▼             ▼

SQLite     Supermemory    Local Files

        │

Chrome Extension
```

------------------------------------------------------------------------

# Turborepo Structure

``` text
travelvault/

apps/
    desktop/
    web/
    extension/

packages/
    ui/
    db/
    memory/
    autofill/
    shared/
    types/

storage/
    documents/
    sqlite.db
```

------------------------------------------------------------------------

# Features

## Passenger Profiles

Store:

-   Name
-   DOB
-   Gender
-   Nationality
-   Aadhaar
-   Passport
-   Mobile
-   Email
-   Preferred Berth
-   Meal Preference

------------------------------------------------------------------------

## Travel Documents

Upload

-   Passport
-   Aadhaar
-   PAN
-   Visa
-   Travel Insurance

Extract metadata and index using Supermemory Local.

------------------------------------------------------------------------

## Chrome Extension

Supports:

-   IRCTC
-   MakeMyTrip
-   Goibibo
-   Ixigo
-   Airline booking forms

Workflow

1.  Detect booking page.
2.  Detect passenger form.
3.  Request passenger profile from local app.
4.  Autofill.
5.  Never send data to cloud.

------------------------------------------------------------------------

# Supermemory Integration

TravelVault must use Supermemory Local as the semantic memory engine.

Store:

-   Passenger profiles
-   Travel preferences
-   OCR extracted text
-   Searchable memories

Search examples:

-   Show my passport
-   Fill Prakhar's details
-   Who prefers lower berth?
-   Show international travelers

Everything executes locally.

------------------------------------------------------------------------

# SQLite Responsibility

SQLite stores:

-   File paths
-   Settings
-   Profile IDs
-   Metadata
-   Cache

Supermemory stores semantic memory.

------------------------------------------------------------------------

# API Endpoints

GET /api/health

GET /api/passengers

POST /api/passengers

POST /api/upload

POST /api/search

POST /api/autofill

------------------------------------------------------------------------

# UI Pages

-   Dashboard
-   Passenger Profiles
-   Documents
-   Search
-   Settings

Chrome Popup

-   Detect Form
-   Select Passenger
-   Autofill

------------------------------------------------------------------------

# Design Language

Inspired by:

-   Linear
-   Raycast
-   Arc Browser
-   Apple

Dark mode by default.

Minimal interface.

Smooth animations.

------------------------------------------------------------------------

# Security

-   No authentication
-   No cloud storage
-   No analytics
-   Local SQLite
-   Local Supermemory
-   Local files only

------------------------------------------------------------------------

# MVP Scope

Must Have

-   Passenger management
-   Document upload
-   Supermemory integration
-   Chrome extension
-   IRCTC autofill
-   Generic booking form autofill
-   Natural language search

Nice to Have

-   OCR
-   Expiry reminders
-   Travel history

------------------------------------------------------------------------

# Development Phases

Day 1

-   Turborepo
-   Tauri
-   Next.js
-   SQLite

Day 2

-   Passenger CRUD
-   Document upload

Day 3

-   Supermemory integration
-   Search

Day 4

-   Chrome extension
-   Autofill

Day 5

-   UI polish
-   Demo
-   README
-   Demo video

------------------------------------------------------------------------

# Acceptance Criteria

-   Passenger profile created in under 2 minutes.
-   Autofill completes in under 2 seconds.
-   Search returns relevant passenger in under 1 second.
-   All data remains on device.
-   Supermemory Local is required for semantic memory.

------------------------------------------------------------------------

# Instructions for Antigravity

1.  Build using TypeScript only.
2.  Use Turborepo.
3.  Use Tauri as desktop shell.
4.  Use Next.js Route Handlers instead of Express/FastAPI.
5.  Use SQLite with Drizzle ORM.
6.  Use Supermemory Local as the memory engine.
7.  Build the Chrome extension with Plasmo.
8.  Keep all data local.
9.  Prioritize clean architecture and reusable packages.
10. Produce production-quality UI with shadcn/ui and Framer Motion.
