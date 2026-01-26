import { MountainData } from './types';

// Simple HTML Email Generator
// In a production app, we might use React Email, but string interpolation works fine for this structure.

export function generateSingleResortEmail(data: MountainData): string {
    const { mountain, snowReport, weather, liftsTerrain } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .header { background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0; }
            .header img { width: 500px; height: auto; margin-bottom: 8px; }
            .header h1 { font-size: 16px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
            .content { padding: 32px; }
            .greeting { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #0f172a; }
            .hero-card { background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 24px; display: flex; align-items: center; gap: 20px; }
            .temp { font-size: 36px; font-weight: 900; color: #0f172a; }
            .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .stat-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; }
            .stat-label { font-size: 12px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px; }
            .stat-value { font-size: 20px; font-weight: 800; color: #2563eb; }
            .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
            .btn { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://www.valleyviewvt.com/wp-content/uploads/2024/10/Valley_View_Villa_Logo_Grey_White_Circle_Transparent_Background-768x635.png" alt="Logo" width="500" style="width: 500px; height: auto;">
                <h1>Valley View Villa</h1>
            </div>
            <div class="content">
                <div class="greeting">Good Morning! 🏔️</div>
                <p>Here is your daily condition report for <strong>${mountain.name}</strong>.</p>
                
                <div class="hero-card">
                    <div>
                        <div class="temp">${Math.round(weather.currentTempF)}°F</div>
                        <div style="font-weight: 600; color: #475569;">${weather.conditions}</div>
                    </div>
                </div>

                <div class="stat-grid">
                    <div class="stat-box">
                        <div class="stat-label">24h Snow</div>
                        <div class="stat-value">${snowReport.snow24hIn}"</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Base Depth</div>
                        <div class="stat-value">${snowReport.baseDepthIn.max}"</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Trails Open</div>
                        <div class="stat-value">${liftsTerrain.trailsOpen} / ${liftsTerrain.trailsTotal}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Lifts</div>
                        <div class="stat-value">${liftsTerrain.liftsOpen} / ${liftsTerrain.liftsTotal}</div>
                    </div>
                </div>

                <p style="font-size: 14px; color: #475569;">${data.summary}</p>

                <div style="text-align: center;">
                    <a href="${mountain.url}" class="btn">View Full Report</a>
                </div>
            </div>
            <div class="footer">
                Sent with 💙 from Valley View Villa<br>
                <a href="#" style="color: #94a3b8;">Unsubscribe</a>
            </div>
        </div>
    </body>
    </html>
    `;
}

export function generateGenMultiResortEmail(resorts: MountainData[]): string {
    // Neutral Sort (Alphabetical)
    const sorted = [...resorts].sort((a, b) => a.mountain.name.localeCompare(b.mountain.name));

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .header { background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0; }
            .header img { height: 40px; margin-bottom: 8px; }
            .header h1 { font-size: 16px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
            .content { padding: 32px; }
            .greeting { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }
            .sub-greeting { font-size: 14px; color: #64748b; margin-bottom: 24px; }
            
            /* Resort Card */
            .resort-card { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05); }
            .resort-header { background-color: #f8fafc; padding: 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
            .resort-name { font-size: 18px; font-weight: 800; color: #0f172a; }
            .resort-link { font-size: 12px; font-weight: 600; color: #2563eb; text-decoration: none; }
            
            /* Data Grid */
            .data-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; border-bottom: 1px solid #e2e8f0; }
            .data-cell { padding: 12px; text-align: center; border-right: 1px solid #e2e8f0; }
            .data-cell:last-child { border-right: none; }
            .data-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px; }
            .data-value { font-size: 16px; font-weight: 800; color: #1e293b; }
            .highlight { color: #2563eb; }

            /* Forecast Row */
            .forecast-row { padding: 12px 16px; background-color: #fff; display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #475569; }
            .forecast-badge { background-color: #eff6ff; color: #2563eb; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 6px; }

            .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://www.valleyviewvt.com/wp-content/uploads/2024/10/Valley_View_Villa_Logo_Grey_White_Circle_Transparent_Background-768x635.png" alt="Logo">
                <h1>Valley View Villa</h1>
            </div>
            <div class="content">
                <div class="greeting">Daily Snow Report 🏔️</div>
                <div class="sub-greeting">Current conditions for your selected mountains.</div>

                ${sorted.map(r => {
        const snowToday = Math.round(r.weather.daily[0]?.snowIn || 0);
        return `
                    <div class="resort-card">
                        <div class="resort-header">
                            <div class="resort-name">${r.mountain.name}</div>
                            <a href="${r.mountain.url}" class="resort-link">Full Report →</a>
                        </div>
                        
                        <!-- Row 1: Snow Stats -->
                        <div class="data-grid">
                            <div class="data-cell">
                                <div class="data-label">Last 24h</div>
                                <div class="data-value highlight">${Math.round(r.snowReport.snow24hIn)}"</div>
                            </div>
                            <div class="data-cell">
                                <div class="data-label">Last 48h</div>
                                <div class="data-value">${Math.round(r.snowReport.snow48hIn)}"</div>
                            </div>
                            <div class="data-cell">
                                <div class="data-label">Base Depth</div>
                                <div class="data-value">${Math.round(r.snowReport.baseDepthIn.max)}"</div>
                            </div>
                        </div>

                        <!-- Row 2: Terrain Stats -->
                        <div class="data-grid" style="border-bottom: 1px solid #e2e8f0;">
                            <div class="data-cell">
                                <div class="data-label">Trails Open</div>
                                <div class="data-value">${r.liftsTerrain.trailsOpen}/${r.liftsTerrain.trailsTotal}</div>
                            </div>
                            <div class="data-cell">
                                <div class="data-label">Lifts Turning</div>
                                <div class="data-value">${r.liftsTerrain.liftsOpen}/${r.liftsTerrain.liftsTotal}</div>
                            </div>
                            <div class="data-cell">
                                <div class="data-label">Terrain Open</div>
                                <div class="data-value">${r.liftsTerrain.terrainOpenPct}%</div>
                            </div>
                        </div>

                        <!-- Row 3: Weather/Forecast -->
                        <div class="forecast-row">
                            <div style="display: flex; align-items: center;">
                                <strong>Today:</strong>&nbsp; ${r.weather.conditions} • ${Math.round(r.weather.currentTempF)}°F
                                ${snowToday > 0 ? `<span class="forecast-badge">❄️ ${snowToday}" Expected</span>` : ''}
                            </div>
                        </div>
                    </div>
                `}).join('')}

            </div>
            <div class="footer">
                Sent with 💙 from Valley View Villa<br>
                <a href="#" style="color: #94a3b8;">Unsubscribe</a>
            </div>
        </div>
    </body>
    </html>
    `;
}

export function generateSubscriptionConfirmationEmail(resorts: string[], startDate: string, endDate: string): string {
    const resortNames = resorts.map(slug => {
        if (slug === 'mount-snow') return 'Mount Snow';
        if (slug === 'okemo') return 'Okemo';
        if (slug === 'stratton') return 'Stratton';
        return slug;
    }).join(', ');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .header { background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 1px solid #e2e8f0; }
            .header img { height: 40px; margin-bottom: 8px; }
            .header h1 { font-size: 16px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
            .content { padding: 32px; }
            .greeting { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #0f172a; }
            .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 24px; }
            .info-label { font-size: 12px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px; }
            .info-value { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
            .info-value:last-child { margin-bottom: 0; }
            .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://www.valleyviewvt.com/wp-content/uploads/2024/10/Valley_View_Villa_Logo_Grey_White_Circle_Transparent_Background-768x635.png" alt="Logo">
                <h1>Valley View Villa</h1>
            </div>
            <div class="content">
                <div class="greeting">You're Subscribed! ✅</div>
                <p>You will now receive daily snow reports for the duration of your stay.</p>
                
                <div class="info-box">
                    <div class="info-label">Selected Resorts</div>
                    <div class="info-value">${resortNames}</div>
                    
                    <div class="info-label">Active Dates</div>
                    <div class="info-value">${startDate} to ${endDate}</div>
                </div>

                <p style="font-size: 14px; color: #475569;">Reports are sent daily at 7:00 AM EST. Enjoy your time on the slopes!</p>
            </div>
            <div class="footer">
                Sent with 💙 from Valley View Villa<br>
                <a href="#" style="color: #94a3b8;">Unsubscribe</a>
            </div>
        </div>
    </body>
    </html>
    `;
}
