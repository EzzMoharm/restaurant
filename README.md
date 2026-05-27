# BiteFlow – Premium Bilingual Food Ordering & Restaurant Management SaaS

BiteFlow is a full-featured, real-time, double-sided SaaS platform designed for modern dining establishments and food delivery services. It offers a premium customer-facing ordering application and a powerful, data-driven administrative dashboard for kitchen operations and restaurant owners.

---

## 🚀 The Elevator Pitch (Copy & Paste for Freelance Profiles)
> "Need a robust, real-time, high-performance web application? **BiteFlow** is a production-grade restaurant ordering and live management platform built using a cutting-edge modern stack: **Next.js 16 (App Router), React 19, Supabase BaaS, and Tailwind CSS v4**. With a beautiful, glassmorphic UI, full bilingual English/Arabic layout support, persistent state management via **Zustand**, and automated secure input sanitization, this project showcases clean-code architecture and commercial readiness."

---

## 📱 Core Customer-Facing App Features

*   **Premium Responsive UI/UX**: 
    *   Designed with modern visual aesthetics: smooth gradients, micro-animations, glassmorphism, and a responsive grid layout.
    *   Full native **Light / Dark Mode** toggles.
*   **Dynamic Bilingual Localization (English & Arabic)**:
    *   Integrated translation provider supporting seamless Left-to-Right (LTR) and Right-to-Left (RTL) layouts.
    *   Automatic preservation of selected language and theme configurations using Zustand's local storage middleware.
*   **Smart Isolated Cart State**:
    *   High-performance client-side cart utilizing custom Zustand store.
    *   **Multi-User Sandbox Isolation**: Carts are bound to specific `userId`s, ensuring that if multiple users share the same device/browser, their carts remain separate, secure, and persistently saved.
*   **Deep Item Customization**:
    *   Interactive customization modal (`CustomizationModal.tsx`) allowing clients to configure dish sizing, topping add-ons, and supply bespoke chef instructions.
*   **Step-by-Step Security Checkout Flow**:
    *   Auto-fills saved shipping coordinates and mobile lines from profile data.
    *   Flexible payment supports: Credit/Debit Mock Verification gates and Cash on Delivery (COD) processing.
*   **Bilingual Password Recovery Gate**:
    *   Self-service password recovery flow utilizing Supabase Auth SMTP reset links.
    *   Bespoke, secure `/reset-password` UI views with validations (minimum length checks and mismatch filters).
    *   Integrated session checkpoint guards to block unauthorized access to the reset page.
*   **Live Order Transit Tracker & Progress Monitor**:
    *   Visually tracks live chef approvals and kitchen preparation stages (*Received ➔ Cooking ➔ Quality Packed ➔ Out for Delivery ➔ Arrived Safely*).
    *   Calculates dynamic estimated time of arrival (ETA) indicators.
*   **Quick Re-ordering & User Dashboard**:
    *   View detailed transaction logs, receipts, and order histories.
    *   **Single-Click Re-order Action**: Repopulates the shopping cart with an exact set of customized meals from a past transaction instantly.

---

## 📊 Restaurant Administration & Operations Panel

*   **Real-time Business & Financial Analytics**:
    *   Interactive KPIs calculating today's revenue, active deliveries, overall transaction metrics, and identifying the platform’s "Most Popular Dish" dynamically.
*   **Kitchen Order Fulfillment Operations**:
    *   Real-time system state monitoring for incoming kitchen requests.
    *   One-click fulfillment stage management to transition client orders between cooking stages.
*   **Interactive Menu & Category Builder (CRUD)**:
    *   Live admin control panel to register new food classes (Categories) and create, edit, or delete individual menu products with custom imagery, descriptors, and pricing rules.
*   **Instant Out-of-Stock Toggle**:
    *   Instantly toggle food item availability to "Available" or "Out of Stock," reflecting immediately on the client-facing app to prevent incorrect orders.
*   **Enterprise Promotional Coupon Code Engine**:
    *   Create percentage-based (`%`) or fixed-amount (`$`) promotional discounts.
    *   Add validation rules: exact expiration timestamps, minimum order amount checks, max usage ceilings, and live performance metrics tracking how many times a coupon was successfully redeemed.

---

## 🛠️ Software Engineering & Technical Excellence Highlights
*(Show this to technical clients to demonstrate your coding standards)*

*   **Robust Input Sanitization & Security Suite (`lib/security.ts`)**:
    *   Custom sanitizers running on form inputs to completely block Cross-Site Scripting (XSS) and HTML injections.
    *   Strict text parsers, URL protocol filters (blocking dangerous `javascript:` tags), phone sanitizers, and numerical validators ensuring complete database storage integrity.
*   **Seamless Database Integration**:
    *   Utilizes a PostgreSQL database via **Supabase** backend-as-a-service.
    *   Handles secure email/password client signup and sign-in credentials, user sessions, and database row lookups.
*   **Advanced State Management**:
    *   Uses **Zustand** stores decoupled from UI renders to guarantee high performance, smooth updates, and low bundle sizes.
