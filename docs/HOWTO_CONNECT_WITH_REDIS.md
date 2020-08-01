Redis is a caching technology that can greatly speed up the application.  We recommend every
production instance of Spoke to use Redis -- even if it's a very small size -- 'micro' or 'hobby-dev'
will still have a very positive impact on scaling.

# Instructions for using Redis in Development and Production
- To add a caching layer to your development and production environments, follow the below instructions to get setup.

## Development
- Using Redis in development can be achieved by connecting a local Redis server or using 'fake Redis'. Note that fake Redis is an easy to use simulation of Node Redis. Initial Redis setup is included in `src/server/models/thinky.js`.

### To use a Local Redis Server
  - Run `npm install`
  - If not installed, install Redis https://redis.io/
    - Run `redis-server`
    - If correctly installed, this should produce some logging with the Redis logo with the last message saying 'Ready to accept connections'
  - Add `REDIS_URL=//127.0.0.1:6379` to your `.env` file


### To use Fake Redis
  - Run `npm install`
  - Add `FAKE_REDIS=true` to your `.env` file

## Production
- Point REDIS_URL in production environment variables configuration to production Redis instance url. For example `redis://[url]:6379`.
- If you are running on a scale of ~100K contacts or more per-day, then we recommend increasing your redis instance with memory ~ 1kbytes * (number-of-contacts-per-day) and enabling REDIS_CONTACT_CACHE=1
- We recommend setting the "maxmemory policy" to "volatile-lru" -- in the off-chance Redis runs out of memory it will discard the oldest cache data first -- the application should handle this event gracefully as long as there's some discard policy to allow new keys to be added.
