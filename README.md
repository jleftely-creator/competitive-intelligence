# Competitive Intelligence

Analyze competitor creators and benchmark performance. Track market share, content strategies, and growth patterns.

## Modes

### Landscape Mode
Analyze a group of creators as a competitive market:
- Market share by followers and engagement
- Ranking by followers, engagement, growth
- Content strategy analysis
- Competitive insights and opportunities

### Benchmark Mode
Compare a target creator against specific competitors:
- Percentile rankings (Top 10%, Above Average, etc.)
- Gap analysis to market leader
- Personalized recommendations
- Growth trajectory comparison

## Output (Landscape)

```json
{
  "summary": {
    "totalCreators": 5,
    "totalFollowers": 25000000,
    "avgEngagement": 4.2
  },
  "highlights": {
    "marketLeader": { "username": "top_creator", "marketShare": 45 },
    "fastestGrowing": { "username": "rising_star", "growthPerMonth": 500000 },
    "highestEngagement": { "username": "engaged_creator", "engagementRate": 8.5 }
  },
  "rankings": {
    "byFollowers": [...],
    "byEngagement": [...],
    "byGrowth": [...]
  },
  "insights": [
    { "type": "challenger_rising", "message": "...", "severity": "warning" }
  ]
}
```

## Output (Benchmark)

```json
{
  "target": {
    "username": "my_creator",
    "metrics": { "followers": 500000, "engagementRate": 5.2 }
  },
  "benchmarks": {
    "followers": { "rank": 2, "percentile": 80, "label": "Top 25%" },
    "engagement": { "rank": 1, "percentile": 100, "label": "Top 10%" },
    "growth": { "rank": 3, "percentile": 60, "label": "Above Average" }
  },
  "gapToLeader": { "followers": 200000, "percentage": 28 },
  "recommendations": [
    { "category": "Growth", "priority": "high", "action": "..." }
  ]
}
```

## Input (Landscape)

```json
{
  "mode": "landscape",
  "tiktokUsernames": ["creator1", "creator2", "creator3", "creator4"]
}
```

## Input (Benchmark)

```json
{
  "mode": "benchmark",
  "targetUsername": "my_creator",
  "competitorUsernames": ["competitor1", "competitor2", "competitor3"]
}
```

## Insights Generated

- **Market Dominance** - When leader has >50% market share
- **Challenger Rising** - When #2 is growing faster than #1
- **Engagement Opportunity** - High engagement creator with growth potential
- **Growth Outlier** - Creator growing 2x faster than average
- **Strategy Uniformity** - All competitors using same strategy = differentiation opportunity

## Use Cases

- **Creators**: Benchmark yourself against competitors, get improvement recommendations
- **Brands**: Understand niche landscape before picking creators
- **Agencies**: Competitive analysis for pitches and strategy
- **Investors**: Market sizing and leader identification

## Pricing

~$0.02-0.04 per creator analyzed (depends on profile fetch).

---

Built by [Creator Fusion](https://creatorfusion.net)
