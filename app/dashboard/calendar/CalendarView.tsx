'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Video, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, startOfMonth, endOfMonth, eachWeekOfInterval, addMonths, subMonths, isToday } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

interface Event {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource: string;
    status: string;
    modality?: string;
    courseId?: string;
}

export default function CalendarView({ initialEvents }: { initialEvents: any[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>(initialEvents.map(e => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end)
    })));

    // Calendar Navigation
    const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
    const today = () => setCurrentDate(new Date());

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));


    // Weekly Grid Data
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Hours (6 AM to 10 PM)
    const hours = Array.from({ length: 17 }, (_, i) => i + 6);

    // Event Helpers
    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(event.start, day));
    };

    const getEventStyle = (event: Event) => {
        // Calculate position and height based on time
        const startHour = event.start.getHours();
        const startMin = event.start.getMinutes();
        const endHour = event.end.getHours();
        const endMin = event.end.getMinutes();

        const top = (startHour - 6) * 60 + startMin; // minutes from 6 AM
        const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

        // Colors based on modality
        let bgColor = 'bg-blue-100 border-blue-200 text-blue-800';
        if (event.modality === 'in-person') bgColor = 'bg-purple-100 border-purple-200 text-purple-800';
        if (event.modality === 'hybrid') bgColor = 'bg-orange-100 border-orange-200 text-orange-800';

        return {
            top: `${top}px`, // 1px per minute height scale? Too tall. Let's say 60px per hour => 1px per min.
            height: `${duration}px`,
            className: `absolute w-[95%] left-1 rounded-md border p-1 text-xs overflow-hidden hover:z-10 hover:shadow-md transition-all cursor-pointer ${bgColor}`
        };
    };

    return (
        <div className="flex h-full">
            {/* Sidebar - Mini Calendar */}
            <div className="w-64 border-r border-border bg-muted/10 p-4 flex flex-col gap-6 hidden md:flex">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </span>
                        <div className="flex gap-1">
                            <button onClick={prevMonth} className="p-1 hover:bg-muted rounded"><ChevronLeft className="h-4 w-4" /></button>
                            <button onClick={nextMonth} className="p-1 hover:bg-muted rounded"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                    </div>
                    {/* Mini Month Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                            <div key={i} className="text-muted-foreground font-medium py-1">{day}</div>
                        ))}
                        {eachDayOfInterval({
                            start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
                            end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
                        }).map((day, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentDate(day)}
                                className={`
                                    py-1 rounded-md hover:bg-muted transition-colors
                                    ${!isSameMonth(day, currentDate) ? 'text-muted-foreground/30' : ''}
                                    ${isSameDay(day, currentDate) ? 'bg-primary text-primary-foreground font-bold' : ''}
                                    ${isToday(day) && !isSameDay(day, currentDate) ? 'text-primary font-bold' : ''}
                                `}
                            >
                                {format(day, 'd')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters / Legend */}
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leyenda</h3>
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span>Online (En Vivo)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span>Presencial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span>Híbrido</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Weekly View */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header Toolbar */}
                <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
                    <div className="flex items-center gap-4">
                        <button onClick={today} className="text-sm font-medium border border-input px-3 py-1.5 rounded-md hover:bg-muted">
                            Hoy
                        </button>
                        <div className="flex items-center gap-1">
                            <button onClick={prevWeek} className="p-1.5 hover:bg-muted rounded-full"><ChevronLeft className="h-5 w-5" /></button>
                            <button onClick={nextWeek} className="p-1.5 hover:bg-muted rounded-full"><ChevronRight className="h-5 w-5" /></button>
                        </div>
                        <h2 className="text-lg font-semibold capitalize">
                            {format(weekStart, 'MMMM yyyy', { locale: es })}
                        </h2>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Semana {format(weekStart, 'wo')}
                    </div>
                </div>

                {/* Scrollable Grid */}
                <div className="flex-1 overflow-y-auto relative no-scrollbar">
                    <div className="flex min-w-[800px]">
                        {/* Time Column */}
                        <div className="w-16 flex-shrink-0 border-r border-border bg-muted/5 sticky left-0 z-20">
                            <div className="h-10 border-b border-border bg-muted/10 sticky top-0 z-30"></div> {/* Header spacer */}
                            {hours.map(hour => (
                                <div key={hour} className="h-[60px] border-b border-border/50 text-xs text-muted-foreground text-right pr-2 pt-2 relative">
                                    {hour}:00
                                </div>
                            ))}
                        </div>

                        {/* Days Columns */}
                        <div className="flex-1 grid grid-cols-7 divide-x divide-border">
                            {weekDays.map(day => (
                                <div key={day.toISOString()} className="flex flex-col min-w-[120px]">
                                    {/* Header */}
                                    <div className={`
                                        h-10 border-b border-border bg-card flex flex-col items-center justify-center sticky top-0 z-10
                                        ${isToday(day) ? 'bg-primary/5' : ''}
                                    `}>
                                        <span className={`text-xs font-medium uppercase ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {format(day, 'EEE', { locale: es })}
                                        </span>
                                        <div className={`
                                            h-7 w-7 flex items-center justify-center rounded-full text-sm font-bold mt-[-2px]
                                            ${isToday(day) ? 'bg-primary text-primary-foreground' : ''}
                                        `}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>

                                    {/* Event Area */}
                                    <div className="flex-1 relative bg-background h-[1020px]"> {/* 17 hours * 60px */}
                                        {/* Grid lines */}
                                        {hours.map(hour => (
                                            <div key={hour} className="h-[60px] border-b border-border/30"></div>
                                        ))}

                                        {/* Events */}
                                        {getEventsForDay(day).map(event => {
                                            const style = getEventStyle(event);
                                            return (
                                                <div
                                                    key={event.id}
                                                    style={{ top: style.top, height: style.height }}
                                                    className={style.className}
                                                >
                                                    <div className="font-semibold truncate">{event.title}</div>
                                                    <div className="flex items-center gap-1 mt-0.5 truncate opacity-90">
                                                        {event.modality === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                                        <span>{event.resource?.replace('Online', '')}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
