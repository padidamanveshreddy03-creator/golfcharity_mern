# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a valid Supabase session token. Include in header:

```
Authorization: Bearer <session_token>
```

## Response Format

All responses return JSON:

```json
{
  "success": true|false,
  "data": {},
  "error": "error message",
  "message": "success message"
}
```

---

## Scores API

### Add Score

```
POST /scores
Content-Type: application/json

{
  "user_id": "uuid",
  "score": 28,
  "score_date": "2024-01-15"
}

Response: 201
{
  "success": true,
  "data": {...},
  "message": "Score recorded successfully"
}
```

### Get User Scores

```
GET /scores?user_id=uuid

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "score": 28,
      "score_date": "2024-01-15",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

## Subscriptions API

### Create Checkout Session

```
POST /subscriptions
Content-Type: application/json

{
  "user_id": "uuid",
  "plan_type": "monthly" | "yearly"
}

Response: 200
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

### Get User Subscription

```
GET /subscriptions?user_id=uuid

Response: 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "stripe_customer_id": "cus_...",
    "stripe_subscription_id": "sub_...",
    "plan_type": "monthly",
    "status": "active",
    "amount_in_cents": 999,
    "current_period_start": "2024-01-01T00:00:00Z",
    "current_period_end": "2024-02-01T00:00:00Z"
  }
}
```

---

## Draws API

### Run Draw (Simulate or Publish)

```
POST /draws
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "draw_date": "2024-01-20",
  "draw_mode": "random" | "algorithm",
  "publish": true | false
}

Response: 200
{
  "success": true,
  "data": {
    "draw": {
      "id": "uuid",
      "draw_date": "2024-01-20",
      "draw_numbers": [5, 12, 23, 34, 42],
      "status": "published" | "simulated",
      ...
    },
    "results": {
      "drawNumbers": [5, 12, 23, 34, 42],
      "winners": {
        "five": [{user_id, amount}],
        "four": [{user_id, amount}],
        "three": [{user_id, amount}]
      },
      "stats": {
        "totalParticipants": 150,
        "totalPoolAmount": 5000,
        "fiveMatchers": 1,
        "fourMatchers": 5,
        "threeMatchers": 20
      }
    }
  }
}
```

### Get Draws

```
GET /draws?status=published|simulated|archived

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "draw_date": "2024-01-20",
      "draw_numbers": [5, 12, 23, 34, 42],
      "draw_mode": "algorithm",
      "status": "published",
      ...
    }
  ]
}
```

---

## Winnings API

### Get User Winnings

```
GET /winnings?user_id=uuid

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "draw_id": "uuid",
      "matches_count": 4,
      "amount_won_cents": 25000,
      "proof_image_url": "https://...",
      "verification_status": "pending|approved|rejected",
      "payment_status": "pending|paid"
    }
  ]
}
```

### Upload Winning Proof

```
POST /winnings
Content-Type: multipart/form-data

winning_id: uuid
proof: <File - image/jpeg, image/png, or image/webp max 5MB>

Response: 200
{
  "success": true,
  "data": {...},
  "message": "Proof uploaded successfully"
}
```

### Verify/Reject Winning (Admin)

```
PATCH /winnings
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "winning_id": "uuid",
  "verification_status": "approved|rejected",
  "rejection_reason": "optional reason",
  "verified_by": "admin_user_id"
}

Response: 200
{
  "success": true,
  "data": {...},
  "message": "Winning updated successfully"
}
```

---

## Charities API

### Get All Charities

```
GET /charities?featured=true|false

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Red Cross",
      "description": "...",
      "image_url": "https://...",
      "website_url": "https://...",
      "is_featured": true
    }
  ]
}
```

### Create Charity (Admin)

```
POST /charities
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Charity Name",
  "description": "Description",
  "image_url": "https://...",
  "website_url": "https://...",
  "is_featured": false
}

Response: 201
{
  "success": true,
  "data": {...},
  "message": "Charity created successfully"
}
```

### Update Charity (Admin)

```
PUT /charities
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "id": "uuid",
  "name": "Updated Name",
  ...
}

Response: 200
{
  "success": true,
  "data": {...}
}
```

### Delete Charity (Admin)

```
DELETE /charities?id=uuid
Authorization: Bearer <admin_token>

Response: 200
{
  "success": true,
  "message": "Charity deleted successfully"
}
```

---

## Admin Users API

### Get All Users

```
GET /admin/users?limit=50&offset=0
Authorization: Bearer <admin_token>

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "is_admin": false,
      "subscriptions": [...]
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### Update User (Admin)

```
PATCH /admin/users
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "user_id": "uuid",
  "is_admin": true,
  "full_name": "Jane Doe"
}

Response: 200
{
  "success": true,
  "data": {...}
}
```

---

## Stripe Webhook

### Webhook Endpoint

```
POST /stripe/webhook
X-Stripe-Signature: <Stripe signature>

Events handled:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

---

## Error Codes

| Code | Status       | Description                   |
| ---- | ------------ | ----------------------------- |
| 400  | Bad Request  | Missing or invalid parameters |
| 401  | Unauthorized | Invalid or missing auth token |
| 403  | Forbidden    | Insufficient permissions      |
| 404  | Not Found    | Resource not found            |
| 409  | Conflict     | Resource already exists       |
| 500  | Server Error | Internal server error         |

---

## Rate Limiting

Currently no strict rate limiting implemented. For production:

- Recommend implementing 100 requests/minute per user
- 1000 requests/minute per IP

---

## Webhooks

### Stripe Webhook Events

For events to process correctly:

1. Webhook endpoint must be accessible
2. STRIPE_WEBHOOK_SECRET must match
3. Event body must be raw (not parsed)

---

## Testing

### Test Credentials

**Card Numbers:**

- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Authentication: 4000 0025 0000 3155

**Expiry:** Any future date
**CVC:** Any 3 digits

### API Testing Tools

- Postman: https://www.postman.com
- Insurance: https://insomnia.rest
- curl: `curl -X POST http://localhost:3000/api/...`

---

## Changelog

- v1.0.0 - Initial release

---

For implementation details, see source code in `app/api/*`
