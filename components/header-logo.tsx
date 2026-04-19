import Link from 'next/link'
import Image from 'next/image'

export const HeaderLogo = () => {
    return (
        <Link href="/">
            <div className='items-center hidden lg:flex'>
                <Image src="/logo.svg" alt="Logo" width={28} height={28} loading="eager" />
                <p className='text-lg font-bold text-white ml-2'>
                    Money Tracker
                </p>
            </div>
        </Link>
    )
}
