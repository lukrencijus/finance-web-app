import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

type ClerkEvent = {
    type: string;
    data: {
        id: string;
        email_addresses?: { email_address: string }[];
        first_name?: string | null;
        last_name?: string | null;
        image_url?: string | null;
    };
};

export async function POST(req: Request) {
    const payload = await req.text();
    const headerPayload = await headers();

    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Missing svix headers", { status: 400 });
    }

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
        return new Response("Missing webhook secret", { status: 500 });
    }

    const wh = new Webhook(webhookSecret);

    let evt: ClerkEvent;

    try {
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as ClerkEvent;
    } catch (err) {
        console.error("Webhook verification failed:", err);
        return new Response("Invalid signature", { status: 400 });
    }

    if (evt.type === "user.created") {
        const clerkId = evt.data.id;
        const email = evt.data.email_addresses?.[0]?.email_address ?? "";
        const name =
            [evt.data.first_name, evt.data.last_name]
                .filter(Boolean)
                .join(" ") || null;
        const imageUrl = evt.data.image_url ?? null;

        const usersCount = await prisma.user.count();

        const isFirstUser = usersCount === 0;

        await prisma.user.upsert({
            where: { clerkId },
            update: {
                email,
                name,
                imageUrl,
            },
            create: {
                clerkId,
                email,
                name,
                imageUrl,
                role: isFirstUser ? "ADMIN" : "USER",
                status: isFirstUser ? "ACTIVE" : "PENDING",
            },
        });
    }

    return new Response("OK", { status: 200 });
}
