// Default image imports
import defaultPlayerPhoto from '../assets/defaultPlayer.png';
import defaultTeamLogo from '../assets/default_team.png';


/**
 * Get the default player profile image
 * This ensures consistency across the application
 */
export const getDefaultPlayerImage = (): string => {
  return defaultPlayerPhoto;
};

/**
 * Get the default team logo
 * This ensures consistency across the application
 */
export const getDefaultTeamLogo = (): string => {
  return defaultTeamLogo;
};

/**
 * Get player profile image with fallback to default
 * @param profileImage - The user's profile image URL (can be null/undefined)
 * @returns The profile image URL or default image
 */
export const getPlayerImage = (profileImage?: string | null): string => {
  return profileImage || getDefaultPlayerImage();
};

/**
 * Get team logo with fallback to default
 * @param teamLogo - The team's logo URL (can be null/undefined)
 * @returns The team logo URL or default logo
 */
export const getTeamLogo = (teamLogo?: string | null): string => {
  return teamLogo || getDefaultTeamLogo();
};

/**
 * Check if an image URL is a default image
 * @param imageUrl - The image URL to check
 * @returns True if it's a default image
 */
export const isDefaultImage = (imageUrl: string): boolean => {
  return imageUrl === getDefaultPlayerImage() || imageUrl === getDefaultTeamLogo();
};
