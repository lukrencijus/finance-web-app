"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/current-user";

export async function approveUser(userId: string) {
    await getCurrentAdminUser();

    await prisma.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" },
    });

    revalidatePath("/admin/users");
}

export async function makeAdmin(userId: string) {
    await getCurrentAdminUser();

    await prisma.user.update({
        where: { id: userId },
        data: { role: "ADMIN", status: "ACTIVE" },
    });

    revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
    await getCurrentAdminUser();

    await prisma.user.delete({
        where: { id: userId },
    });

    revalidatePath("/admin/users");
}
