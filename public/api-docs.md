# Compass Public API v1

## POST /api/v1/analyze-portfolio

Analyze a portfolio and get a health score with recommendations.

Request body:

```json
{
  "holdings": [
    { "ticker": "VTI", "name": "Vanguard Total Stock Market ETF", "type": "etf", "shares": 10, "price": 250, "value": 2500 }
  ],
  "goals": { "targetAllocation": { "etf": 0.7, "bond": 0.25, "cash": 0.05 }, "timeHorizon": 10, "riskScore": 65 }
}
```

Response:

```json
{
  "status": "success",
  "data": { "overall": 74, "components": { "diversification": 80 }, "alerts": [] },
  "apiVersion": "v1"
}
```
