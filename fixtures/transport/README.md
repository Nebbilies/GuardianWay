# Registration and trip fixtures (BL-055)

In [Swagger UI](http://localhost:8000/api/docs), open **Service registrations** for registration examples or **Trips** for passenger manifests. The operations marked **(fixture)** show sample responses.

Start the web or mobile development server as usual and open `/fixtures`. In Expo Go use the project's development URL followed by `/--/fixtures`. The preview works with synthetic identities and needs no backend login or database.

[contract.ts](contract.ts) defines the proposed GET responses for both apps. The routes are relative to `/api`. Production backend implementation and provider verification are pending.

| Read | Access and response |
| --- | --- |
| `/service-registrations?page=1&limit=10` | School admin sees the school's registrations. Parents see registrations for their linked students, including all requested service days. Drivers receive 403. The body contains `data` and pagination `metadata`. Page starts at 1. Limit is 1–100. |
| `/bus-trips/{tripId}/passengers` | School admin or the assigned driver sees the trip summary and its passengers, with stop and chronological boarding/alighting events. A known trip with an empty manifest returns 200. Parents and other drivers receive 403. |

Use `fixtureClient(actor).registrations()` or `.passengers(tripId)` during development. For the eventual live integration, `transportClient(get)` takes an authenticated JSON GET function with the same paths. Actor selection belongs only to the fixture.

[demo.json](demo.json) projects the database seed into a fixed fictional school UUID. The two apps use identical IDs. A separately seeded database has its own school UUID. From the repo root, run `node scripts/generate-transport-fixtures.cjs` after editing seed data and `node scripts/generate-transport-fixtures.cjs --check` to check for drift.

The mobile registration form also uses the generated student request permissions and active service points for each direction. Read access and permission to submit are checked separately.
