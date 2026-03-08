export interface Guide {
    id: string;
    title: string;
    description: string;
    icon: string;
    slug: string;
    category: 'Face' | 'Body' | 'Style' | 'Mindset';
    readTime: string;
}

export const guides: Guide[] = [
    {
        id: 'mewing',
        title: 'Mewing & Tongue Posture',
        description: 'The foundation of facial development. Learn correct tongue posture to improve jawline definition and forward growth.',
        icon: '👅',
        slug: '/guides/mewing',
        category: 'Face',
        readTime: '5 min'
    },
    {
        id: 'skincare',
        title: 'Glass Skin Protocol',
        description: 'Achieve flawless skin texture through a scientific routine. Remove acne, scarring, and inflammation.',
        icon: '✨',
        slug: '/guides/skincare',
        category: 'Style',
        readTime: '8 min'
    },
    {
        id: 'gym',
        title: 'Aesthetic Bodybuilding',
        description: 'Target the V-taper. Optimize shoulder-to-waist ratio and body fat percentage for maximum appeal.',
        icon: '💪',
        slug: '/guides/gym',
        category: 'Body',
        readTime: '10 min'
    },
    {
        id: 'style',
        title: 'Style & Color Theory',
        description: 'Dress to maximize your frame. Color analysis, fit guides, and wardrobe essentials.',
        icon: 'bg-zinc-800', // using class for now or emoji
        slug: '/guides/style',
        category: 'Style', // Fixed type error to match 'Style'
        readTime: '6 min'
    }
];
