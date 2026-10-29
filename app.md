---
name: wordwarehq
description: Multiplayer pixel office mini-game. Move around, see everyone live.
manifest_version: 1
enabled: true
visibility: public
---
# WordwareHQ

A multiplayer pixel office. Pick a character, walk around, see who else is online, and chat over a bubble or the chat panel.

## Surface

- `/` serves the client (`public/index.html`) and sprites/map under `public/`.
- `/ws` is the realtime channel. Anonymous connections are allowed (`visibility: public`).

## Realtime protocol

Client → server: `join {name, sprite, x, y, dir}`, `move {x, y, dir, moving}`, `chat {text}`.
Server → client: `state {you, players[]}` on connect, then `join`, `move`, `leave`, `chat {id, name, text, ts}` broadcasts.

Presence lives in the `players` table, keyed by connection id. A row is removed on socket close.

## Not wired yet

- The Vestaboard, Slack DM and slot-jackpot buttons post to the existing `slack-relay` app at `https://slack-relay-pelhl5ly.sauna.new/public/...`. They only work while that relay is up.
- The office lights panel is UI only. The Hue API is not connected.
- Chat history is not persisted. A new visitor sees only messages sent while they are online.
