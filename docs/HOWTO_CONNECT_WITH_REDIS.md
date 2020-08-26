# Instructions For Using Redis in Development and Production

[Redis](https://redis.io/) is a caching technology that can greatly speed up the application.
We recommend every production instance of Spoke to use Redis -- even if it's a very small
size -- 'micro' or 'hobby-dev' will still have a very positive impact on scaling.

To add a caching layer to your development and production environments, follow the below instructions to get setup.

## Development
Using Redis in development can be achieved by connecting a local Redis server or using 'fake Redis'.
Note that fake Redis is an easy to use simulation of Node Redis.
Initial Redis setup is included in `src/server/models/thinky.js`.

### To Use a Local Redis Server
1. Run `npm install`
1. If not installed, install Redis (see: https://redis.io/)
1. Run `redis-server`
    - If correctly installed, this should produce some logging with the Redis logo with the last message saying 'Ready to accept connections'

1. Add `REDIS_URL=redis://127.0.0.1:6379` to your `.env` file

### To Use 'Fake Redis'
1. Run `npm install`
1. Add `FAKE_REDIS=true` to your `.env` file

## Production
1. Point `REDIS_URL` in production environment variables configuration to production Redis instance url. For example `redis://[url]:6379`.
1. If you are running on a scale of ~100K contacts or more per-day, then we recommend increasing your redis instance with memory ~ 1kbytes * (number-of-contacts-per-day) and enabling REDIS_CONTACT_CACHE=1
1. We recommend setting the "maxmemory policy" to "volatile-lru" -- in the off-chance Redis runs out of memory it will discard the oldest cache data first -- the application should handle this event gracefully as long as there's some discard policy to allow new keys to be added.

## Running Multiple Spoke Databases On The Same Redis Server
Please note that if you want to run multiple Spoke instances using the same Redis server, then you will need to do one (or both) of the following:

1. Connect to a separate Redis database (there are 16 databases, and if unspecified, you connect to `0` by default)
1. Prefix all of the keys with something unique (such as `dev:` for development and `prod:` for production).

Doing this is simple and prevents multiple Spoke instances from clobbering each other in the cache.

Examples:

* Connect to database `0`:
    ```
    redis://127.0.0.1:6379/0
    ```

* Connect to database `1`:
    ```
    redis://127.0.0.1:6379/1
    ```

* Connect to database `1` and use a prefix for development:
    ```
    redis://127.0.0.1:6379/1?prefix=dev:
    ```

## Redis Maintenance
If you've done some database hacking, there's a good chance that you'll need to "flush" all of the keys in the database:

```
redis-cli -n 0 flushall
```

Here, `-n 0` is which database number to connect to (in this case, `0`).

If you'd like to see all of the keys in the database, you can run:

```
redis-cli -n 0 keys '*'
```

To view the contents of a key, run:

```
redis-cli -n 0 get ${your-key-here}
```

