export default function PendingPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md rounded-xl border p-6 text-center">
                <h1 className="text-2xl font-semibold">Waiting for Approval</h1>
                <p className="mt-4 text-sm text-muted-foreground">
                    Your account is still pending approval from the administrator. Once you receive access, you will be able to use the system.
                </p>
            </div>
        </main>
    );
}
