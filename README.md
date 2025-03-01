# Google Maps Sync

A real-time collaborative Google Maps and Street View experience that allows multiple users to explore locations together. When one user takes control, all other connected users follow along, seeing the exact same view in both Google Maps and Street View.

## Features

- Real-time synchronization of Google Maps and Street View across multiple clients
- Single-control system where one user can navigate while others follow
- Ability to transfer control between users
- Seamless integration with Google Maps API
- Live deployment at [google-maps-sync.fly.dev](https://google-maps-sync.fly.dev)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

When multiple users connect to the application, they join the same synchronized session. Only one user can have control at a time, and their navigation actions (panning, zooming, street view movements) are broadcast to all other connected users in real-time. The controlling user can pass control to another user at any time.

## Technologies Used

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), featuring:

- Next.js for the frontend framework
- Real-time WebSocket communication
- Google Maps JavaScript API
- Google Street View API

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Google Street View API](https://developers.google.com/maps/documentation/javascript/streetview)

## Deployment

This application is currently deployed on [Fly.io](https://fly.io) and can be accessed at [google-maps-sync.fly.dev](https://google-maps-sync.fly.dev).

For local deployment, follow the Getting Started instructions above.
