"use client";

import { useEffect, useState } from "react";

export default function AdminUsersPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    return (
        <main className="p-6">
            <div className="mx-auto max-w-5xl">
                <h1 className="text-3xl font-semibold">Vartotojų valdymas</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Čia vėliau rodysime visus vartotojus, jų statusą ir veiksmus.
                </p>

                <div className="mt-6 rounded-xl border p-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Kraunama...</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Sekantis žingsnis: prisijungsime prie DB ir įkelsime lentelę.
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
