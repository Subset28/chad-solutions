import { supabase } from '@/lib/supabase';
import CompareClient from './CompareClient';
import { Metadata } from 'next';

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const params = await paramsPromise;
    const { data } = await supabase
        .from('battle_challenges')
        .select('username')
        .eq('id', params.id)
        .single();

    const username = data?.username || 'Someone';
    
    return {
        title: `MOG CHALLENGE — @${username}`,
        description: `Someone challenged you to a biometric battle on Chad Solutions. Do you mog?`,
        openGraph: {
            title: 'MOG CHALLENGE',
            description: `@${username} challenged you. Accept and scan to see if you mog.`,
            images: ['/og-challenge.png'],
        }
    };
}

export default async function ComparePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = await paramsPromise;
    const { data: challenger } = await supabase
        .from('battle_challenges')
        .select('*')
        .eq('id', params.id)
        .single();

    return <CompareClient challenger={challenger} />;
}
