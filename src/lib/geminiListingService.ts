import { Listing } from "../types";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "./firebase";

export interface DuplicateAnalysis {
  score: number;
  reasoning: string;
  matchedListingId: string | null;
  matchedListingTitle: string | null;
  isFlagged: boolean;
}

/**
 * Fetches potential duplicate listings based on location context
 */
export const findNearbyListings = async (targetListing: Listing): Promise<Listing[]> => {
  try {
    const listingsCol = collection(db, 'listings');

    // Slightly broader strategy: Fetch recent approved listings and filter by simple keyword match if location exists
    let q = query(
      listingsCol,
      where('isApproved', '==', true),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const allApproved = snapshot.docs
      .map(doc => ({ id: doc.id, ...Object(doc.data()) } as Listing));

    console.log("DEBUG: All approved listings found:", allApproved.length);

    // Client-side filtering for better matching
    const filtered = allApproved.filter(l => {
      const isNotTarget = String(l.id) !== String(targetListing.id);
      if (!isNotTarget) return false;
      
      // If locations are both present, check for partial match
      if (targetListing.location && l.location) {
        return l.location.toLowerCase().includes(targetListing.location.toLowerCase()) || 
               targetListing.location.toLowerCase().includes(l.location.toLowerCase());
      }
      return true;
    });
    console.log("DEBUG: Listings after filtering:", filtered.length);
    return filtered;
  } catch (error) {
    console.error("Error finding nearby listings:", error);
    return [];
  }
};

/**
 * Uses the frontend Gemini SDK to compare a new listing with potential duplicates
 */
export const analyzeDuplicatesWithGemini = async (
  newListing: Listing, 
  existingListings: Listing[],
  fetchImageAsBase64: (url: string) => Promise<string>
): Promise<DuplicateAnalysis> => {
  if (existingListings.length === 0) {
    return {
      score: 0,
      reasoning: "No nearby listings found for comparison.",
      matchedListingId: null,
      matchedListingTitle: null,
      isFlagged: false
    };
  }

  const prompt = `
    ROLE: Real Estate Anti-Fraud System
    TASK: Compare a NEW listing with EXISTING neighborhood listings to detect duplicates or "re-listings".
    
    NEW LISTING DATA:
    - Title: ${newListing.title}
    - Price: ${newListing.price}
    - Location: ${newListing.location}
    - Description: ${newListing.description || 'N/A'}
    
    EXISTING LISTINGS TO COMPARE:
    ${existingListings.map((l, i) => `
      LISTING #${i} (ID: ${l.id}):
      - Title: ${l.title}
      - Price: ${l.price}
      - Description: ${l.description || 'N/A'}
    `).join('\n')}
    
    INSTRUCTIONS:
    1. SCENE UNDERSTANDING: Analyze the images of the NEW listing and the EXISTING listings.
    2. LOOK FOR: Matching interior fixtures (cabinets, tiling), window views, architectural layouts, or watermarks.
    3. LOGIC: BE LENIENT. Only flag as a duplicate if the images show the EXACT same physical unit or if the description is a 90%+ copy-paste. Minor similarities in furniture or tiling are common in developers' estates.
    4. RETURN: A similarity score (0-100) and specific reasoning.
    
    STRICT JSON OUTPUT:
    {
      "score": number, // 0-100
      "reasoning": "Explain why they match or don't match (e.g., 'Identical unique crack in floor tile found in both images')",
      "matchedListingId": "string or null",
      "matchedListingTitle": "string or null",
      "isFlagged": boolean // true ONLY if score > 85
    }
  `;

  try {
    const images: any[] = [];
    
    // Add all listing images (limiting to a reasonable number to avoid token limits)
    const newImageUrls = newListing.images && newListing.images.length > 0 ? newListing.images : (newListing.image ? [newListing.image] : []);
    for (const url of newImageUrls.slice(0, 3)) {
      try {
        const data = await fetchImageAsBase64(url);
        images.push({ inlineData: { mimeType: "image/jpeg", data } });
      } catch (e) { console.warn("New listing image fail", e); }
    }

    // Add up to 3 existing listing images to compare
    for (const l of existingListings.slice(0, 2)) {
      const existingImageUrls = l.images && l.images.length > 0 ? l.images : (l.image ? [l.image] : []);
      for (const url of existingImageUrls.slice(0, 3)) {
        try {
          const data = await fetchImageAsBase64(url);
          images.push({ inlineData: { mimeType: "image/jpeg", data } });
        } catch (e) { console.warn("Existing listing image fail", e); }
      }
    }

    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, images })
    });

    if (!response.ok) {
        throw new Error("Failed to analyze duplicates");
    }

    const data = await response.json();
    return JSON.parse(data.text || '{}');
  } catch (error) {
    console.error("Gemini Duplicate Detection Error:", error);
    throw error;
  }
};
