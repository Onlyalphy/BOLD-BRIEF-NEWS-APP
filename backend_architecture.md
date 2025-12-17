# Bold Briefing - Autonomous Newsroom Blueprint

## 1. Core Components

### Ingestor
- **Function**: Pulls recent posts via X API search queries and NewsAPIs.
- **Logic**: Iterates through the `REGION_CONFIG` defined in the codebase.
- **Metrics**: Tracks engagement (velocity, retweets) to assign a raw impact score.

### Trend Ranker
- **Function**: Scores candidates by `Velocity * Engagement * RegionalWeight`.
- **Clustering**: Deduplicates similar stories using semantic similarity embeddings.
- **Queue**: Pushes top candidates to Redis `verification_queue`.

### Verifier
- **Agent**: Gemini 2.5 Flash.
- **Protocol**: 
  1. Expand query with synonyms.
  2. Search Google/News for corroboration.
  3. Require >= 2 independent sources.
  4. If < 2 sources, flag as "Developing".

### Brief Writer
- **Output**: Neutral, concise summary (120-220 words).
- **Format**: Headline, Key Points, Regional Context, Citations.
- **Variants**: Generates English (primary) and Swahili (optional).

### Publisher
- **Platform**: X (Twitter) + Web Feed.
- **Format**: Headline + Hashtags + Link + AI Image.
- **Constraint**: Respects rate limits (posts every 15-30 mins max).

## 2. Infrastructure & Storage

### Schema (PostgreSQL)
```sql
CREATE TABLE topics (
    id UUID PRIMARY KEY,
    query_string TEXT,
    first_seen TIMESTAMP,
    velocity_score FLOAT
);

CREATE TABLE articles (
    id UUID PRIMARY KEY,
    topic_id UUID REFERENCES topics(id),
    headline TEXT,
    summary TEXT,
    status VARCHAR(20), -- 'published', 'developing'
    verification_score INT,
    region VARCHAR(50),
    category VARCHAR(50),
    image_url TEXT,
    published_at TIMESTAMP
);

CREATE TABLE sources (
    id UUID PRIMARY KEY,
    article_id UUID REFERENCES articles(id),
    url TEXT,
    title TEXT
);
```

### Caching (Redis)
- `tweet:{id}`: TTL 24h (Deduplication)
- `rate_limit:x_api`: Counter (Backoff management)

## 3. X Account Integration

### Setup
1. **Create Account**: @BoldBriefing (or similar).
2. **Developer Portal**: Apply for Elevated access (needed for Search/Stream).
3. **Credentials**:
   - `X_API_KEY`
   - `X_API_SECRET`
   - `X_ACCESS_TOKEN`
   - `X_ACCESS_TOKEN_SECRET`

### Python Publisher Stub
```python
import tweepy
import os

def publish_to_x(article):
    client = tweepy.Client(
        consumer_key=os.getenv("X_API_KEY"),
        consumer_secret=os.getenv("X_API_SECRET"),
        access_token=os.getenv("X_ACCESS_TOKEN"),
        access_token_secret=os.getenv("X_ACCESS_TOKEN_SECRET")
    )

    text = f"{article['headline']}\n\n{article['hashtags']}\n\nRead more: boldbriefing.com/a/{article['id']}"
    
    # Upload Image first if exists
    media_id = None
    if article.get('image_path'):
        auth = tweepy.OAuth1UserHandler(...)
        api = tweepy.API(auth)
        media = api.media_upload(filename=article['image_path'])
        media_id = media.media_id

    response = client.create_tweet(text=text, media_ids=[media_id] if media_id else None)
    return response.data
```

## 4. Deployment

### Stack
- **Compute**: AWS ECS / Google Cloud Run / DigitalOcean App Platform.
- **Database**: Managed PostgreSQL.
- **Queue**: Managed Redis.
- **Scheduler**: Cloud Scheduler triggering the Ingestor every 15 mins.

### Environment Variables
```bash
# AI
GEMINI_API_KEY=...

# Social
X_API_KEY=...
X_API_SECRET=...
X_ACCESS_TOKEN=...
X_ACCESS_TOKEN_SECRET=...

# Data
DATABASE_URL=postgres://...
REDIS_URL=redis://...
```
