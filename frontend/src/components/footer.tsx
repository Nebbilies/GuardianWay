export default function Footer() {
    return (
        <footer className={'py-2 sm:py-4 bg-foreground text-background text-center'}>
            <div className={'container mx-auto px-4 sm:px-6 lg:px-8'}>
                <p className={'text-sm sm:text-base'}>&copy; {new Date().getFullYear()} GuardianWay. All rights reserved.</p>
                <div className={'flex justify-center gap-4 mt-2'}>
                    <a href={'/privacy'} className={'text-sm text-background/70 hover:text-background transition-colors'}>
                        Chính sách bảo mật
                    </a>
                    <a href={'/terms'} className={'text-sm text-background/70 hover:text-background transition-colors'}>
                        Điều khoản dịch vụ
                    </a>
                </div>
            </div>
        </footer>
    )
}