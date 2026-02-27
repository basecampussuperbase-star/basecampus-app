'use client';

import { useEffect, useState } from 'react';
import { getLatestExchangeRate } from '@/app/dashboard/finance/actions';

export default function PriceDisplay({ priceUSD }: { priceUSD: number }) {
    const [rate, setRate] = useState<number | null>(null);

    useEffect(() => {
        getLatestExchangeRate().then(data => {
            if (data) setRate(data.rate);
        });
    }, []);

    if (priceUSD === 0) return <span className="text-xl font-bold text-emerald-600">Gratis</span>;

    const priceBs = rate ? (priceUSD * rate).toFixed(2) : '---';

    return (
        <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-1">
                <span className="text-xs font-medium text-muted-foreground mr-1">Bs.</span>
                <span className="text-3xl font-bold text-foreground tracking-tight">{priceBs}</span>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
                Ref. ${priceUSD.toFixed(2)} USD
            </div>
        </div>
    );
}
