import Link from 'next/link'
import Image from 'next/image'

export const HeaderLogo = () => {
    return (
        <Link href="/">
            <div className='flex items-center hover:opacity-90 transition-opacity'>
                <Image src="/logo.png" alt="Logo" width={681} height={681} className="h-7 w-auto" loading="eager" />
                <p className='text-xl font-bold text-white ml-2.5 tracking-tight'>
                    Money Tracker
                </p>
            </div>
        </Link>
    )
}