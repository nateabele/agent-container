#!/usr/bin/env node

/**
 * Usage monitoring system for Claude Code and OpenAI Codex
 * Tracks usage and switches providers when limits are exceeded
 */

const fs = require('fs');
const path = require('path');

class UsageMonitor {
  constructor(configPath = './config/usage-config.json') {
    this.configPath = configPath;
    this.config = this.loadConfig();
    this.usageData = this.loadUsageData();
  }

  loadConfig() {
    const defaultConfig = {
      'claude-code': {
        dailyLimit: 1000000, // tokens per day
        weeklyLimit: 5000000, // tokens per week
        switchThreshold: 0.75 // switch at 75% of limit
      },
      'codex': {
        dailyLimit: 1000000, // tokens per day
        weeklyLimit: 5000000, // tokens per week
        switchThreshold: 0.75 // switch at 75% of limit
      },
      'cursor': {
        dailyLimit: 1000000, // tokens per day
        weeklyLimit: 5000000, // tokens per week
        switchThreshold: 0.75 // switch at 75% of limit
      },
      providers: {
        primary: 'claude-code',
        fallback: 'codex',
        'secondary-fallback': 'cursor'
      }
    };

    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return { ...defaultConfig, ...config };
      }
    } catch (error) {
      console.warn(`Warning: Could not load config from ${this.configPath}, using defaults`);
    }

    return defaultConfig;
  }

  loadUsageData() {
    const usagePath = './config/usage-data.json';
    const defaultUsage = {
      'claude-code': {
        daily: { tokens: 0, resetDate: this.getCurrentDate() },
        weekly: { tokens: 0, resetDate: this.getCurrentWeek() }
      },
      'codex': {
        daily: { tokens: 0, resetDate: this.getCurrentDate() },
        weekly: { tokens: 0, resetDate: this.getCurrentWeek() }
      },
      'cursor': {
        daily: { tokens: 0, resetDate: this.getCurrentDate() },
        weekly: { tokens: 0, resetDate: this.getCurrentWeek() }
      }
    };

    try {
      if (fs.existsSync(usagePath)) {
        const data = JSON.parse(fs.readFileSync(usagePath, 'utf8'));
        return { ...defaultUsage, ...data };
      }
    } catch (error) {
      console.warn('Warning: Could not load usage data, starting fresh');
    }

    return defaultUsage;
  }

  saveUsageData() {
    try {
      fs.writeFileSync('./usage-data.json', JSON.stringify(this.usageData, null, 2));
    } catch (error) {
      console.error('Error saving usage data:', error);
    }
  }

  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  getCurrentWeek() {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return startOfWeek.toISOString().split('T')[0];
  }

  resetCountersIfNeeded(provider) {
    const currentDate = this.getCurrentDate();
    const currentWeek = this.getCurrentWeek();

    // Reset daily counter if needed
    if (this.usageData[provider].daily.resetDate !== currentDate) {
      this.usageData[provider].daily.tokens = 0;
      this.usageData[provider].daily.resetDate = currentDate;
    }

    // Reset weekly counter if needed
    if (this.usageData[provider].weekly.resetDate !== currentWeek) {
      this.usageData[provider].weekly.tokens = 0;
      this.usageData[provider].weekly.resetDate = currentWeek;
    }
  }

  recordUsage(provider, tokens) {
    this.resetCountersIfNeeded(provider);
    
    this.usageData[provider].daily.tokens += tokens;
    this.usageData[provider].weekly.tokens += tokens;
    
    this.saveUsageData();
    
    console.log(`Recorded ${tokens} tokens for ${provider}`);
    console.log(`Daily usage: ${this.usageData[provider].daily.tokens}/${this.config[provider].dailyLimit}`);
    console.log(`Weekly usage: ${this.usageData[provider].weekly.tokens}/${this.config[provider].weeklyLimit}`);
  }

  getUsagePercentage(provider, period = 'daily') {
    this.resetCountersIfNeeded(provider);
    
    const limit = this.config[provider][`${period}Limit`];
    const used = this.usageData[provider][period].tokens;
    
    return used / limit;
  }

  shouldSwitchProvider(provider) {
    const dailyPercentage = this.getUsagePercentage(provider, 'daily');
    const weeklyPercentage = this.getUsagePercentage(provider, 'weekly');
    
    const dailyThreshold = this.config[provider].switchThreshold;
    const weeklyThreshold = this.config[provider].switchThreshold;
    
    return dailyPercentage >= dailyThreshold || weeklyPercentage >= weeklyThreshold;
  }

  getRecommendedProvider() {
    const primaryProvider = this.config.providers.primary;
    const fallbackProvider = this.config.providers.fallback;
    const secondaryFallbackProvider = this.config.providers['secondary-fallback'];
    
    if (this.shouldSwitchProvider(primaryProvider)) {
      if (this.shouldSwitchProvider(fallbackProvider)) {
        console.log(`⚠️  Both ${primaryProvider} and ${fallbackProvider} usage exceeded threshold, switching to ${secondaryFallbackProvider}`);
        return secondaryFallbackProvider;
      } else {
        console.log(`⚠️  ${primaryProvider} usage exceeded threshold, switching to ${fallbackProvider}`);
        return fallbackProvider;
      }
    }
    
    return primaryProvider;
  }

  getUsageStatus() {
    const status = {};
    
    for (const provider of ['claude-code', 'codex', 'cursor']) {
      status[provider] = {
        daily: {
          used: this.usageData[provider].daily.tokens,
          limit: this.config[provider].dailyLimit,
          percentage: this.getUsagePercentage(provider, 'daily'),
          threshold: this.config[provider].switchThreshold
        },
        weekly: {
          used: this.usageData[provider].weekly.tokens,
          limit: this.config[provider].weeklyLimit,
          percentage: this.getUsagePercentage(provider, 'weekly'),
          threshold: this.config[provider].switchThreshold
        }
      };
    }
    
    return status;
  }

  printUsageStatus() {
    const status = this.getUsageStatus();
    
    console.log('\n📊 Usage Status:');
    console.log('================');
    
    for (const [provider, data] of Object.entries(status)) {
      console.log(`\n${provider.toUpperCase()}:`);
      console.log(`  Daily:  ${data.daily.used}/${data.daily.limit} (${(data.daily.percentage * 100).toFixed(1)}%)`);
      console.log(`  Weekly: ${data.weekly.used}/${data.weekly.limit} (${(data.weekly.percentage * 100).toFixed(1)}%)`);
      
      if (data.daily.percentage >= data.daily.threshold) {
        console.log(`  ⚠️  Daily threshold exceeded (${(data.daily.threshold * 100)}%)`);
      }
      if (data.weekly.percentage >= data.weekly.threshold) {
        console.log(`  ⚠️  Weekly threshold exceeded (${(data.weekly.threshold * 100)}%)`);
      }
    }
    
    const recommended = this.getRecommendedProvider();
    console.log(`\n🎯 Recommended provider: ${recommended}`);
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  const monitor = new UsageMonitor();
  
  switch (command) {
    case 'status':
      monitor.printUsageStatus();
      break;
      
    case 'record':
      const provider = args[0];
      const tokens = parseInt(args[1]);
      if (!provider || isNaN(tokens)) {
        console.log('Usage: node scripts/usage-monitor.js record <provider> <tokens>');
        process.exit(1);
      }
      monitor.recordUsage(provider, tokens);
      break;
      
    case 'recommend':
      console.log(`Recommended provider: ${monitor.getRecommendedProvider()}`);
      break;
      
    case 'reset':
      const resetProvider = args[0];
      if (!resetProvider) {
        console.log('Usage: node scripts/usage-monitor.js reset <provider>');
        process.exit(1);
      }
      monitor.usageData[resetProvider] = {
        daily: { tokens: 0, resetDate: monitor.getCurrentDate() },
        weekly: { tokens: 0, resetDate: monitor.getCurrentWeek() }
      };
      monitor.saveUsageData();
      console.log(`Reset usage data for ${resetProvider}`);
      break;
      
    default:
      console.log(`Usage:
  node scripts/usage-monitor.js status                    - Show usage status
  node scripts/usage-monitor.js record <provider> <tokens> - Record usage
  node scripts/usage-monitor.js recommend                 - Get recommended provider
  node scripts/usage-monitor.js reset <provider>          - Reset usage data
      `);
  }
}

module.exports = UsageMonitor;
