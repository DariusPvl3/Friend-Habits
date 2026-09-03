import { Habit } from "@/types";

export const calculateUserStats = (
    habits: Habit[], 
    progressHistory: Record<string, number> = {}, 
    accountCreatedAt?: Date | null,
    currentUid?: string,
    isFriend: boolean = false
) => {
    let longestStreak = 0;
    let topHabitName = "No streak yet";

    habits.forEach(habit => {
        if(habit.streak > longestStreak) {
            longestStreak = habit.streak;
            let shouldMask = false;

            // If the viewer doesn't own this habit, check privacy rules
            if (habit.userId !== currentUid) {
                if (habit.visibility === 'Private') {
                    shouldMask = true; // Always hide Private from everyone else
                } else if (habit.visibility === 'Friends' && !isFriend) {
                    shouldMask = true; // Hide Friends-only from strangers
                }
            }

            topHabitName = shouldMask ? 'Secret Habit' : habit.title;
        }
    });
    const progressValues = Object.values(progressHistory);
    let averageProgress = 0;
    
    if (progressValues.length > 0) {
        const sum = progressValues.reduce((a, b) => a + b, 0);
        let daysToAverage = progressValues.length;
        
        if (accountCreatedAt) {
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            const created = new Date(accountCreatedAt);
            created.setHours(0, 0, 0, 0); // Normalize to midnight
            
            const msPerDay = 1000 * 60 * 60 * 24;
            const daysSinceCreation = Math.floor((today.getTime() - created.getTime()) / msPerDay) + 1;
            
            // Ensure we divide by the days since they joined, not just the days they were active
            daysToAverage = Math.max(daysSinceCreation, 1);
        }
        
        const decimalAverage = sum / daysToAverage;
        averageProgress = parseFloat((decimalAverage * 100).toFixed(2));
    }

    let totalCompletions = 0;
    habits.forEach(habit => {
        if(habit.history){
            totalCompletions += Object.values(habit.history).filter(status => status === 'completed').length;
        }
    });

    const perfectDays = progressValues.filter(val => val === 1).length;

    return { longestStreak, topHabitName, averageProgress, totalCompletions, perfectDays };
}

export const generateChartData = (
    timeframe: 'week' | 'month' | 'year', 
    progressHistory: Record<string, number> = {}, 
    accountCreatedAt?: Date | null,
    periodOffset: number = 0
) => {
    const labels: string[] = [];
    const data: number[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let createdDate = new Date(2000, 0, 1);
    if (accountCreatedAt) {
        createdDate = new Date(accountCreatedAt);
        createdDate.setHours(0, 0, 0, 0);
    }

    // Helper to safely format local date strings (bypasses timezone bugs)
    const getLocalDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    let totalProgressSum = 0;
    let validDaysCount = 0;
    let perfectDaysCount = 0;
    let periodLabel = "";

    if (timeframe === 'week') {
        const currentDayOfWeek = today.getDay();
        const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        
        const targetMonday = new Date(today);
        targetMonday.setDate(today.getDate() - distanceToMonday - (periodOffset * 7));
        
        const targetSunday = new Date(targetMonday);
        targetSunday.setDate(targetMonday.getDate() + 6);
        
        const monthShort = targetMonday.toLocaleDateString('en-US', { month: 'short' });
        periodLabel = periodOffset === 0 ? "This Week" : `${monthShort} ${targetMonday.getDate()} - ${targetSunday.getDate()}`;

        for (let i = 0; i < 7; i++) {
            const d = new Date(targetMonday);
            d.setDate(targetMonday.getDate() + i);
            labels.push(d.toLocaleDateString('en-US', { weekday: 'narrow' }));

            if (d.getTime() >= createdDate.getTime() && d.getTime() <= today.getTime()) {
                validDaysCount++;
                const dateStr = getLocalDateStr(d);
                const rawValue = progressHistory[dateStr] || 0;
                
                if (rawValue === 1) perfectDaysCount++;
                totalProgressSum += rawValue;
                data.push(Number((rawValue * 100).toFixed(1)));
            } else {
                data.push(0);
            }
        }
    } 
    else if (timeframe === 'month') {
        const currentDayOfWeek = today.getDay();
        const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        
        const targetMonday = new Date(today);
        targetMonday.setDate(today.getDate() - distanceToMonday - (periodOffset * 28));
        
        periodLabel = periodOffset === 0 ? "Last 4 Weeks" : `${periodOffset * 4} Weeks Ago`;

        for (let i = 3; i >= 0; i--) {
            labels.push(`W${4 - i}`); 
            let weeklySum = 0;
            let validDaysInWeek = 0; 
            
            const weekMonday = new Date(targetMonday);
            weekMonday.setDate(targetMonday.getDate() - (i * 7));
            
            for (let j = 0; j < 7; j++) {
                const targetDate = new Date(weekMonday);
                targetDate.setDate(weekMonday.getDate() + j);
                
                if (targetDate.getTime() >= createdDate.getTime() && targetDate.getTime() <= today.getTime()) {
                    validDaysInWeek++;
                    validDaysCount++; 
                    
                    const dateStr = getLocalDateStr(targetDate);
                    const rawValue = progressHistory[dateStr] || 0;
                    
                    if (rawValue === 1) perfectDaysCount++;
                    totalProgressSum += rawValue;
                    weeklySum += rawValue;
                }
            }
            
            const percentage = validDaysInWeek > 0 ? (weeklySum / validDaysInWeek) * 100 : 0;
            data.push(Number(percentage.toFixed(1)));
        }
    } 
    else if (timeframe === 'year') {
        const targetYear = today.getFullYear() - periodOffset;
        periodLabel = targetYear.toString();

        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const targetMonth = new Date(targetYear, monthIndex, 1);
            labels.push(targetMonth.toLocaleDateString('en-US', { month: 'narrow' }));
            
            const daysInMonth = new Date(targetYear, monthIndex + 1, 0).getDate();
            let monthlySum = 0;
            let validDaysInMonth = 0; 
            
            for (let day = 1; day <= daysInMonth; day++) {
                const targetDate = new Date(targetYear, monthIndex, day, 0, 0, 0);
                
                // Prevents future days from dragging the average down to 0
                if (targetDate.getTime() >= createdDate.getTime() && targetDate.getTime() <= today.getTime()) {
                    validDaysInMonth++;
                    validDaysCount++;
                    
                    const dateStr = getLocalDateStr(targetDate);
                    const rawValue = progressHistory[dateStr] || 0;
                    
                    if (rawValue === 1) perfectDaysCount++;
                    totalProgressSum += rawValue;
                    monthlySum += rawValue;
                }
            }
            
            const percentage = validDaysInMonth > 0 ? (monthlySum / validDaysInMonth) * 100 : 0;
            data.push(Number(percentage.toFixed(1)));
        }
    }

    // Calculate the exact overall period average directly from the raw valid days
    const periodAverage = validDaysCount > 0 ? Number(((totalProgressSum / validDaysCount) * 100).toFixed(1)) : 0;

    return { 
        labels, 
        datasets: [{ data }], 
        periodLabel, 
        periodAverage, 
        periodPerfectDays: perfectDaysCount 
    };
};