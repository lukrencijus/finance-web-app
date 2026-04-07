import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getCurrentDbUser() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const clerkUser = await currentUser();

    if (!clerkUser) {
        redirect("/sign-in");
    }

    const email =
        clerkUser.emailAddresses[0]?.emailAddress ?? "";

    const name =
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null;

    const existingUser = await prisma.user.findUnique({
        where: { clerkId: userId },
    });

    if (!existingUser) {
        const usersCount = await prisma.user.count();
        const isFirstUser = usersCount === 0;

        return await prisma.user.create({
            data: {
                clerkId: userId,
                email,
                name,
                role: isFirstUser ? "ADMIN" : "USER",
                status: isFirstUser ? "ACTIVE" : "PENDING",
            },
        });
    }

    return existingUser;
}

export async function getCurrentAdminUser() {
    const user = await getCurrentDbUser();

    if (user.role !== "ADMIN") {
        redirect("/");
    }

    return user;
}
