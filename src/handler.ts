import type { AppHandler } from "@sauna/apps-runtime";

const DIRS = ["down", "up", "left", "right"];
const SPRITES = ["villager", "filip", "aadil", "madeline", "rafael"];
const WORLD_W = 1672;
const WORLD_H = 941;

function clean(v: unknown, fallback: string, max: number): string {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  return s || fallback;
}

function num(v: unknown, fallback: number, lo: number, hi: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : fallback;
  return Math.max(lo, Math.min(hi, n));
}

function dir(v: unknown): string {
  return typeof v === "string" && DIRS.includes(v) ? v : "down";
}

function sprite(v: unknown): string {
  return typeof v === "string" && SPRITES.includes(v) ? v : "villager";
}

function roster(env: any) {
  return env.sql.query(
    "SELECT id, name, sprite, x, y, dir, moving FROM players",
    [],
  ) as any[];
}

function getPlayer(env: any, id: string) {
  const rows = env.sql.query(
    "SELECT id, name, sprite, x, y, dir, moving FROM players WHERE id = ?",
    [id],
  ) as any[];
  return rows[0] ?? null;
}

function toWire(p: any) {
  return {
    id: p.id,
    name: p.name,
    sprite: p.sprite,
    x: p.x,
    y: p.y,
    dir: p.dir,
    moving: !!p.moving,
  };
}

export default {
  async fetch(_request, _env, _ctx) {
    return new Response("Not found", { status: 404 });
  },

  websocket: {
    async onConnect(connection, env, _ctx) {
      connection.send(
        JSON.stringify({
          type: "state",
          you: connection.id,
          players: roster(env).map(toWire),
        }),
      );
    },

    async onMessage(connection, message, env, _ctx) {
      let m: any;
      try {
        m = JSON.parse(String(message));
      } catch {
        return;
      }
      const now = Date.now();

      if (m.type === "join") {
        const name = clean(m.name, "Anon", 20);
        const sp = sprite(m.sprite);
        const x = num(m.x, 740, 16, WORLD_W - 16);
        const y = num(m.y, 580, 16, WORLD_H - 16);
        const d = dir(m.dir);
        env.sql.exec(
          `INSERT INTO players (id, name, sprite, x, y, dir, moving, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?)
           ON CONFLICT(id) DO UPDATE SET name = excluded.name, sprite = excluded.sprite,
             x = excluded.x, y = excluded.y, dir = excluded.dir, moving = 0, updated_at = excluded.updated_at`,
          [connection.id, name, sp, x, y, d, now],
        );
        env.websocket.broadcast(
          JSON.stringify({ type: "join", id: connection.id, name, sprite: sp, x, y, dir: d, moving: false }),
          { exclude: [connection.id] },
        );
        return;
      }

      if (m.type === "move") {
        const row = getPlayer(env, connection.id);
        if (!row) return;
        const x = num(m.x, row.x, 16, WORLD_W - 16);
        const y = num(m.y, row.y, 16, WORLD_H - 16);
        const d = dir(m.dir);
        const moving = m.moving ? 1 : 0;
        env.sql.exec(
          "UPDATE players SET x = ?, y = ?, dir = ?, moving = ?, updated_at = ? WHERE id = ?",
          [x, y, d, moving, now, connection.id],
        );
        env.websocket.broadcast(
          JSON.stringify({
            type: "move",
            id: connection.id,
            name: row.name,
            sprite: row.sprite,
            x,
            y,
            dir: d,
            moving: !!moving,
          }),
          { exclude: [connection.id] },
        );
        return;
      }

      if (m.type === "chat") {
        const row = getPlayer(env, connection.id);
        if (!row) return;
        const text = clean(m.text, "", 200);
        if (!text) return;
        env.websocket.broadcast(
          JSON.stringify({ type: "chat", id: connection.id, name: row.name, text, ts: now }),
          { exclude: [connection.id] },
        );
        return;
      }
    },

    async onClose(connection, _code, _reason, _wasClean, env, _ctx) {
      const row = getPlayer(env, connection.id);
      if (!row) return;
      env.sql.exec("DELETE FROM players WHERE id = ?", [connection.id]);
      env.websocket.broadcast(JSON.stringify({ type: "leave", id: connection.id }));
    },
  },
} satisfies AppHandler;
