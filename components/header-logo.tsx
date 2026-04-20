import Link from 'next/link'
import Image from 'next/image'

export const HeaderLogo = () => {
    return (
        <Link href="/">
            <div className='items-center hidden lg:flex'>
                <Image src="/logo.png" alt="Logo" width={681} height={681} className="h-7 w-auto" loading="eager" />
                <p className='text-lg font-bold text-white ml-2'>
                    Money Tracker
                </p>
            </div>
        </Link>
    )
}
