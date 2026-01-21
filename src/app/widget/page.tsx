import SnowWidget from '@/components/SnowWidget';

export default async function WidgetPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const sp = await searchParams;
    const slug = typeof sp.mountain === 'string' ? sp.mountain : 'mount-snow';

    return (
        <div className="bg-transparent p-4 inline-block w-full">
            <SnowWidget defaultSlug={slug} />
        </div>
    );
}

// Ensure the page layout is minimal
export const metadata = {
    title: 'Snow Widget',
    robots: 'noindex',
};
