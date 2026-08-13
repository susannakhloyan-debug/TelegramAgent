# Telegram Birthday Bot

Reminds your Telegram group about team members' birthdays, once a day, via a
scheduled GitHub Actions workflow.

## How it works

1. `data/birthdays.json` lists each team member's name and birthday
   (`MM-DD`, no year).
2. Every day, a GitHub Actions workflow (`.github/workflows/birthday-reminder.yml`)
   runs `src/checkBirthdays.js`.
3. The script compares **tomorrow's** date against the list, so the group
   gets a heads-up one day before each birthday. If anyone's birthday
   matches, it posts a message to your Telegram group via the Bot API. If
   nobody's birthday is tomorrow, it does nothing (no daily noise).

## 1. Create a Telegram bot

1. Open a chat with [@BotFather](https://t.me/BotFather) on Telegram.
2. Send `/newbot` and follow the prompts to name it.
3. BotFather gives you a **bot token** — save it, you'll need it below.
4. Add the bot to your team's Telegram group.
5. In the group, give the bot permission to send messages (if the group
   restricts posting to admins, promote the bot or adjust group settings).

## 2. Get your group's chat ID

1. Send any message in the group (e.g. "hi").
2. Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` in a
   browser, replacing `<YOUR_BOT_TOKEN>` with your real token.
3. Find `"chat":{"id":-123456789,...}` in the response — that negative
   number is your group's chat ID.

## 3. Add repo secrets

In this repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | The token from BotFather |
| `TELEGRAM_CHAT_ID` | The chat ID from step 2 (including the `-` if present) |

## 4. Edit the birthday list

Edit `data/birthdays.json`:

```json
[
  { "name": "Karen Ovsoyan", "date": "09-27" },
  { "name": "Susanna Khloyan", "date": "11-16", "telegram": "@susanna" }
]
```

- `date` is `MM-DD` (zero-padded, no year).
- `telegram` is optional — if set, the reminder message uses `@handle`
  instead of the plain name, so it pings them in the group.

Commit and push changes to this file whenever the team roster changes.

## 5. Adjust the schedule (optional)

By default the workflow runs at `06:00 UTC` daily. Edit the `cron` line and
the `BIRTHDAY_TZ` env var in
`.github/workflows/birthday-reminder.yml` to match your team's timezone —
`BIRTHDAY_TZ` controls which "tomorrow" the script checks against (e.g.
`Asia/Yerevan`, `America/New_York`), while the `cron` value (always UTC)
controls what wall-clock time that corresponds to.

You can also trigger it manually any time from the **Actions** tab via
"Run workflow" (`workflow_dispatch`).

## Running locally

```bash
npm install
TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=xxx npm run check-birthdays

# Preview the message without sending it to Telegram:
npm run check-birthdays -- --dry-run
```

## Project structure

```
src/
  checkBirthdays.js   # loads birthdays, checks tomorrow's date, posts to Telegram
data/
  birthdays.json      # the team's birthdays (MM-DD)
.github/workflows/
  birthday-reminder.yml  # daily cron trigger
```
