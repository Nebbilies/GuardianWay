# Prisma

The [schema](schema.prisma) and [migrations](migrations/) define the application database. Follow the [local database setup](../../database/README.md) to start PostgreSQL, apply migrations and run the seed.

## Demo seed

Configure the accounts in `backend/.env`. Passwords require at least 12 characters and at most 72 UTF-8 bytes.

| Account | Settings |
| --- | --- |
| Platform administrator | Set `BOOTSTRAP_PLATFORM_EMAIL` and `BOOTSTRAP_PLATFORM_PASSWORD`. |
| School administrator | Set both `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD` to load the demo school and its trips. |
| Parents and drivers | For demo logins, set `DEMO_USER_PASSWORD` before the first seed. Find their emails in the school account list. |

The [demo dataset](seed-demo-data.json) includes registrations and four trips. Filter by **2026-11-16** for the completed and cancelled trips, or **2026-11-23** for the two planned trips (one with passengers, one empty). Rerunning the seed preserves existing passwords, profile edits and trip history.
