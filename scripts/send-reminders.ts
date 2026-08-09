/**
 * Checks whether the money tracker needs a nudge and, if so, sends a push
 * notification via ntfy.sh (https://ntfy.sh/). Meant to be run on a schedule
 * (e.g. weekly via cron) on the server the app is deployed on - it is not
 * wired into the Next.js app itself, no route handler needed.
 *
 * Recipients are self-service: each user sets their own ntfy topic on the
 * Settings page (User.ntfyTopic). Every ACTIVE user with a topic set gets
 * checked against their own account and notified on their own topic only.
 *
 * Run manually with: npm run reminders
 * Example crontab entry (Mondays at 9am server time):
 *   0 9 * * 1 cd /path/to/finance-web-app && npm run reminders >> reminders.log 2>&1
 */
import { prisma } from "@/lib/prisma"

const INACTIVITY_THRESHOLD_MS = 5 * 24 * 60 * 60 * 1000
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

async function checkAndNotify(userId: string, email: string, topic: string) {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    let prevMonth = currentMonth - 1
    let prevYear = currentYear
    if (prevMonth <= 0) { prevMonth = 12; prevYear -= 1 }

    const reasons: string[] = []

    // Criterion A: no transaction logged in the current month's sheet for 5+ days
    // (or the sheet doesn't exist / has no transactions at all yet).
    const currentSheet = await prisma.monthlySheet.findUnique({
        where: { month_year_userId: { month: currentMonth, year: currentYear, userId } },
        include: { transactions: { orderBy: { createdAt: "desc" }, take: 1 } },
    })
    const lastEntry = currentSheet?.transactions[0]?.createdAt ?? null
    if (!lastEntry || now.getTime() - lastEntry.getTime() >= INACTIVITY_THRESHOLD_MS) {
        reasons.push("No transactions logged in the last 5 days.")
    }

    // Criterion B: previous month's sheet has no capital entries yet.
    const prevSheet = await prisma.monthlySheet.findUnique({
        where: { month_year_userId: { month: prevMonth, year: prevYear, userId } },
        include: { capitals: { take: 1 } },
    })
    if (!prevSheet || prevSheet.capitals.length === 0) {
        reasons.push(`Capital for ${MONTH_NAMES[prevMonth - 1]} ${prevYear} hasn't been entered yet.`)
    }

    if (reasons.length === 0) {
        console.log(`[${email}] All caught up - nothing to remind about.`)
        return
    }

    // Published as JSON (not the topic-in-URL + header form) because HTTP header
    // values must be Latin-1 - a literal emoji in a header throws at runtime.
    // ntfy also only renders tags as emoji when they're a gemoji shortcode
    // (e.g. "money_mouth_face") - a literal emoji character in the tag isn't
    // recognized and shows as plain text instead.
    const res = await fetch("https://ntfy.sh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            topic,
            title: "Money tracker reminder",
            tags: ["money_mouth_face"],
            message: reasons.join("\n"),
        }),
    })

    if (!res.ok) {
        console.error(`[${email}] ntfy request failed: ${res.status} ${await res.text()}`)
        return
    }
    console.log(`[${email}] Reminder sent:`, reasons)
}

async function main() {
    const recipients = await prisma.user.findMany({
        where: { status: "ACTIVE", ntfyTopic: { not: null } },
        select: { id: true, email: true, ntfyTopic: true },
    })

    if (recipients.length === 0) {
        console.log("No users have a reminder topic set (Settings > Reminder notifications).")
        return
    }

    for (const { id, email, ntfyTopic } of recipients) {
        if (!ntfyTopic) continue // narrows the type; filtered out by the query already
        await checkAndNotify(id, email, ntfyTopic)
    }
}

main()
    .catch((err) => { console.error(err); process.exit(1) })
    .finally(() => prisma.$disconnect())
