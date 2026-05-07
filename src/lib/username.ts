// lib/username.ts

const adjectives = [
    'Robust', 'Sculpted', 'Chiseled', 'Ascended', 
    'Forward', 'Sharp', 'Defined', 'Elite', 'Optimal',
    'Angular', 'Masculine', 'Symmetric', 'Heroic', 'Alpha'
];

const nouns = [
    'Frame', 'Jaw', 'Orbit', 'Maxilla', 'Ramus', 
    'Chad', 'Canthus', 'Zygoma', 'Menton',
    'Hunter', 'Warrior', 'Titan', 'Apex', 'Pheno'
];

export function getOrCreateUsername(): string {
    if (typeof window === 'undefined') return 'Anonymous';
    
    const stored = localStorage.getItem('cs_username');
    if (stored) return stored;
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 99);
    const username = `${adj}${noun}${num}`;
    
    localStorage.setItem('cs_username', username);
    return username;
}
