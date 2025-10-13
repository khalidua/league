/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with first letter capitalized
 */
export const capitalizeFirstLetter = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalizes the first letter of each word in a string
 * @param str - The string to capitalize
 * @returns The string with first letter of each word capitalized
 */
export const capitalizeWords = (str: string | null | undefined): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .split(' ')
    .map(word => capitalizeFirstLetter(word))
    .join(' ');
};

/**
 * Formats a full name by capitalizing first and last names
 * @param firstName - The first name
 * @param lastName - The last name
 * @returns Formatted full name
 */
export const formatFullName = (firstName: string | null | undefined, lastName: string | null | undefined): string => {
  const first = capitalizeFirstLetter(firstName);
  const last = capitalizeFirstLetter(lastName);
  
  if (first && last) {
    return `${first} ${last}`;
  } else if (first) {
    return first;
  } else if (last) {
    return last;
  }
  return '';
};
