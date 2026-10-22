"""Monthly recap — on the 1st at 10:00 Dubai time every linked player who
played that month gets a personal card from the bot (Roman, 2026-10-22).

The auto-send runs only where RECAP_AUTO=1 (the production instance), so the
dev stack never DMs real players. Sending is idempotent through recap_sent,
so a restart on the 1st simply carries on where it stopped.

Manual run, e.g. a test card to yourself:
    python -m backend.recap 2026-09 --to 24062910 --no-snapshot
"""
import argparse
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

from . import queries as q
from . import cards as cards_mod

DUBAI = timezone(timedelta(hours=4))
SEND_HOUR = 10
# If the server was down at 10:00 on the 1st, still send on the next days.
CATCH_UP_DAYS = 3
_CHECK_EVERY = 600  # seconds


async def send_month(month: str, only_tg: int | None = None, force: bool = False,
                     snapshot: bool = True) -> dict:
    """Render and DM the recap for `month` ('YYYY-MM'). Returns a report."""
    recaps = await q.get_month_recaps(month)
    if only_tg is not None:
        recaps = [r for r in recaps if r["telegram_id"] == only_tg]
    already = set() if force else await q.get_recap_sent_ids(month)
    pending = [r for r in recaps if r["player_id"] not in already]
    failures = []

    async def one(r):
        ok, reason = await cards_mod.render_and_send_recap(r, month)
        if ok:
            if only_tg is None:
                await q.mark_recap_sent(month, r["player_id"])
        else:
            failures.append({"name": r["name"], "reason": reason or "unknown"})
            print(f"[recap] {month} player={r['player_id']} {r['name']}: {reason}",
                  file=sys.stderr, flush=True)

    await asyncio.gather(*[one(r) for r in pending], return_exceptions=True)
    # Ranks are snapshotted after the cards render, so this month's "↑3"
    # compares against last month's snapshot, not against itself.
    if snapshot and only_tg is None:
        await q.snapshot_ranks(month)
    report = {"month": month, "eligible": len(recaps), "queued": len(pending),
              "ok": len(pending) - len(failures), "failed": failures}
    print(f"[recap] {report['month']}: {report['ok']}/{report['queued']} sent",
          file=sys.stderr, flush=True)
    return report


def due_month(now: datetime) -> str | None:
    """The month whose recap is due at `now` (Dubai time), else None."""
    if now.day > CATCH_UP_DAYS or (now.day == 1 and now.hour < SEND_HOUR):
        return None
    return q.prev_month(f"{now.year:04d}-{now.month:02d}")


async def auto_loop():
    done: set[str] = set()
    while True:
        try:
            month = due_month(datetime.now(DUBAI))
            if month and month not in done:
                await send_month(month)
                done.add(month)
        except Exception as e:
            print(f"[recap] auto-send failed: {e}", file=sys.stderr, flush=True)
        await asyncio.sleep(_CHECK_EVERY)


def auto_enabled() -> bool:
    return os.getenv("RECAP_AUTO", "0") == "1"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("month", help="YYYY-MM")
    ap.add_argument("--to", type=int, help="send only to this Telegram id (test)")
    ap.add_argument("--force", action="store_true", help="resend even if already sent")
    ap.add_argument("--no-snapshot", action="store_true")
    a = ap.parse_args()

    async def _main():
        await q.ensure_schema()
        print(await send_month(a.month, only_tg=a.to, force=a.force or a.to is not None,
                               snapshot=not a.no_snapshot))
    asyncio.run(_main())
