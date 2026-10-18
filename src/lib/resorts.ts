// Single source of truth for every resort the widget, API, emails, and dropdown support.
// Client-safe: no server imports here (SnowWidget.tsx reads this list).

export type ResortSource = 'vail' | 'stratton' | 'onthesnow';

export interface ResortInfo {
    slug: string;
    name: string;
    location: string;
    officialUrl: string;            // "View Official Report" link
    source: ResortSource;
    coords: { lat: number; long: number };
    otsPath?: string;               // onthesnow.com/<otsPath>/skireport (data for onthesnow resorts; season dates for all)
    driveMin: number;               // approx. drive from Valley View Villa (OSRM routing)
}

// Ordered by drive time from the villa, which is also the dropdown order.
export const RESORT_LIST: ResortInfo[] = [
    {
        slug: 'mount-snow', name: 'Mount Snow', location: 'West Dover, VT', source: 'vail', driveMin: 5,
        officialUrl: 'https://www.mountsnow.com/the-mountain/mountain-conditions/lift-and-terrain-status.aspx',
        coords: { lat: 42.9602, long: -72.8958 }, otsPath: 'vermont/mount-snow',
    },
    {
        slug: 'stratton', name: 'Stratton', location: 'Stratton, VT', source: 'stratton', driveMin: 38,
        officialUrl: 'https://www.stratton.com/the-mountain/mountain-report',
        coords: { lat: 43.1115, long: -72.9081 }, otsPath: 'vermont/stratton-mountain',
    },
    {
        slug: 'bromley', name: 'Bromley', location: 'Peru, VT', source: 'onthesnow', driveMin: 56,
        officialUrl: 'https://www.bromley.com/snow-report',
        coords: { lat: 43.2134, long: -72.9378 }, otsPath: 'vermont/bromley-mountain',
    },
    {
        slug: 'magic-mountain', name: 'Magic Mountain', location: 'Londonderry, VT', source: 'onthesnow', driveMin: 56,
        officialUrl: 'https://www.magicmtn.com/snow-report',
        coords: { lat: 43.2011, long: -72.7731 }, otsPath: 'vermont/magic-mountain',
    },
    {
        slug: 'berkshire-east', name: 'Berkshire East', location: 'Charlemont, MA', source: 'onthesnow', driveMin: 56,
        officialUrl: 'https://berkshireeast.com/winter/mountain-conditions',
        coords: { lat: 42.6297, long: -72.8656 }, otsPath: 'massachusetts/berkshire-east',
    },
    {
        slug: 'okemo', name: 'Okemo', location: 'Ludlow, VT', source: 'vail', driveMin: 80,
        officialUrl: 'https://www.okemo.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx',
        coords: { lat: 43.4036, long: -72.7163 }, otsPath: 'vermont/okemo-mountain-resort',
    },
];

export const RESORTS_BY_SLUG: Record<string, ResortInfo> =
    Object.fromEntries(RESORT_LIST.map(r => [r.slug, r]));

export const resortName = (slug: string) => RESORTS_BY_SLUG[slug]?.name ?? slug;
