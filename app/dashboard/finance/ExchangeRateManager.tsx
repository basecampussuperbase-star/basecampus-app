'use client';

import { useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { updateExchangeRate } from './actions';

export default function ExchangeRateManager({ initialRate, userRole }: { initialRate: any, userRole: string }) {
    const [rate, setRate] = useState(initialRate?.rate || 0);
    const [newRate, setNewRate] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(initialRate?.effective_date ? new Date(initialRate.effective_date).toLocaleDateString() : 'N/A');

    const handleUpdate = async () => {
        if (!newRate || isNaN(Number(newRate))) return;
        setIsUpdating(true);

        const result = await updateExchangeRate(Number(newRate));

        if (result.success) {
            setRate(Number(newRate));
            setNewRate('');
            setLastUpdated(new Date().toLocaleDateString());
            // Ideally toast success
            alert('Tasa actualizada correctamente.');
        } else {
            alert(result.error);
        }
        setIsUpdating(false);
    };

    if (userRole !== 'admin') {
        return (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Tasa del Día (BCV)</p>
                        <p className="text-xl font-bold text-emerald-900">
                            {Number(rate).toFixed(2)} Bs/$
                        </p>
                    </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                    Actualizado: {lastUpdated}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Gestión de Tasa de Cambio</h3>
                        <p className="text-sm text-muted-foreground">Actual: <span className="font-bold text-foreground">{Number(rate).toFixed(2)} Bs/$</span></p>
                    </div>
                </div>
                <span className="text-xs text-muted-foreground">Última: {lastUpdated}</span>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">Bs.</span>
                    <input
                        type="number"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        placeholder="Nueva Tasa (ej: 40.50)"
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={isUpdating || !newRate}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                    {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Actualizar'}
                </button>
            </div>
        </div>
    );
}
