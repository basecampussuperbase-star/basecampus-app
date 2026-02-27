import { createClient } from '@/lib/supabase/server';
import { Plus, Link as LinkIcon, Eye, ShoppingCart, Trash2, Power } from 'lucide-react';
import Link from 'next/link';
import CreateLinkDialog from './CreateLinkDialog';
import { toggleLinkStatus, deleteLink } from './actions';
import { redirect } from 'next/navigation';

export default async function SalesDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Fetch user's links
    const { data: links } = await supabase
        .from('payment_links')
        .select('*, course:courses(title, price)')
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

    // Fetch user's courses for the dropdown
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title, price')
        .eq('mentor_id', user.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ventas y Enlaces</h2>
                    <p className="text-muted-foreground">Gestiona tus enlaces de pago y monitorea el rendimiento.</p>
                </div>
                <CreateLinkDialog courses={courses || []} />
            </div>

            <div className="rounded-md border border-border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Curso</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tag Vendedor</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Precio Ref.</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vistas</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ventas</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {links?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                        No has creado enlaces de pago aún.
                                    </td>
                                </tr>
                            ) : (
                                links?.map((link) => (
                                    <tr key={link.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{link.course.title}</td>
                                        <td className="p-4 align-middle">
                                            {link.seller_tag ? (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{link.seller_tag}</span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-- Directo --</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle">
                                            ${link.price_override || link.course.price}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-3 w-3 text-muted-foreground" /> {link.views}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-1 font-semibold text-green-600">
                                                <ShoppingCart className="h-3 w-3" /> {link.sales_count}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <form action={async () => {
                                                'use server';
                                                await toggleLinkStatus(link.id, !link.active);
                                            }}>
                                                <button className={`text-xs px-2 py-1 rounded-full border ${link.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                    {link.active ? 'Activo' : 'Inactivo'}
                                                </button>
                                            </form>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/enroll/${link.id}`}
                                                    target="_blank"
                                                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                                    title="Ver Landing Page"
                                                >
                                                    <LinkIcon className="h-4 w-4" />
                                                </Link>
                                                <form action={async () => {
                                                    'use server';
                                                    await deleteLink(link.id);
                                                }}>
                                                    <button className="p-2 text-muted-foreground hover:text-red-500 transition-colors" title="Eliminar">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
