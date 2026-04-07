import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { SignUp, ClerkLoaded, ClerkLoading } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-2xl font-bold">Create an Account</h1>
            <p className="mt-2 text-sm text-gray-600">
              Join us to get started.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <ClerkLoading>
              <Loader2 className="animate-spin text-muted-foreground" />
            </ClerkLoading>
            <ClerkLoaded>
              <SignUp />
            </ClerkLoaded>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex bg-blue-600 items-center justify-center">
        <Image src="/logo.svg" alt="Logo" width={200} height={200} className="animate-pulse" priority />
      </div>

    </div>
  )
}
