/**
 * Giphy API Client
 * Handles search requests to Giphy API
 */

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const GIPHY_API_BASE_URL = 'https://api.giphy.com/v1/gifs';

export interface GifResult {
  url: string;
  title: string;
}

export interface GiphySearchResponse {
  data: Array<{
    id: string;
    title: string;
    images: {
      original: {
        url: string;
      };
    };
  }>;
  meta: {
    status: number;
    msg: string;
    response_id: string;
  };
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
}

/**
 * Search Giphy for GIFs matching the query
 * @param query - Search query string
 * @param limit - Number of results to return (default: 20)
 * @returns Array of GIF results with url and title
 */
export async function searchGifs(
  query: string,
  limit: number = 20
): Promise<GifResult[]> {
  // Check for API key
  if (!GIPHY_API_KEY) {
    console.error('GIPHY_API_KEY environment variable is not set');
    throw new Error('Giphy API key is not configured');
  }

  // Validate query
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    // Build URL with query parameters
    const url = new URL(`${GIPHY_API_BASE_URL}/search`);
    url.searchParams.append('api_key', GIPHY_API_KEY);
    url.searchParams.append('q', query.trim());
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('rating', 'pg-13'); // Filter for PG-13 and below

    // Fetch from Giphy API
    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`Giphy API error: ${response.status} ${response.statusText}`);
      throw new Error(`Giphy API request failed: ${response.statusText}`);
    }

    const data = await response.json() as GiphySearchResponse;

    // Check for API-level errors
    if (data.meta.status !== 200) {
      console.error(`Giphy API error: ${data.meta.msg}`);
      throw new Error(`Giphy API error: ${data.meta.msg}`);
    }

    // Transform and return results
    return data.data.map((gif) => ({
      url: gif.images.original.url,
      title: gif.title || 'Untitled GIF',
    }));
  } catch (error) {
    // Log error but don't crash - return empty array as fallback
    console.error('Error searching Giphy:', error);
    return [];
  }
}
