/**
 * Checks whether the money tracker needs a nudge and, if so, sends a push
 * notification via ntfy.sh (https://ntfy.sh/). Meant to be run on a schedule
 * (e.g. weekly via cron) on the server the app is deployed on - it is not
 * wired into the Next.js app itself, no route handler needed.
 *
 * Env vars required (add to .env):
 *   NTFY_TOPIC          - the topic name you subscribed to in the ntfy app
 *   REMINDER_USER_EMAIL - which user's sheets to check (your account's email)
 *
 * Run manually with: npm run reminders
 * Example crontab entry (Mondays at 9am server time):
 *   0 9 * * 1 cd /path/to/finance-web-app && npm run reminders >> reminders.log 2>&1
 */
import { prisma } from "@/lib/prisma"

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

async function main() {
    const topic = process.env.NTFY_TOPIC
    const email = process.env.REMINDER_USER_EMAIL

    if (!topic) {
        console.error("NTFY_TOPIC is not set - see scripts/send-reminders.ts for setup.")
        process.exit(1)
    }
    if (!email) {
        console.error("REMINDER_USER_EMAIL is not set - see scripts/send-reminders.ts for setup.")
        process.exit(1)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        console.error(`No user found for REMINDER_USER_EMAIL=${email}`)
        process.exit(1)
    }

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    let prevMonth = currentMonth - 1
    let prevYear = currentYear
    if (prevMonth <= 0) { prevMonth = 12; prevYear -= 1 }

    const reasons: string[] = []

    // Criterion A: no transaction logged in the current month's sheet for 7+ days
    // (or the sheet doesn't exist / has no transactions at all yet).
    const currentSheet = await prisma.monthlySheet.findUnique({
        where: { month_year_userId: { month: currentMonth, year: currentYear, userId: user.id } },
        include: { transactions: { orderBy: { createdAt: "desc" }, take: 1 } },
    })
    const lastEntry = currentSheet?.transactions[0]?.createdAt ?? null
    if (!lastEntry || now.getTime() - lastEntry.getTime() >= WEEK_MS) {
        reasons.push("No transactions logged in the last 7 days.")
    }

    // Criterion B: previous month's sheet has no capital entries yet.
    const prevSheet = await prisma.monthlySheet.findUnique({
        where: { month_year_userId: { month: prevMonth, year: prevYear, userId: user.id } },
        include: { capitals: { take: 1 } },
    })
    if (!prevSheet || prevSheet.capitals.length === 0) {
        const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
        reasons.push(`Capital for ${MONTH_NAMES[prevMonth - 1]} ${prevYear} hasn't been entered yet.`)
    }

    if (reasons.length === 0) {
        console.log("All caught up - nothing to remind about.")
        return
    }

    const res = await fetch(`https://ntfy.sh/${topic}`, {
        method: "POST",
        headers: {
            Title: "Money tracker reminder",
            Tags: "money_with_wings",
        },
        body: reasons.join("\n"),
    })

    if (!res.ok) {
        console.error(`ntfy request failed: ${res.status} ${await res.text()}`)
        process.exit(1)
    }
    console.log("Reminder sent:", reasons)
}

main()
    .catch((err) => { console.error(err); process.exit(1) })
    .finally(() => prisma.$disconnect())
