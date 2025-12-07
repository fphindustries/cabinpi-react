/**
 * Formats a Date object to YYYY-MM-DD format
 * @param date - The date to format
 * @returns The formatted date string in YYYY-MM-DD format
 */
export const formatDateOnly = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

/**
 * Formats a Pacific time date string (without timezone) for chart display
 * Database stores timestamps in Pacific time but without timezone info
 * @param pacificDateString - The date string from the database (in Pacific time)
 * @returns Formatted date string in M/D, HH:MM format
 */
export const formatChartDate = (pacificDateString: string): string => {
	// The database stores dates in Pacific time but without timezone info
	// When JavaScript parses ISO-like strings, it treats them as UTC (with 'Z' or offset)
	// or local time (without 'Z' or offset)

	// For SQLite datetime strings like "2024-12-06 08:00:00",
	// JavaScript's Date constructor will parse them as local time
	// But we want to treat them as Pacific time and display as Pacific time

	// Parse as if it's a local datetime string (no timezone conversion)
	// Then format it directly
	const date = new Date(pacificDateString.replace(' ', 'T'));

	// Get the components directly without timezone conversion
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');

	return `${month}/${day}, ${hours}:${minutes}`;
};
