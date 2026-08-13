import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TIMEZONE = process.env.BIRTHDAY_TZ || 'UTC';
const BIRTHDAYS_PATH =
  process.env.BIRTHDAYS_FILE || path.join(__dirname, '../data/birthdays.json');
const DRY_RUN = process.argv.includes('--dry-run');

function todayMonthDay(timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const month = parts.find((p) => p.type === 'month').value;
  const day = parts.find((p) => p.type === 'day').value;
  return `${month}-${day}`;
}

function loadBirthdays(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function buildMessage(people) {
  const mentions = people.map((p) => p.telegram || p.name);
  const names = mentions.join(', ');
  const emoji = people.length > 1 ? '🎉🎂' : '🎂';
  const verb = people.length > 1 ? 'have birthdays' : 'has a birthday';
  return `${emoji} ${names} ${verb} today! Wishing you a great one! ${emoji}`;
}

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set.');
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }
}

async function main() {
  const birthdays = loadBirthdays(BIRTHDAYS_PATH);
  const today = todayMonthDay(TIMEZONE);
  const todaysPeople = birthdays.filter((p) => p.date === today);

  if (todaysPeople.length === 0) {
    console.log(`No birthdays today (${today}).`);
    return;
  }

  const message = buildMessage(todaysPeople);
  console.log(message);

  if (DRY_RUN) {
    console.log('Dry run: not sending to Telegram.');
    return;
  }

  await sendTelegramMessage(message);
  console.log('Sent to Telegram.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
