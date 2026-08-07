# Rahatna Overlay — confirmed integration (from customer, 2026-08-07)

Payment: Razorpay `pay_TMttRrCRrXjEpV` — captured, USD 120.00 (card). App URL: https://rahatna.site

## Push payloads (FCM `data`) — how to trigger
Two push types, NO `type` field; the key present tells them apart:
- **Direct order** (`sendOrderNotification`): `data.orderId`
- **Public request** (`notifyProvidersNewPublicRequest`): `data.requestId`

Android trigger: `id = data.orderId ?? data.requestId; if (id != null) show overlay`.
Pass that id as `orderId` to getOrderDetails — the endpoint checks both tables.
(Wired in `FCMService.onMessageReceived`.)

## Order-details endpoint
`POST {app_url}/functions/getOrderDetails`  →  for Rahatna: `https://rahatna.site/functions/getOrderDetails`
Body: `{ "orderId": "<id>", "providerUserId": "<id>" }`  · no auth header (authorized by providerUserId; wrong provider → 403).
Response: `{ success, type: "order"|"publicRequest", order: { ... } }`.

## Response field names (VERIFIED against a real 200 response) — the overlay mapping
| Overlay field | JSON key (inside `order`) | Sample |
|---|---|---|
| Service type | **`service`** | "عربية دفار" (⚠ NOT `type`; `type` is the order/publicRequest discriminator) |
| Customer name | `customerName` | "احمد عثمان محمد الفاضل" |
| Price | `price` | 4666 |
| Area | `area` | "الخرطوم" (full route in `address`) |
| Description | `description` | "نقل اثاث منزلي" |
| Photos (≤3) | `descriptionImages` | array of image URLs |
| Coordinates | `startLat/startLng`, `endLat/endLng`, `customerLat/customerLng` | |
| Status | `status` | "cancelled"/"accepted"/... |

`OverlayConfig` defaults: `f_service=service`, `f_customer=customerName`, `f_price=price`, `f_area=area`;
`details_url` defaults to `{app_url}/functions/getOrderDetails`. All overridable via `features.overlay`.

## Test data (customer-provided)
- Provider login: `yazenmosab19@gmail.com` / phone `0964353344` / password `1234` (service عربية دفار, Approved, FCM token set).
- `providerUserId` = `6a72ffe17cc8529ba9263c0d` · `providerProfileId` = `6a72ffe17f53b2b50b20ccff`
- Verified direct order (200): `orderId` `6a7483d3d78fe213b3d3f227`
- Wrong-provider order → 403 (security check passes).
- Sample public `requestId` `6a72f9679f80679b673ff7ae` is already accepted → 403; create a fresh pending public request to test the public success path.

## Auto-dismiss
No taken/cancelled push documented yet → overlay closes on the 30s timer. If a dismiss push is added later,
`FCMService` already routes `type in {request_taken,request_cancelled,cancelled}` → `FloatingOverlayService.ACTION_DISMISS`.
