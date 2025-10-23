// get access to the domain key from any module by adding
//    import { domainKey } from './domain.js';
//    const config = await loadConfig(domainKey);

//There is nothign in the URL at present
//Future-proofing: If you later want to support multiple domains (e.g., ?domain=interwar, ?domain=ww1), the logic is already in place.
//No duplication: You don’t need to rewrite or refactor anything when you start using query parameters.
  
// Use a dynamic key based on URL, user input, or fallback
export const domainKey = new URLSearchParams(window.location.search).get("domain") || "ww2infilm";
