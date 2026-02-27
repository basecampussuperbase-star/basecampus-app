import Link from 'next/link';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    CreditCard,
    Settings,
    LogOut,
    Users,
    ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming utils exists

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-secondary/30">
            {/* Sidebar - Desktop */}
            <aside className="hidden w-64 border-r border-border bg-card md:flex md:flex-col">
                <div className="flex h-16 items-center border-b border-border px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
                        BASE<span className="text-wine">.</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <nav className="flex flex-col gap-2 space-y-1">
                        <NavItem href="/dashboard" icon={LayoutDashboard}>Inicio</NavItem>
                        <NavItem href="/dashboard/courses" icon={BookOpen}>Mis Cursos</NavItem>
                        <NavItem href="/dashboard/calendar" icon={Calendar}>Calendario</NavItem>
                        <NavItem href="/dashboard/students" icon={Users}>Alumnos</NavItem>
                        <NavItem href="/dashboard/bookings" icon={BookOpen}>Solicitudes</NavItem>
                        <NavItem href="/dashboard/sales" icon={ShoppingCart}>Ventas</NavItem>
                        <NavItem href="/dashboard/finance" icon={CreditCard}>Finanzas</NavItem>
                        <NavItem href="/dashboard/settings" icon={Settings}>Configuración</NavItem>
                    </nav>
                </div>
                <div className="border-t border-border pt-4">
                    <form action={async () => {
                        'use server';
                        const { createClient } = await import('@/lib/supabase/server');
                        const supabase = await createClient();
                        await supabase.auth.signOut();
                        const { redirect } = await import('next/navigation');
                        redirect('/login');
                    }}>
                        <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted transition-colors cursor-pointer text-left group">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium group-hover:bg-primary/20">
                                <LogOut className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Cerrar Sesión</span>
                                <span className="text-xs text-muted-foreground">Salir de BASE</span>
                            </div>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 md:hidden">
                    <Link href="/dashboard" className="font-bold text-xl">
                        BASE<span className="text-wine">.</span>
                    </Link>
                    {/* Mobile Menu Trigger would go here */}
                </header>
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavItem({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                // "bg-muted text-foreground" // Active state would be handled here with usePathname
            )}
        >
            <Icon className="h-4 w-4" />
            {children}
        </Link>
    );
}
