# Security Notes

- Runtime inference loads only events, users, and context CSVs.
- Ground truth is evaluation-only and is not loaded by the Flask inference path.
- Sequence lookback is limited to prior events within 60 minutes; future events cannot affect a current result.
- Risk scores are finite and clamped to 0-100.
- CORS is restricted to the two documented local frontend origins.
- Flask debug mode is disabled for normal startup.
- `.env` files, caches, build output, and dependencies are ignored by Git; `.env.example` contains no secrets.
- Event lookup uses an in-memory ID map and does not expose arbitrary file access or command execution.

This is a local deterministic MVP, not an authenticated production service. Automated enforcement, persistent audit storage, and continuous learning are future extensions.
