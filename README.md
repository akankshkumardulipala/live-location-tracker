# LiveTrack — Live Location Tracker

A self-hostable live GPS sharing web app with a responsive dashboard, session-based sign-in, an interactive Leaflet map, and temporary code-based sharing rooms.

## Privacy

Location sharing starts only after a user clicks **Start sharing location** and grants browser GPS permission. The owner can stop sharing at any time. Coordinates are relayed live and are not stored in a database. Share the active code only with people you trust.

## Features

- Responsive dashboard for desktop and mobile
- Environment-configured sign-in
- Browser GPS permission and explicit Start/Stop controls
- Random 8-character code for active sharing
- Live map with Leaflet and OpenStreetMap
- No GPS history database

## Requirements

- Node.js 18 or later
- npm

## Run locally

1. Clone the repository and open the folder:

   ```bash
   git clone https://github.com/akankshkumardulipala/live-location-tracker.git
   cd live-location-tracker
   npm install
   ```
2. Copy `.env.example` to `.env` and set a unique strong `APP_PASSWORD` and long random `SESSION_SECRET`.
3. Start the app:

   ```bash
   npm start
   ```
4. Open http://localhost:6589. Sign in with your configured username and password.

## Environment variables

| Variable | Description |
| --- | --- |
| `APP_USERNAME` | Login username; defaults to `admin` |
| `APP_PASSWORD` | Required password; choose a unique, strong value |
| `SESSION_SECRET` | Required long random session secret |
| `NODE_ENV` | Set to `production` behind HTTPS |
| `PORT` | Hosting port; defaults to `6589` |

Never commit your real `.env` file or place passwords in source code.

## Deploy online

Deploy this as a **Node.js web service**, not a static-only site, because the app uses Express and Socket.IO. Use a host that supports WebSockets.

1. Connect this GitHub repository to your Node.js hosting provider.
2. Build command: `npm install`; start command: `npm start`.
3. Set `APP_USERNAME`, `APP_PASSWORD`, `SESSION_SECRET`, and `NODE_ENV=production` in the host's environment settings.
4. Use the host's HTTPS URL; browser geolocation generally requires HTTPS (except localhost).
5. Test from two browser sessions: sign in to both, start sharing in one, and join using the active code in the other.

## Limitations

Sharing rooms and sessions are held in server memory. Restarting the server ends active rooms. The app is intended as a small self-hosted demo, not a high-security location service. Use only with informed consent. Follow OpenStreetMap's tile usage policy.

## License

MIT
