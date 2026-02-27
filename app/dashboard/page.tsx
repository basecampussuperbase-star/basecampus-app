import { createClient } from '@/lib/supabase/server';
import { BookOpen, Users, Calendar, TrendingUp } from "lucide-react";
import ExchangeRateManager from './finance/ExchangeRateManager';
import { getLatestExchangeRate } from './finance/actions';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>No autenticado</div>;
    }

    // Fetch User Profile for Name and Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

    const role = profile?.role || 'student';
    const currentRate = await getLatestExchangeRate();
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Hola, Mentor.</h2>
                <p className="text-muted-foreground">Bienvenido a tu centro de comando BASE.</p>
            </div>

            {/* Exchange Rate Widget - Visible to Everyone (Admin edits, others view) */}
            <div className="mb-8 w-full max-w-sm">
                <ExchangeRateManager initialRate={currentRate} userRole={role} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Ingresos Totales" value="$0.00" description="+0% del mes pasado" />
                <StatCard title="Estudiantes Activos" value="0" description="En tus cursos" />
                <StatCard title="Horas Disponibles" value="32h" description="Para reservas este mes" />
                <StatCard title="Cursos Publicados" value="0" description="Activos en la plataforma" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Actividad Reciente</h3>
                    </div>
                    <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                        No hay actividad reciente.
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="font-semibold text-lg">Próxima Reserva</h3>
                        <p className="text-sm text-muted-foreground">Tu agenda de espacios físicos.</p>
                    </div>
                    <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground bg-secondary/50 rounded-lg">
                        Sin reservas agendadas
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, description }: { title: string; value: string; description: string }) {
    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
            </div>
            <div className="mt-2">
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
        </div>
    );
}
