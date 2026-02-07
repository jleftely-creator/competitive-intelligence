/**
 * Competitive Intelligence Analyzer
 * 
 * Benchmark creators against each other and analyze competitive landscape.
 */

/**
 * Build competitive landscape analysis
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
            
            // Market share
            marketShare: {
                followers: Math.round((followers / totalFollowers) * 10000) / 100,
                likes: Math.round((likes / totalLikes) * 10000) / 100,
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
            message: `@${fastestGrowing.username} is growing 2x faster than average`,
            severity: 'info',
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
    
    // Growth velocity
    if (target.username !== leader.username) {
        const monthsToLeader = Math.round(
            (leader.metrics.followers - target.metrics.followers) / 
            Math.max(target.growth.followersPerMonth - leader.growth.followersPerMonth, 1000)
        );
        
        if (target.growth.followersPerMonth > leader.growth.followersPerMonth) {
            recommendations.push({
                category: 'Growth',
                priority: 'low',
                action: `Maintain growth velocity - on track to overtake leader in ~${monthsToLeader} months`,
                impact: 'Market leadership potential',
            });
        } else {
            recommendations.push({
                category: 'Growth',
                priority: 'high',
                action: `Increase growth rate to close gap with leader`,
                impact: `Currently ${((leader.metrics.followers - target.metrics.followers) / 1000000).toFixed(1)}M followers behind`,
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
