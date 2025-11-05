// Shared utility functions

/**
 * Consistently converts various date formats into a Date object.
 * Handles Firestore-like timestamp objects, ISO strings, and Date objects.
 * @param date - The date value to convert.
 * @returns A Date object. Returns a very old date for invalid inputs.
 */
export const toDate = (date: any): Date => {
    if (!date) return new Date(0); 

    // Handle Firestore-like timestamp objects
    if (date._seconds) {
        return new Date(date._seconds * 1000);
    }

    // Handle ISO strings or Date objects
    const d = new Date(date);

    // Check if the date is valid
    if (isNaN(d.getTime())) {
        return new Date(0);
    }
    return d;
}

/**
 * Formats a date object or string into a localized date string (e.g., "10/26/2023").
 * @param dateObj - The date value to format.
 * @returns A formatted date string or 'N/A' for invalid dates.
 */
export const formatDate = (dateObj: any): string => {
    if (!dateObj) return 'N/A';
    const date = toDate(dateObj);
    // Check if toDate returned the "invalid" date
    if (date.getTime() === new Date(0).getTime()) return 'Invalid Date';
    return date.toLocaleDateString();
};
