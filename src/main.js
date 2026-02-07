/**
 * Competitive Intelligence
 * 
 * Analyze competitor creators and benchmark performance.
 * Track market share, content strategies, and growth patterns.
 */

import { Actor } from 'apify';
import { ApifyClient } from 'apify-client';
import { analyzeCompetitiveLandscape, benchmarkCreator } from './analyzer.js';

await Actor.init();

const input = await Actor.getInput() ?? {};

const {
    // Mode selection
    mode = 'landscape', // 'landscape' or 'benchmark'
    
    // For landscape mode
    tiktokUsernames = [],
    profiles = [],
    
    // For benchmark mode
    targetUsername = null,
    competitorUsernames = [],
    
    // Options
    fetchProfiles = true,
    apiToken = null,
} = input;

// Initialize client for fetching profiles
const client = new ApifyClient({
    token: apiToken || process.env.APIFY_TOKEN,
});

const TIKTOK_SCRAPER = 'apricot_blackberry/tiktok-profile-scraper';

// Fetch profiles function
async function fetchTikTokProfiles(usernames) {
    if (usernames.length === 0) return [];
    
    console.log(`Fetching ${usernames.length} TikTok profiles...`);
    
    try {
        const run = await client.actor(TIKTOK_SCRAPER).call({
            usernames,
            delayBetweenRequests: 1000,
        }, {
            memory: 1024,
            timeout: 180,
        });
        
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`Fetched ${items.length} profiles successfully`);
        return items;
    } catch (error) {
        console.error('Error fetching profiles:', error.message);
        return [];
    }
}

// Execute based on mode
if (mode === 'benchmark') {
    // Benchmark mode: compare target against competitors
    
    if (!targetUsername) {
        throw new Error('Benchmark mode requires targetUsername');
    }
    
    if (competitorUsernames.length === 0) {
        throw new Error('Benchmark mode requires at least one competitor');
    }
    
    console.log(`\nBenchmarking @${targetUsername} against ${competitorUsernames.length} competitors`);
    
    // Fetch all profiles
    const allUsernames = [targetUsername, ...competitorUsernames];
    const allProfiles = fetchProfiles 
        ? await fetchTikTokProfiles(allUsernames)
        : profiles;
    
    // Find target and competitors
    const targetProfile = allProfiles.find(p => 
        p.username?.toLowerCase() === targetUsername.toLowerCase()
    );
    const competitorProfiles = allProfiles.filter(p => 
        p.username?.toLowerCase() !== targetUsername.toLowerCase()
    );
    
    if (!targetProfile) {
        throw new Error(`Could not find target profile: @${targetUsername}`);
    }
    
    if (competitorProfiles.length === 0) {
        throw new Error('No competitor profiles found');
    }
    
    // Run benchmark analysis
    const benchmark = benchmarkCreator(targetProfile, competitorProfiles);
    
    // Output
    console.log('\n' + '='.repeat(50));
    console.log('BENCHMARK RESULTS');
    console.log('='.repeat(50));
    
    console.log(`\n@${benchmark.target.username}:`);
    console.log(`  Followers: ${benchmark.target.metrics.followers.toLocaleString()} (${benchmark.benchmarks.followers.label})`);
    console.log(`  Engagement: ${benchmark.target.metrics.engagementRate}% (${benchmark.benchmarks.engagement.label})`);
    console.log(`  Growth: ${benchmark.target.growth.followersPerMonth.toLocaleString()}/month (${benchmark.benchmarks.growth.label})`);
    
    if (benchmark.gapToLeader) {
        console.log(`\n  Gap to leader: ${benchmark.gapToLeader.followers.toLocaleString()} followers (${benchmark.gapToLeader.percentage}%)`);
    } else {
        console.log('\n  🏆 MARKET LEADER');
    }
    
    console.log('\nRecommendations:');
    benchmark.recommendations.forEach(rec => {
        console.log(`  [${rec.priority.toUpperCase()}] ${rec.category}: ${rec.action}`);
    });
    
    await Actor.pushData({
        type: 'benchmark',
        ...benchmark,
        analyzedAt: new Date().toISOString(),
    });
    
} else {
    // Landscape mode: analyze competitive landscape
    
    const allUsernames = [...tiktokUsernames];
    
    if (allUsernames.length < 2 && profiles.length < 2) {
        throw new Error('Landscape mode requires at least 2 creators');
    }
    
    console.log(`\nAnalyzing competitive landscape with ${allUsernames.length || profiles.length} creators`);
    
    // Fetch profiles if needed
    const allProfiles = fetchProfiles && allUsernames.length > 0
        ? await fetchTikTokProfiles(allUsernames)
        : profiles;
    
    if (allProfiles.length < 2) {
        throw new Error('Need at least 2 valid profiles for landscape analysis');
    }
    
    // Run landscape analysis
    const landscape = analyzeCompetitiveLandscape(allProfiles);
    
    // Output
    console.log('\n' + '='.repeat(50));
    console.log('COMPETITIVE LANDSCAPE');
    console.log('='.repeat(50));
    
    console.log(`\nMarket Overview:`);
    console.log(`  Total Creators: ${landscape.summary.totalCreators}`);
    console.log(`  Total Followers: ${landscape.summary.totalFollowers.toLocaleString()}`);
    console.log(`  Avg Engagement: ${landscape.summary.avgEngagement}%`);
    
    console.log(`\n🏆 Market Leader: @${landscape.highlights.marketLeader.username} (${landscape.highlights.marketLeader.marketShare}% share)`);
    console.log(`📈 Fastest Growing: @${landscape.highlights.fastestGrowing.username} (+${landscape.highlights.fastestGrowing.growthPerMonth.toLocaleString()}/month)`);
    console.log(`⚡ Highest Engagement: @${landscape.highlights.highestEngagement.username} (${landscape.highlights.highestEngagement.engagementRate}%)`);
    
    console.log('\nRankings by Followers:');
    landscape.rankings.byFollowers.forEach(r => {
        console.log(`  ${r.rank}. @${r.username}: ${r.followers.toLocaleString()}`);
    });
    
    if (landscape.insights.length > 0) {
        console.log('\nInsights:');
        landscape.insights.forEach(insight => {
            const icon = insight.severity === 'opportunity' ? '💡' : insight.severity === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`  ${icon} ${insight.message}`);
        });
    }
    
    // Push all competitor data
    await Actor.pushData({
        type: 'landscape',
        ...landscape,
        analyzedAt: new Date().toISOString(),
    });
}

console.log('\n' + '='.repeat(50));
console.log('ANALYSIS COMPLETE');
console.log('='.repeat(50));

await Actor.exit();
