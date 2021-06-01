# SHAWARMAHASH

SH is 2 parts:
- Server
- Preact Webapp (like React but better)

## Quickstart

### SERVER
To run the server...

1. `cd` into the `server` directory and install the various dependencies you need:

```
yarn install
```

2. Compile the server:

```
yarn run build
```

3. Run the server:

```
yarn run server
```

If this is the first run or no blocks have been found, it may complain about being unable to load the current chain. You can ignore it.

Otherwise it will load the saved blockchain from `server/data/chain`, which has been compressed and will be unreadable to humans.

The Server serves assets from `static/`, including `index.html` and `index.js`. When running, it is visible at `https://localhost:8080`.

### Web UI

Building those assets is very similar to building the server:

```
cd ./webui
yarn install
yarn run build
```

## What is Shawarmahash?

SH is a distracting website where users crunch SHA1 hashes for useless internet points. There are no cryptocurrencies involved, and running SH will not earn any bitcoins or whatever.

SH is the successor to Shawarmaspin, a simple web chat room where users earned points for staying connected to a websocket. But Shawarmaspin suffered from a bad workload: the server had to maintain scores and websockets and do all the work, while the user could open a million chrome tabs and churn points.

So SH requires the browser do POW for points.

When you visit SH you will eventually see a spinning Shawarma meat cooker, but for now it's a simple webapp. To being mining, click Start Mining. You can change your name and team at any time, and any blocks you mine subsequently will have that ID.