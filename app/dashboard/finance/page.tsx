import { CreditCard, DollarSign, TrendingUp } from 'lucide-react';

export default function FinancePage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Finanzas</h2>
                <p className="text-muted-foreground">Gestiona tus ingresos y facturación.</p>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Próximamente</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                    Estamos integrando la pasarela de pagos para Venezuela y el mundo. Pronto verás aquí tus comisiones.
                </p>
            </div>
        </div>
    );
}
