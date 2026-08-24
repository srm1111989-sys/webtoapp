# Rahatna — Phase 1: Floating Overlay (custom feature, paid USD 120)

Customer: mohamed.adam657@gmail.com · App: "Rahatna" (Base44, wrapped by WebToApp) · rahatna.site
Order/payment: Razorpay link https://rzp.io/rzp/xwd8ihT (build starts on confirmed payment).

## Scope (Phase 1 only — overlay/bubble)
On a new service-request push to a **Service Provider**, show a floating overlay OVER other apps:
- Fields: service type, customer name, price, area, 30-second countdown.
- Buttons: Accept, Reject, Negotiate.
- Tap overlay (outside buttons) → open the app to the request details.
- Always fetch the LATEST details by Order ID from the customer's endpoint (don't trust push body).
- Auto-dismiss when the request is accepted by another provider or cancelled (via a push event).
- Overlay/`SYSTEM_ALERT_WINDOW` permission requested ONLY on Service-Provider registration; Customers never prompted.
(Phase 2, separate USD 80, later: full-screen lock-screen incoming-request with address/photos/map.)

## Delivery model (IMPORTANT — do NOT touch the shared template until tested)
This is a per-app custom feature, not a general WebToApp feature. Build + verify it here
first. When done and paid, integrate as a FEATURE-GATED module (activated only for Rahatna's
app_config via a `features.rahatna_overlay` flag) and — per the pipeline sync rule — apply it
identically to github1 + github2 + github3 with the var added to the github allowlist +
each workflow's inputs. (See ../../../.ai/WEBTOAPP-BUILD-PIPELINES.md.)

## Components
1. `FloatingOverlayService` (foreground service, `TYPE_APPLICATION_OVERLAY`) — draws the overlay,
   runs the 30s countdown, wires the 3 buttons, handles tap-to-open. (scaffolded here)
2. `overlay_incoming_request.xml` — the overlay layout. (scaffolded here)
3. FCM data-message hook — on a new-request push, start the service with the Order ID.
   **Blocked on:** mohamed's sample push payload (field names / where Order ID lives).
4. Order-details fetch — `POST /functions/getOrderDetails {orderId, providerUserId}` → populate overlay.
   **Blocked on:** a test Service-Provider login + sample orderId/providerUserId.
5. Auto-dismiss — listen for an "order taken/cancelled" push event → stopSelf().
   **Blocked on:** confirmation that backend emits such an event + its shape.
6. Permission gating — request overlay permission from the Service-Provider registration flow only.

## Open dependencies (requested from mohamed 2026-08-07)
- Sample new-request push payload.
- Test Service-Provider login + sample orderId/providerUserId for getOrderDetails.
- Whether backend emits an accept/cancel event (for auto-dismiss).
