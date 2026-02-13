/**
 * Competitive Intelligence Analyzer
 *
 * Benchmark creators against each other and analyze competitive landscape.
 *
 * IMPORTANT LIMITATIONS:
 * - Market share is based on FOLLOWER COUNT, not reach or actual audience size
 * - Growth projections assume LINEAR growth (does NOT account for algorithm changes)
 * - Cap projections at 2 years maximum
 * - Reach-based market share analysis not available (followers ≠ reach)
 *
 * All benchmarks are 2024-2025 estimates. Verify quarterly.
 * Last verified: February 2025
 */

/**
 * Validate creator data for competitive analysis
 *
 * @param {Object} creator - Creator profile
 * @returns {Object} {isValid: boolean, errors: string[]}
 */
function validateCreatorForAnalysis(creator) {
    const errors = [];

    if (!creator) {
        errors.push('Creator is null/undefined');
        return { isValid: false, errors };
    }

    if (typeof creator.followers === 'number' && creator.followers < 0) {
        errors.push('Followers cannot be negative');
    }

    if (typeof creator.likes === 'number' && creator.likes < 0) {
        errors.push('Likes cannot be negative');
    }

    if (typeof creator.videos === 'number' && creator.videos < 0) {
        errors.push('Video count cannot be negative');
    }

    if (typeof creator.accountAgeDays === 'number' && creator.accountAgeDays < 0) {
        errors.push('Account age cannot be negative');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Build competitive landscape analysis
 *
 * @param {Array} creators - Array of creator profiles
 * @returns {Object} Landscape analysis with rankings, highlights, and insights
 */
export function analyzeCompetitiveLandscape(creators) {
    if (creators.length < 2) {
        return { error: 'Need at least 2 creators for competitive analysis' };
    }

    // Calculate market metrics
    const totalFollowers = creators.reduce((sum, c) => sum + (c.followers || 0), 0);
    const totalLikes = creators.reduce((sum, c) => sum + (c.likes || 0), 0);
    
    // Build individual analyses with market share
    const competitorAnalysis = creators.map(creator => {
        // Validate creator data
        const validation = validateCreatorForAnalysis(creator);
        if (!validation.isValid) {
            console.warn(`⚠️ Data validation issues for @${creator.username}: ${validation.errors.join('; ')}`);
        }

        const followers = creator.followers || 0;
        const likes = creator.likes || 0;
        const engagementRate = creator.engagementRate || 0;
        const videos = creator.videos || 0;
        const accountAgeDays = creator.accountAgeDays || 365;

        return {
            username: creator.username,
            nickname: creator.nickname,
            verified: creator.verified,

            // Core metrics
            metrics: {
                followers,
                likes,
                videos,
                engagementRate: Math.round(engagementRate * 100) / 100,
                accountAgeDays,
            },

            // Market share (FOLLOWER-BASED, not reach-based)
            // IMPORTANT: This reflects follower distribution, not actual audience reach
            // Reach varies significantly based on engagement, algorithm, content type, etc.
            marketShare: {
                followers: totalFollowers > 0 ? Math.round((followers / totalFollowers) * 10000) / 100 : 0,
                likes: totalLikes > 0 ? Math.round((likes / totalLikes) * 10000) / 100 : 0,
            },
            
            // Growth velocity
            growth: {
                followersPerDay: Math.round(followers / accountAgeDays),
                followersPerMonth: Math.round((followers / accountAgeDays) * 30),
                videosPerMonth: Math.round((videos / accountAgeDays) * 30 * 10) / 10,
            },
            
            // Content strategy signals
            contentStrategy: analyzeContentStrategy(creator),
            
            // Tier classification
            tier: getTier(followers),
        };
    });
    
    // Sort by followers for ranking
    competitorAnalysis.sort((a, b) => b.metrics.followers - a.metrics.followers);
    
    // Add rankings
    competitorAnalysis.forEach((c, i) => {
        c.rank = i + 1;
    });
    
    // Market leader analysis
    const leader = competitorAnalysis[0];
    const challenger = competitorAnalysis[1];
    
    // Find fastest growing
    const fastestGrowing = [...competitorAnalysis].sort(
        (a, b) => b.growth.followersPerMonth - a.growth.followersPerMonth
    )[0];
    
    // Find highest engagement
    const highestEngagement = [...competitorAnalysis].sort(
        (a, b) => b.metrics.engagementRate - a.metrics.engagementRate
    )[0];
    
    // Generate insights
    const insights = generateInsights(competitorAnalysis, leader, challenger, fastestGrowing, highestEngagement);
    
    return {
        summary: {
            totalCreators: creators.length,
            totalFollowers,
            totalLikes,
            avgFollowers: Math.round(totalFollowers / creators.length),
            avgEngagement: Math.round(
                competitorAnalysis.reduce((sum, c) => sum + c.metrics.engagementRate, 0) / creators.length * 100
            ) / 100,
        },
        
        rankings: {
            byFollowers: competitorAnalysis.map(c => ({ username: c.username, followers: c.metrics.followers, rank: c.rank })),
            byEngagement: [...competitorAnalysis].sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate)
                .map((c, i) => ({ username: c.username, engagementRate: c.metrics.engagementRate, rank: i + 1 })),
            byGrowth: [...competitorAnalysis].sort((a, b) => b.growth.followersPerMonth - a.growth.followersPerMonth)
                .map((c, i) => ({ username: c.username, growthPerMonth: c.growth.followersPerMonth, rank: i + 1 })),
        },
        
        highlights: {
            marketLeader: {
                username: leader.username,
                followers: leader.metrics.followers,
                marketShare: leader.marketShare.followers,
            },
            challenger: {
                username: challenger.username,
                followers: challenger.metrics.followers,
                gap: leader.metrics.followers - challenger.metrics.followers,
            },
            fastestGrowing: {
                username: fastestGrowing.username,
                growthPerMonth: fastestGrowing.growth.followersPerMonth,
            },
            highestEngagement: {
                username: highestEngagement.username,
                engagementRate: highestEngagement.metrics.engagementRate,
            },
        },
        
        competitors: competitorAnalysis,
        insights,
    };
}

/**
 * Benchmark a target creator against competitors
 */
export function benchmarkCreator(target, competitors) {
    const allCreators = [target, ...competitors];
    const landscape = analyzeCompetitiveLandscape(allCreators);
    
    // Find target in analysis
    const targetAnalysis = landscape.competitors.find(c => c.username === target.username);
    const competitorAnalyses = landscape.competitors.filter(c => c.username !== target.username);
    
    // Calculate percentiles
    const followerRank = targetAnalysis.rank;
    const followerPercentile = Math.round((1 - (followerRank - 1) / allCreators.length) * 100);
    
    const engagementRanks = [...landscape.competitors]
        .sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate);
    const engagementRank = engagementRanks.findIndex(c => c.username === target.username) + 1;
    const engagementPercentile = Math.round((1 - (engagementRank - 1) / allCreators.length) * 100);
    
    const growthRanks = [...landscape.competitors]
        .sort((a, b) => b.growth.followersPerMonth - a.growth.followersPerMonth);
    const growthRank = growthRanks.findIndex(c => c.username === target.username) + 1;
    const growthPercentile = Math.round((1 - (growthRank - 1) / allCreators.length) * 100);
    
    // Calculate gaps to leader
    const leader = landscape.competitors[0];
    const gapToLeader = leader.username === target.username ? 0 : {
        followers: leader.metrics.followers - targetAnalysis.metrics.followers,
        percentage: Math.round(((leader.metrics.followers - targetAnalysis.metrics.followers) / leader.metrics.followers) * 100),
        disclaimer: 'Gap based on current follower count - actual market reach differs based on engagement and algorithm',
    };
    
    // Generate recommendations
    const recommendations = generateBenchmarkRecommendations(targetAnalysis, competitorAnalyses, leader);
    
    return {
        target: {
            username: target.username,
            ...targetAnalysis,
        },
        
        benchmarks: {
            followers: {
                rank: followerRank,
                percentile: followerPercentile,
                total: allCreators.length,
                label: getPercentileLabel(followerPercentile),
            },
            engagement: {
                rank: engagementRank,
                percentile: engagementPercentile,
                total: allCreators.length,
                label: getPercentileLabel(engagementPercentile),
            },
            growth: {
                rank: growthRank,
                percentile: growthPercentile,
                total: allCreators.length,
                label: getPercentileLabel(growthPercentile),
            },
        },
        
        gapToLeader: leader.username === target.username ? null : gapToLeader,
        isLeader: leader.username === target.username,
        
        competitorCount: competitors.length,
        landscape: landscape.summary,
        recommendations,
    };
}

/**
 * Analyze content strategy from profile data
 */
function analyzeContentStrategy(creator) {
    const videos = creator.videos || 0;
    const accountAgeDays = creator.accountAgeDays || 365;
    const likes = creator.likes || 0;
    
    const videosPerMonth = (videos / accountAgeDays) * 30;
    const avgLikesPerVideo = videos > 0 ? likes / videos : 0;
    
    let postingStrategy = 'unknown';
    if (videosPerMonth >= 60) postingStrategy = 'high-volume';
    else if (videosPerMonth >= 20) postingStrategy = 'consistent';
    else if (videosPerMonth >= 5) postingStrategy = 'moderate';
    else postingStrategy = 'quality-focused';
    
    return {
        postingStrategy,
        videosPerMonth: Math.round(videosPerMonth * 10) / 10,
        avgLikesPerVideo: Math.round(avgLikesPerVideo),
        hasExternalLinks: !!creator.bioLink,
        isVerified: !!creator.verified,
        isCommerce: !!(creator.commerceUser || creator.ttSeller),
    };
}

/**
 * Get follower tier
 */
function getTier(followers) {
    if (followers >= 1000000) return 'mega';
    if (followers >= 500000) return 'macro';
    if (followers >= 100000) return 'mid-tier';
    if (followers >= 10000) return 'micro';
    return 'nano';
}

/**
 * Get percentile label
 */
function getPercentileLabel(percentile) {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Average';
    if (percentile >= 25) return 'Below Average';
    return 'Bottom 25%';
}

/**
 * Generate competitive insights
 */
function generateInsights(competitors, leader, challenger, fastestGrowing, highestEngagement) {
    const insights = [];
    
    // Leader dominance
    if (leader.marketShare.followers > 50) {
        insights.push({
            type: 'market_dominance',
            message: `@${leader.username} dominates with ${leader.marketShare.followers}% of total followers`,
            severity: 'info',
        });
    }
    
    // Challenger threat
    if (challenger && challenger.growth.followersPerMonth > leader.growth.followersPerMonth) {
        insights.push({
            type: 'challenger_rising',
            message: `@${challenger.username} is growing faster than the leader (${challenger.growth.followersPerMonth.toLocaleString()} vs ${leader.growth.followersPerMonth.toLocaleString()} followers/month)`,
            severity: 'warning',
        });
    }
    
    // Engagement leaders
    if (highestEngagement.username !== leader.username) {
        insights.push({
            type: 'engagement_opportunity',
            message: `@${highestEngagement.username} has highest engagement (${highestEngagement.metrics.engagementRate}%) but fewer followers`,
            severity: 'opportunity',
        });
    }
    
    // Growth velocity differences
    const avgGrowth = competitors.reduce((sum, c) => sum + c.growth.followersPerMonth, 0) / competitors.length;
    if (fastestGrowing.growth.followersPerMonth > avgGrowth * 2) {
        insights.push({
            type: 'growth_outlier',
            message: `@${fastestGrowing.username} is growing 2x faster than average (${fastestGrowing.growth.followersPerMonth.toLocaleString()}/month)`,
            severity: 'info',
            disclaimer: 'Growth extrapolation assumes linear trend - algorithm changes or viral moments can significantly alter this',
        });
    }
    
    // Strategy diversity
    const strategies = [...new Set(competitors.map(c => c.contentStrategy.postingStrategy))];
    if (strategies.length === 1) {
        insights.push({
            type: 'strategy_uniformity',
            message: `All competitors use similar ${strategies[0]} posting strategy - differentiation opportunity`,
            severity: 'opportunity',
        });
    }
    
    return insights;
}

/**
 * Generate recommendations for benchmark target
 */
function generateBenchmarkRecommendations(target, competitors, leader) {
    const recommendations = [];
    
    // Engagement recommendation
    const avgCompetitorEngagement = competitors.reduce((sum, c) => sum + c.metrics.engagementRate, 0) / competitors.length;
    if (target.metrics.engagementRate < avgCompetitorEngagement) {
        recommendations.push({
            category: 'Engagement',
            priority: 'high',
            action: `Improve engagement rate from ${target.metrics.engagementRate}% to match competitor average of ${avgCompetitorEngagement.toFixed(1)}%`,
            impact: 'Better algorithm visibility and sponsorship rates',
        });
    } else {
        recommendations.push({
            category: 'Engagement',
            priority: 'low',
            action: `Maintain strong engagement rate (${target.metrics.engagementRate}% vs ${avgCompetitorEngagement.toFixed(1)}% avg)`,
            impact: 'Key competitive advantage',
        });
    }
    
    // Posting frequency
    const avgPostingFreq = competitors.reduce((sum, c) => sum + c.growth.videosPerMonth, 0) / competitors.length;
    if (target.growth.videosPerMonth < avgPostingFreq * 0.7) {
        recommendations.push({
            category: 'Content Volume',
            priority: 'medium',
            action: `Increase posting frequency from ${target.growth.videosPerMonth} to ${Math.round(avgPostingFreq)} videos/month`,
            impact: 'Match competitor content output',
        });
    }
    
    // Growth velocity and time to leader (with safety checks)
    if (target.username !== leader.username) {
        // Safe calculation: prevent division by zero
        const followerGap = leader.metrics.followers - target.metrics.followers;
        const growthDifference = target.growth.followersPerMonth - leader.growth.followersPerMonth;

        // Only calculate if growth difference is meaningful and positive
        let monthsToLeader = null;
        let canOvertake = false;

        if (growthDifference > 100) {
            // Target is growing faster than leader
            monthsToLeader = Math.round(followerGap / growthDifference);
            // Cap projection at 24 months (beyond that, algorithm changes are likely)
            monthsToLeader = Math.min(monthsToLeader, 24);
            canOvertake = true;
        }

        if (canOvertake && monthsToLeader !== null) {
            recommendations.push({
                category: 'Growth',
                priority: 'low',
                action: `Maintain growth velocity - on track to overtake leader in ~${monthsToLeader} months`,
                impact: 'Market leadership potential (if growth trend continues)',
                disclaimer: 'Assumes linear growth - algorithm changes or viral moments can alter timeline',
            });
        } else {
            recommendations.push({
                category: 'Growth',
                priority: 'high',
                action: `Increase growth rate to close ${Math.round(followerGap / 1000000 * 10) / 10}M follower gap with leader`,
                impact: `Currently ${target.growth.followersPerMonth.toLocaleString()} followers/month (leader: ${leader.growth.followersPerMonth.toLocaleString()})`,
                disclaimer: 'Growth projections assume linear extrapolation - platform dynamics may vary significantly',
            });
        }
    }
    
    // Verification
    if (!target.verified && competitors.some(c => c.verified)) {
        recommendations.push({
            category: 'Credibility',
            priority: 'medium',
            action: 'Pursue platform verification',
            impact: 'Match verified competitors for brand trust',
        });
    }
    
    return recommendations;
}
