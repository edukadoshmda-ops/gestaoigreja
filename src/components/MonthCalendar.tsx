import { Badge } from '@/components/ui/badge';

interface CalendarDay {
    date: number;
    month: 'current' | 'previous' | 'next';
    events?: number;
    isToday?: boolean;
}

interface MonthCalendarProps {
    year: number;
    month: number;
    events?: Array<{ date: string }>;
    onDayClick?: (date: Date) => void;
}

export function MonthCalendar({ year, month, events = [], onDayClick }: MonthCalendarProps) {
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const generateCalendarDays = (): CalendarDay[] => {
        const days: CalendarDay[] = [];
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const daysInPrevMonth = getDaysInMonth(year, month - 1);
        const today = new Date();

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({
                date: daysInPrevMonth - i,
                month: 'previous',
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDate = new Date(year, month, i);
            const dateString = currentDate.toISOString().split('T')[0];
            const dayEvents = events.filter(e => e.date === dateString).length;

            days.push({
                date: i,
                month: 'current',
                events: dayEvents > 0 ? dayEvents : undefined,
                isToday:
                    today.getDate() === i &&
                    today.getMonth() === month &&
                    today.getFullYear() === year,
            });
        }

        // Next month days
        const remainingDays = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: i,
                month: 'next',
            });
        }

        return days;
    };

    const calendarDays = generateCalendarDays();
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const handleDayClick = (day: CalendarDay) => {
        if (day.month !== 'current' || !onDayClick) return;
        const date = new Date(year, month, day.date);
        onDayClick(date);
    };

    return (
        <div className="w-full">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className="text-center text-sm font-semibold text-muted-foreground py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                    <button
                        key={index}
                        onClick={() => handleDayClick(day)}
                        disabled={day.month !== 'current'}
                        className={`
              relative aspect-square p-2 rounded-lg text-sm font-medium transition-all duration-200
              ${day.month === 'current'
                                ? 'hover:bg-primary/10 hover:scale-105 cursor-pointer'
                                : 'text-muted-foreground/40 cursor-not-allowed'
                            }
              ${day.isToday
                                ? 'bg-gradient-to-br from-primary to-secondary text-white font-bold shadow-lg'
                                : ''
                            }
              ${day.events && !day.isToday
                                ? 'bg-primary/5 border border-primary/20'
                                : ''
                            }
            `}
                    >
                        <span className="block">{day.date}</span>
                        {day.events && day.events > 0 && (
                            <Badge
                                className="absolute bottom-1 right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-gradient-to-r from-primary to-secondary"
                            >
                                {day.events}
                            </Badge>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
