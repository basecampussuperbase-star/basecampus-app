'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, Plus, CheckCircle2, XCircle, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import BookingRequestDialog from './BookingRequestDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { deleteBooking } from './actions';
import { useRouter } from 'next/navigation';

export default function BookingPageClient({ rooms, bookings }: { rooms: any[], bookings: any[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(undefined);
    const [bookingToEdit, setBookingToEdit] = useState<any>(undefined);
    const router = useRouter();

    const handleRequestRoom = (roomId?: string) => {
        setSelectedRoomId(roomId);
        setBookingToEdit(undefined);
        setIsDialogOpen(true);
    };

    const handleEdit = (booking: any) => {
        setBookingToEdit(booking);
        setIsDialogOpen(true);
    };

    const handleDelete = async (bookingId: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
            const result = await deleteBooking(bookingId);
            if (result.success) {
                // Toast or just refresh
                router.refresh();
            } else {
                alert(result.error);
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100';
            case 'confirmed': return 'text-green-600 bg-green-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            default: return 'text-yellow-600 bg-yellow-100';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return 'Confirmada';
            case 'confirmed': return 'Confirmada';
            case 'rejected': return 'Rechazada';
            default: return 'Pendiente';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reservas y Espacios</h2>
                    <p className="text-muted-foreground">Gestiona tus solicitudes de salas y estudios.</p>
                </div>
                <button
                    onClick={() => handleRequestRoom()}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nueva Solicitud
                </button>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                    <div key={room.id} className="border border-border rounded-xl p-6 bg-card hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-lg">{room.name}</h3>
                                    <p className="text-sm text-muted-foreground capitalize">{room.type === 'classroom' ? 'Aula / Salón' : room.type === 'studio' ? 'Estudio' : 'Sala de Reuniones'}</p>
                                </div>
                                <div className="bg-secondary/20 p-2 rounded-full text-secondary-foreground">
                                    <MapPin className="h-4 w-4" />
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Capacidad: <span className="font-medium text-foreground">{room.capacity} personas</span></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Disponibilidad: <span className="font-medium text-foreground">Lunes a Sábado</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-auto">
                            <button
                                onClick={() => handleRequestRoom(room.id)}
                                className="w-full py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors text-sm"
                            >
                                Solicitar Reserva
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* My Bookings List */}
            <div className="space-y-4">
                <h3 className="font-semibold text-xl">Mis Solicitudes</h3>
                <div className="border border-border rounded-lg overflow-hidden bg-card">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-4 py-3">Espacio</th>
                                <th className="px-4 py-3">Curso / Motivo</th>
                                <th className="px-4 py-3">Fecha y Hora</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        No tienes reservas registradas.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking: any) => (
                                    <tr key={booking.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-4 py-3 font-medium">{booking.rooms?.name || 'Sala eliminada'}</td>
                                        <td className="px-4 py-3">{booking.courses?.title || booking.notes || '-'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {format(new Date(booking.start_time), "d 'de' MMMM, HH:mm", { locale: es })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                                                {getStatusLabel(booking.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(booking)}
                                                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(booking.id)}
                                                    className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <BookingRequestDialog
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setBookingToEdit(undefined);
                }}
                bookingRoomId={selectedRoomId} // Pass pre-selected room
                bookingToEdit={bookingToEdit}
            />
        </div>
    );
}

function Users({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    );
}
