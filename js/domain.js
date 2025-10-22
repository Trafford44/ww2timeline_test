// get access to the domain key from any module by adding
//    import { domainKey } from './domain.js';
//    const config = await loadConfig(domainKey);

// Use a dynamic key based on URL, user input, or fallback
export const domainKey = new URLSearchParams(window.location.search).get("domain") || "ww2infilm";
