import {
  format,
  parseISO,
  isValid,
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear
} from 'date-fns';

/**
 * Helper function to get the end of a year
 */
function endOfYear(date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * Parse date expressions like "today", "last month", "ytd", etc.
 * @param {string} dateExpression - The date expression to parse
 * @returns {object} Object with startDate, endDate, and description
 */
function parseDateExpression(dateExpression) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Normalize the date expression
  const normalizedExpression = dateExpression.toLowerCase().trim();

  // Handle relative date expressions
  switch (normalizedExpression) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
        description: 'Today'
      };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
        description: 'Yesterday'
      };
    case 'this week':
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }), // Week starts on Monday
        endDate: endOfDay(now),
        description: 'This week'
      };
    case 'last week':
      const lastWeekStart = subDays(startOfWeek(now, { weekStartsOn: 1 }), 7);
      const lastWeekEnd = subDays(endOfWeek(now, { weekStartsOn: 1 }), 7);
      return {
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
        description: 'Last week'
      };
    case 'this month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfDay(now),
        description: 'This month'
      };
    case 'last month':
      const lastMonth = new Date(currentYear, currentMonth - 1, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth),
        description: 'Last month'
      };
    case 'ytd':
    case 'this ytd':
    case 'this year to date':
    case 'year to date':
      return {
        startDate: startOfYear(now),
        endDate: endOfDay(now),
        description: 'Year to date'
      };
    case 'last year':
      const lastYear = new Date(currentYear - 1, 0, 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear),
        description: 'Last year'
      };
    default:
      // Try to parse as ISO date or other common formats
      try {
        // Check if it's a single date (not a range)
        const parsedDate = parseISO(normalizedExpression);
        if (isValid(parsedDate)) {
          return {
            startDate: startOfDay(parsedDate),
            endDate: endOfDay(parsedDate),
            description: format(parsedDate, 'yyyy-MM-dd')
          };
        }

        // Check if it's a date range in format "YYYY-MM-DD to YYYY-MM-DD"
        const rangeParts = normalizedExpression.split(' to ');
        if (rangeParts.length === 2) {
          const startDate = parseISO(rangeParts[0]);
          const endDate = parseISO(rangeParts[1]);

          if (isValid(startDate) && isValid(endDate)) {
            return {
              startDate: startOfDay(startDate),
              endDate: endOfDay(endDate),
              description: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`
            };
          }
        }

        // If we can't parse it, throw an error
        throw new Error(`Unable to parse date expression: ${dateExpression}`);
      } catch (error) {
        throw new Error(`Invalid date expression: ${dateExpression}. ${error.message}`);
      }
  }
}

/**
 * Format a date for Magento API
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDateForMagento(date) {
  return format(date, "yyyy-MM-dd HH:mm:ss");
}

/**
 * Build date range filter for Magento API
 * @param {string} field - The field name to filter on
 * @param {Date} startDate - Start date of the range
 * @param {Date} endDate - End date of the range
 * @returns {string} URL-encoded filter string
 */
function buildDateRangeFilter(field, startDate, endDate) {
  const formattedStartDate = formatDateForMagento(startDate);
  const formattedEndDate = formatDateForMagento(endDate);

  return [
    `searchCriteria[filter_groups][0][filters][0][field]=${field}`,
    `searchCriteria[filter_groups][0][filters][0][value]=${encodeURIComponent(formattedStartDate)}`,
    `searchCriteria[filter_groups][0][filters][0][condition_type]=gteq`,
    `searchCriteria[filter_groups][1][filters][0][field]=${field}`,
    `searchCriteria[filter_groups][1][filters][0][value]=${encodeURIComponent(formattedEndDate)}`,
    `searchCriteria[filter_groups][1][filters][0][condition_type]=lteq`
  ].join('&');
}

/**
 * Normalize country input to ISO country codes
 * @param {string} country - Country name or code
 * @returns {Array<string>} Array with normalized country code
 */
function normalizeCountry(country) {
  // Normalize the country input (handle both country codes and names)
  const countryInput = country.trim().toLowerCase();

  // Map of common country names to ISO country codes
  const countryMap = {
    // Common variations for The Netherlands
    'netherlands': 'NL',
    'the netherlands': 'NL',
    'holland': 'NL',
    'nl': 'NL',

    // Common variations for United States
    'united states': 'US',
    'usa': 'US',
    'us': 'US',
    'america': 'US',

    // Common variations for United Kingdom
    'united kingdom': 'GB',
    'uk': 'GB',
    'great britain': 'GB',
    'gb': 'GB',
    'england': 'GB',

    // Add more countries as needed
    'canada': 'CA',
    'ca': 'CA',

    'australia': 'AU',
    'au': 'AU',

    'germany': 'DE',
    'de': 'DE',

    'france': 'FR',
    'fr': 'FR',

    'italy': 'IT',
    'it': 'IT',

    'spain': 'ES',
    'es': 'ES',

    'belgium': 'BE',
    'be': 'BE',

    'sweden': 'SE',
    'se': 'SE',

    'norway': 'NO',
    'no': 'NO',

    'denmark': 'DK',
    'dk': 'DK',

    'finland': 'FI',
    'fi': 'FI',

    'ireland': 'IE',
    'ie': 'IE',

    'switzerland': 'CH',
    'ch': 'CH',

    'austria': 'AT',
    'at': 'AT',

    'portugal': 'PT',
    'pt': 'PT',

    'greece': 'GR',
    'gr': 'GR',

    'poland': 'PL',
    'pl': 'PL',

    'japan': 'JP',
    'jp': 'JP',

    'china': 'CN',
    'cn': 'CN',

    'india': 'IN',
    'in': 'IN',

    'brazil': 'BR',
    'br': 'BR',

    'mexico': 'MX',
    'mx': 'MX',

    'south africa': 'ZA',
    'za': 'ZA'
  };

  // Check if the input is in our map
  if (countryMap[countryInput]) {
    return [countryMap[countryInput]];
  }

  // If it's not in our map, assume it's a country code or name and return as is
  // For a more robust solution, we would validate against a complete list of country codes
  return [countryInput.toUpperCase()];
}

export {
  parseDateExpression,
  formatDateForMagento,
  buildDateRangeFilter,
  normalizeCountry,
  endOfYear
};
