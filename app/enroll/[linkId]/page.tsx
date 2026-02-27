import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { processEnrollment, incrementViews } from '../actions';
import { CheckCircle, MapPin, Calendar, Clock, Video, Users, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import PriceDisplay from '@/components/PriceDisplay';

// This is a Server Component
export default async function EnrollPage({ params }: { params: Promise<{ linkId: string }> }) {
    const supabase = await createClient();
    const { linkId } = await params;

    // 1. Fetch Link & Course Details
    const { data: link } = await supabase
        .from('payment_links')
        .select('*, course:courses(*, mentor:profiles(full_name, avatar_url))')
        .eq('id', linkId)
        .single();

    if (!link || !link.active) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                    <h1 className="text-2xl font-bold text-gray-900">Enlace no disponible</h1>
                    <p className="text-muted-foreground mt-2">Este enlace de pago ha expirado o no existe.</p>
                </div>
            </div>
        );
    }

    // Increment View Count (Side effect, non-blocking)
    incrementViews(linkId);

    const course = link.course;
    const finalPrice = link.price_override || course.price;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header / Hero */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    {course.logo_url ? (
                        <img src={course.logo_url} alt="Logo" className="h-8 md:h-10 object-contain" />
                    ) : (
                        <span className="font-bold text-xl tracking-tight">BASE<span className="text-primary">CAMPUS</span></span>
                    )}
                    {link.seller_tag && (
                        <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">Ref: {link.seller_tag}</span>
                    )}
                </div>
            </div>

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 grid md:grid-cols-3 gap-8">
                {/* Left Column: Course Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-200">
                        {course.image_url ? (
                            <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                <Video className="h-16 w-16 opacity-50" />
                            </div>
                        )}
                        {course.is_live && (
                            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-sm">
                                EN VIVO
                            </div>
                        )}
                    </div>

                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">{course.title}</h1>
                        <p className="text-lg text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {course.description || "Un curso transformador diseñado para potenciar tus habilidades."}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-white border shadow-sm">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 shrink-0">
                                {course.modality === 'online' ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Modalidad</h3>
                                <p className="text-sm text-gray-600 capitalize">
                                    {course.modality === 'online' ? '100% Online' : course.modality === 'in-person' ? 'Presencial' : 'Híbrido'}
                                </p>
                                {course.address && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.address}</p>}
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-lg bg-white border shadow-sm">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-50 text-purple-600 shrink-0">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Horario</h3>
                                <div className="text-sm text-gray-600 whitespace-pre-line">
                                    {course.schedule_info ? (
                                        course.schedule_info
                                    ) : (
                                        /* Fallback: Fetch bookings if summary is missing */
                                        async () => {
                                            const { data: bookings } = await supabase
                                                .from('bookings')
                                                .select('start_time, end_time')
                                                .eq('course_id', course.id)
                                                .neq('status', 'cancelled')
                                                .order('start_time', { ascending: true });

                                            if (bookings && bookings.length > 0) {
                                                return bookings.map(b => {
                                                    const d = new Date(b.start_time);
                                                    const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                                    const startStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                                    const endStr = new Date(b.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                                    return <div key={b.start_time}>{dateStr} ({startStr} - {endStr})</div>;
                                                });
                                            }
                                            return "Fechas por definir";
                                        }
                                    )()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mentor Info */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-100/50">
                        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                            {course.mentor?.avatar_url ? (
                                <img src={course.mentor.avatar_url} alt={course.mentor.full_name} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-xl font-bold text-gray-500">{course.mentor?.full_name?.charAt(0) || 'M'}</span>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Instructor</p>
                            <p className="font-bold text-gray-900">{course.mentor?.full_name || 'Mentor BASE'}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Checkout Card */}
                <div className="md:col-span-1">
                    <div className="sticky top-24 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Precio Total</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-gray-900">${finalPrice}</span>
                                    <span className="text-sm text-gray-500 font-medium">USD</span>
                                </div>
                                <div className="mt-2">
                                    <PriceDisplay priceUSD={finalPrice} />
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <div className="space-y-3">
                                {course.features && Array.isArray(course.features) && course.features.length > 0 ? (
                                    course.features.map((feature: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span>Acceso inmediato al contenido</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span>Certificado de finalización</span>
                                        </div>
                                    </>
                                )}
                                {link.whatsapp_group_link && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>Únete al grupo de WhatsApp</span>
                                    </div>
                                )}
                            </div>

                            <form action={async () => {
                                'use server';
                                const res = await processEnrollment(linkId);
                                if (res.success) {
                                    if (res.whatsappLink) {
                                        redirect(`/enroll/success?wa=${encodeURIComponent(res.whatsappLink)}&course=${res.courseId}`);
                                    } else {
                                        redirect(`/dashboard/courses/${res.courseId}`);
                                    }
                                } else {
                                    // Handle error (would need client component for proper toast, 
                                    // for now redirect with error param is simple)
                                    redirect(`/enroll/${linkId}?error=${encodeURIComponent(res.error || 'Unknown error')}`);
                                }
                            }}>
                                <button type="submit" className="w-full bg-primary text-primary-foreground text-lg font-bold py-4 rounded-lg shadow-md hover:bg-primary/90 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
                                    Comprar e Inscribirme <ArrowRight className="h-5 w-5" />
                                </button>
                            </form>

                            <p className="text-xs text-center text-gray-400">
                                Pago seguro y acceso garantizado por Base Campus.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
