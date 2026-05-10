/* ============================================================
   INTERNET MONEY OS — Core Application Engine
   ============================================================ */

/**
 * Internet Money OS - Main Application Controller
 * Handles: Theme, Navigation, Animations, Storage, Utilities
 */

const IMOS = (function() {
  'use strict';

  // ── Configuration ───────────────────────────────────────
  const CONFIG = {
    themeKey: 'imos-theme',
    storageKey: 'imos-data',
    animationThreshold: 0.1,
    debounceDelay: 150
  };

  // ── State ───────────────────────────────────────────────
  let state = {
    theme: 'light',
    isMobileNavOpen: false,
    savedCalculations: [],
    scrollY: 0
  };

  // ── Theme Manager ───────────────────────────────────────
  const ThemeManager = {
    init() {
      const saved = localStorage.getItem(CONFIG.themeKey);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      state.theme = saved || (prefersDark ? 'dark' : 'light');
      this.apply(state.theme);

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(CONFIG.themeKey)) {
          this.apply(e.matches ? 'dark' : 'light');
        }
      });
    },

    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      state.theme = theme;

      const toggleBtn = document.querySelector('.theme-toggle');
      if (toggleBtn) {
        toggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      }
    },

    toggle() {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      this.apply(newTheme);
      localStorage.setItem(CONFIG.themeKey, newTheme);
    }
  };

  // ── Navigation Manager ──────────────────────────────────
  const NavManager = {
    init() {
      const nav = document.querySelector('.nav');
      const mobileBtn = document.querySelector('.mobile-menu-btn');
      const mobileNav = document.querySelector('.mobile-nav');

      // Scroll behavior
      window.addEventListener('scroll', Utils.debounce(() => {
        state.scrollY = window.scrollY;
        if (nav) {
          nav.classList.toggle('scrolled', state.scrollY > 20);
        }
      }, 50), { passive: true });

      // Mobile menu toggle
      if (mobileBtn && mobileNav) {
        mobileBtn.addEventListener('click', () => {
          state.isMobileNavOpen = !state.isMobileNavOpen;
          mobileNav.classList.toggle('open', state.isMobileNavOpen);
          mobileBtn.innerHTML = state.isMobileNavOpen ? '✕' : '☰';
          document.body.style.overflow = state.isMobileNavOpen ? 'hidden' : '';
        });

        // Close mobile nav on link click
        mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
          link.addEventListener('click', () => {
            state.isMobileNavOpen = false;
            mobileNav.classList.remove('open');
            mobileBtn.innerHTML = '☰';
            document.body.style.overflow = '';
          });
        });
      }

      // Theme toggle
      const themeToggle = document.querySelector('.theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => ThemeManager.toggle());
      }

      // Active nav link
      this.setActiveLink();
    },

    setActiveLink() {
      const currentPath = window.location.pathname.split('/').pop() || 'index.html';
      document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'index.html')) {
          link.classList.add('active');
        }
      });
    }
  };

  // ── Animation Manager ───────────────────────────────────
  const AnimationManager = {
    init() {
      // Intersection Observer for scroll reveals
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: CONFIG.animationThreshold,
        rootMargin: '0px 0px -50px 0px'
      });

      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

      // Counter animations
      this.initCounters();
    },

    initCounters() {
      const counters = document.querySelectorAll('.counter[data-target]');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      counters.forEach(counter => observer.observe(counter));
    },

    animateCounter(el) {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const decimals = parseInt(el.dataset.decimals) || 0;
      const duration = parseInt(el.dataset.duration) || 2000;

      const startTime = performance.now();

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (easeOutQuart)
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = target * eased;

        el.textContent = prefix + current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    }
  };

  // ── Storage Manager ─────────────────────────────────────
  const StorageManager = {
    get(key) {
      try {
        const data = localStorage.getItem(CONFIG.storageKey);
        const parsed = data ? JSON.parse(data) : {};
        return key ? parsed[key] : parsed;
      } catch (e) {
        console.warn('Storage read error:', e);
        return key ? undefined : {};
      }
    },

    set(key, value) {
      try {
        const data = this.get() || {};
        data[key] = value;
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
        return true;
      } catch (e) {
        console.warn('Storage write error:', e);
        return false;
      }
    },

    remove(key) {
      try {
        const data = this.get() || {};
        delete data[key];
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
        return true;
      } catch (e) {
        console.warn('Storage remove error:', e);
        return false;
      }
    },

    push(key, item) {
      const arr = this.get(key) || [];
      arr.push({ ...item, id: Date.now(), timestamp: new Date().toISOString() });
      // Keep only last 50 items
      if (arr.length > 50) arr.shift();
      this.set(key, arr);
      return arr;
    }
  };

  // ── Toast Notifications ─────────────────────────────────
  const ToastManager = {
    container: null,

    init() {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 4000) {
      if (!this.container) this.init();

      const icons = {
        success: '✓',
        warning: '⚠',
        error: '✕',
        info: 'ℹ'
      };

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close notification">✕</button>
      `;

      toast.querySelector('.toast-close').addEventListener('click', () => {
        this.dismiss(toast);
      });

      this.container.appendChild(toast);

      if (duration > 0) {
        setTimeout(() => this.dismiss(toast), duration);
      }
    },

    dismiss(toast) {
      toast.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => toast.remove(), 300);
    }
  };

  // ── Utility Functions ───────────────────────────────────
  const Utils = {
    debounce(fn, delay) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    throttle(fn, limit) {
      let inThrottle;
      return (...args) => {
        if (!inThrottle) {
          fn.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    formatCurrency(value, currency = 'USD', compact = false) {
      const num = parseFloat(value);
      if (isNaN(num)) return '$0';

      if (compact && Math.abs(num) >= 1000000) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(num);
      }

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num);
    },

    formatNumber(value, compact = false) {
      const num = parseFloat(value);
      if (isNaN(num)) return '0';

      if (compact && Math.abs(num) >= 1000000) {
        return new Intl.NumberFormat('en-US', {
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(num);
      }

      return new Intl.NumberFormat('en-US').format(num);
    },

    formatPercent(value, decimals = 1) {
      const num = parseFloat(value);
      if (isNaN(num)) return '0%';
      return num.toFixed(decimals) + '%';
    },

    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    slugify(text) {
      return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  };

  // ── Calculator Engine ───────────────────────────────────
  const CalculatorEngine = {
    // YouTube CPM Calculator
    calculateYouTubeCPM(views, cpm, country = 'usa', niche = 'general') {
      const countryMultipliers = {
        usa: 1.0, uk: 0.85, canada: 0.9, australia: 0.88,
        germany: 0.7, france: 0.65, india: 0.08, brazil: 0.12
      };

      const nicheMultipliers = {
        finance: 2.5, business: 1.8, technology: 1.5, real_estate: 2.0,
        health: 1.3, education: 1.2, gaming: 0.6, entertainment: 0.5,
        general: 1.0, beauty: 0.9, travel: 0.8, food: 0.7
      };

      const adjustedCPM = cpm * (countryMultipliers[country] || 1) * (nicheMultipliers[niche] || 1);
      const revenue = (views / 1000) * adjustedCPM;
      const youtubeCut = revenue * 0.45;
      const creatorRevenue = revenue * 0.55;

      return {
        rawRevenue: revenue,
        youtubeCut: youtubeCut,
        creatorRevenue: creatorRevenue,
        adjustedCPM: adjustedCPM,
        rpm: adjustedCPM * 0.55
      };
    },

    // YouTube RPM Calculator
    calculateYouTubeRPM(views, revenue) {
      const rpm = views > 0 ? (revenue / views) * 1000 : 0;
      const estimatedYearly = revenue * 12;

      return {
        rpm: rpm,
        estimatedMonthly: revenue,
        estimatedYearly: estimatedYearly,
        perVideoEstimate: views > 0 ? revenue : 0
      };
    },

    // TikTok Earnings Calculator
    calculateTikTokEarnings(views, program = 'creator_rewards', niche = 'general') {
      const rates = {
        creator_fund: { min: 0.02, max: 0.04 },
        creator_rewards: { min: 0.40, max: 1.00 }
      };

      const nicheMultipliers = {
        finance: 1.8, business: 1.5, education: 1.3, technology: 1.4,
        beauty: 1.0, fitness: 1.1, gaming: 0.9, entertainment: 0.8, general: 1.0
      };

      const rate = rates[program] || rates.creator_rewards;
      const multiplier = nicheMultipliers[niche] || 1;
      const avgRate = ((rate.min + rate.max) / 2) * multiplier;

      const earnings = (views / 1000) * avgRate;
      const minEarnings = (views / 1000) * rate.min * multiplier;
      const maxEarnings = (views / 1000) * rate.max * multiplier;

      return {
        estimatedEarnings: earnings,
        minEarnings: minEarnings,
        maxEarnings: maxEarnings,
        rpm: avgRate,
        per1MViews: avgRate * 1000
      };
    },

    // Sponsorship Estimator
    calculateSponsorship(followers, engagementRate, niche = 'general', postsPerMonth = 4) {
      const baseRates = {
        nano: { min: 100, max: 500, threshold: 10000 },
        micro: { min: 500, max: 2000, threshold: 50000 },
        mid: { min: 2000, max: 10000, threshold: 250000 },
        macro: { min: 10000, max: 50000, threshold: 1000000 },
        mega: { min: 50000, max: 250000, threshold: Infinity }
      };

      const nicheMultipliers = {
        finance: 2.5, business: 2.0, technology: 1.8, real_estate: 2.2,
        health: 1.5, beauty: 1.3, fashion: 1.4, travel: 1.2,
        food: 1.0, gaming: 0.9, entertainment: 0.8, general: 1.0
      };

      let tier = 'nano';
      for (const [key, value] of Object.entries(baseRates)) {
        if (followers < value.threshold) {
          tier = key;
          break;
        }
      }

      const base = baseRates[tier];
      const multiplier = nicheMultipliers[niche] || 1;
      const engagementMultiplier = Math.min(engagementRate / 3, 2); // 3% is baseline

      const minPerPost = base.min * multiplier * engagementMultiplier;
      const maxPerPost = base.max * multiplier * engagementMultiplier;
      const avgPerPost = (minPerPost + maxPerPost) / 2;

      return {
        tier: tier,
        minPerPost: minPerPost,
        maxPerPost: maxPerPost,
        avgPerPost: avgPerPost,
        monthlyEstimate: avgPerPost * postsPerMonth,
        yearlyEstimate: avgPerPost * postsPerMonth * 12,
        cpmEstimate: (avgPerPost / followers) * 1000
      };
    },

    // Affiliate Revenue Calculator
    calculateAffiliate(monthlyVisitors, conversionRate, avgCommission, avgOrderValue) {
      const conversions = monthlyVisitors * (conversionRate / 100);
      const revenue = conversions * avgCommission;
      const totalOrderValue = conversions * avgOrderValue;

      return {
        conversions: conversions,
        revenue: revenue,
        totalOrderValue: totalOrderValue,
        revenuePerVisitor: monthlyVisitors > 0 ? revenue / monthlyVisitors : 0,
        yearlyRevenue: revenue * 12
      };
    },

    // ROI Calculator
    calculateROI(investment, revenue, timeframe = 'monthly') {
      const profit = revenue - investment;
      const roi = investment > 0 ? (profit / investment) * 100 : 0;
      const multiplier = investment > 0 ? revenue / investment : 0;

      const timeframeMultiplier = {
        daily: 365, weekly: 52, monthly: 12, quarterly: 4, yearly: 1
      };

      const yearlyROI = roi * (timeframeMultiplier[timeframe] || 12);

      return {
        profit: profit,
        roi: roi,
        multiplier: multiplier,
        yearlyROI: yearlyROI,
        breakEven: roi >= 0,
        paybackPeriod: profit > 0 ? investment / profit : Infinity
      };
    },

    // SaaS MRR Calculator
    calculateSaaSMRR(customers, avgRevenuePerUser, churnRate, growthRate) {
      const mrr = customers * avgRevenuePerUser;
      const arr = mrr * 12;
      const monthlyChurn = customers * (churnRate / 100);
      const monthlyGrowth = customers * (growthRate / 100);
      const netGrowth = monthlyGrowth - monthlyChurn;

      // Projections
      const projections = [];
      let projectedCustomers = customers;
      let projectedMRR = mrr;

      for (let i = 1; i <= 12; i++) {
        projectedCustomers = projectedCustomers * (1 + (growthRate - churnRate) / 100);
        projectedMRR = projectedCustomers * avgRevenuePerUser;
        projections.push({
          month: i,
          customers: Math.round(projectedCustomers),
          mrr: projectedMRR,
          arr: projectedMRR * 12
        });
      }

      return {
        mrr: mrr,
        arr: arr,
        monthlyChurn: monthlyChurn,
        monthlyGrowth: monthlyGrowth,
        netGrowth: netGrowth,
        ltv: churnRate > 0 ? (avgRevenuePerUser / (churnRate / 100)) : 0,
        projections: projections,
        yearEndMRR: projections[11].mrr,
        yearEndARR: projections[11].arr
      };
    },

    // Freelance Rate Calculator
    calculateFreelanceRate(annualGoal, billableHoursPerWeek, weeksOff, expenses) {
      const workingWeeks = 52 - weeksOff;
      const totalBillableHours = workingWeeks * billableHoursPerWeek;
      const requiredRevenue = annualGoal + expenses;
      const hourlyRate = totalBillableHours > 0 ? requiredRevenue / totalBillableHours : 0;
      const dailyRate = hourlyRate * 8;
      const weeklyRate = hourlyRate * billableHoursPerWeek;
      const monthlyRate = weeklyRate * 4;

      return {
        hourlyRate: hourlyRate,
        dailyRate: dailyRate,
        weeklyRate: weeklyRate,
        monthlyRate: monthlyRate,
        totalBillableHours: totalBillableHours,
        effectiveAnnualIncome: annualGoal,
        requiredRevenue: requiredRevenue
      };
    },

    // Shopify Profit Calculator
    calculateShopifyProfit(revenue, cogs, adSpend, shopifyPlan, transactionFees) {
      const planCosts = {
        basic: 39, shopify: 105, advanced: 399, plus: 2300
      };

      const monthlyPlanCost = planCosts[shopifyPlan] || 105;
      const transactionCost = revenue * (transactionFees / 100);
      const totalExpenses = cogs + adSpend + monthlyPlanCost + transactionCost;
      const profit = revenue - totalExpenses;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const roas = adSpend > 0 ? revenue / adSpend : 0;

      return {
        revenue: revenue,
        cogs: cogs,
        adSpend: adSpend,
        planCost: monthlyPlanCost,
        transactionFees: transactionCost,
        totalExpenses: totalExpenses,
        profit: profit,
        profitMargin: profitMargin,
        roas: roas,
        breakEven: profit >= 0,
        yearlyProfit: profit * 12
      };
    },

    // Break-even Calculator
    calculateBreakEven(fixedCosts, variableCostPerUnit, pricePerUnit) {
      const contributionMargin = pricePerUnit - variableCostPerUnit;
      const breakEvenUnits = contributionMargin > 0 ? fixedCosts / contributionMargin : 0;
      const breakEvenRevenue = breakEvenUnits * pricePerUnit;
      const contributionMarginRatio = pricePerUnit > 0 ? (contributionMargin / pricePerUnit) * 100 : 0;

      return {
        contributionMargin: contributionMargin,
        contributionMarginRatio: contributionMarginRatio,
        breakEvenUnits: breakEvenUnits,
        breakEvenRevenue: breakEvenRevenue,
        isViable: contributionMargin > 0
      };
    }
  };

  // ── Insight Engine ──────────────────────────────────────
  const InsightEngine = {
    generate(type, data) {
      const insights = [];

      switch (type) {
        case 'youtube_cpm':
          insights.push(...this.youtubeCPMInsights(data));
          break;
        case 'youtube_rpm':
          insights.push(...this.youtubeRPMInsights(data));
          break;
        case 'tiktok':
          insights.push(...this.tiktokInsights(data));
          break;
        case 'sponsorship':
          insights.push(...this.sponsorshipInsights(data));
          break;
        case 'affiliate':
          insights.push(...this.affiliateInsights(data));
          break;
        case 'roi':
          insights.push(...this.roiInsights(data));
          break;
        case 'saas_mrr':
          insights.push(...this.saasMRRInsights(data));
          break;
        case 'freelance':
          insights.push(...this.freelanceInsights(data));
          break;
        case 'shopify':
          insights.push(...this.shopifyInsights(data));
          break;
        case 'breakeven':
          insights.push(...this.breakEvenInsights(data));
          break;
      }

      return insights;
    },

    youtubeCPMInsights(data) {
      const insights = [];
      const avgCPM = 7.5;

      if (data.adjustedCPM < avgCPM * 0.7) {
        insights.push({
          type: 'warning',
          title: 'Below Industry Average',
          text: `Your adjusted CPM of $${data.adjustedCPM.toFixed(2)} is below the industry average of $${avgCPM}. Consider targeting higher-value niches like Finance or Business.`
        });
      } else if (data.adjustedCPM > avgCPM * 1.5) {
        insights.push({
          type: 'success',
          title: 'Above Industry Average',
          text: `Your adjusted CPM of $${data.adjustedCPM.toFixed(2)} is significantly above average. You're in a high-value niche!`
        });
      }

      if (data.creatorRevenue > 10000) {
        insights.push({
          type: 'info',
          title: 'Strong Revenue Potential',
          text: `At this rate, you could earn $${(data.creatorRevenue * 12).toFixed(0)} annually. Consider diversifying with sponsorships.`
        });
      }

      return insights;
    },

    youtubeRPMInsights(data) {
      const insights = [];
      const avgRPM = 4.5;

      if (data.rpm < avgRPM) {
        insights.push({
          type: 'warning',
          title: 'RPM Below Benchmark',
          text: `Your RPM of $${data.rpm.toFixed(2)} is below the typical range ($4-8). Focus on increasing watch time and targeting premium audiences.`
        });
      } else {
        insights.push({
          type: 'success',
          title: 'Healthy RPM',
          text: `Your RPM is competitive. To increase further, experiment with longer videos and higher-value niches.`
        });
      }

      return insights;
    },

    tiktokInsights(data) {
      const insights = [];

      if (data.estimatedEarnings < 500) {
        insights.push({
          type: 'warning',
          title: 'Low Direct Earnings',
          text: 'Direct TikTok payouts are modest. Focus on brand deals and affiliate marketing for higher revenue.'
        });
      } else {
        insights.push({
          type: 'success',
          title: 'Good View Performance',
          text: `Your content is generating solid direct revenue. At this rate, you could earn $${(data.estimatedEarnings * 12).toFixed(0)} annually from the platform alone.`
        });
      }

      insights.push({
        type: 'info',
        title: 'Diversification Tip',
        text: 'Top TikTok creators earn 60-80% of income from brand deals, not platform payouts. Build your media kit!'
      });

      return insights;
    },

    sponsorshipInsights(data) {
      const insights = [];

      insights.push({
        type: 'info',
        title: `${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)} Tier Creator`,
        text: `You're classified as a ${data.tier}-tier influencer. Typical rates range from $${data.minPerPost.toFixed(0)} to $${data.maxPerPost.toFixed(0)} per sponsored post.`
      });

      if (data.monthlyEstimate > 5000) {
        insights.push({
          type: 'success',
          title: 'Strong Sponsorship Potential',
          text: `You could earn $${data.monthlyEstimate.toFixed(0)}/month from sponsorships alone. Consider hiring a talent manager.`
        });
      }

      return insights;
    },

    affiliateInsights(data) {
      const insights = [];

      if (data.conversionRate < 1) {
        insights.push({
          type: 'warning',
          title: 'Low Conversion Rate',
          text: `Your ${data.conversionRate.toFixed(2)}% conversion rate is below average (2-5%). Optimize your content for buyer intent.`
        });
      }

      insights.push({
        type: 'info',
        title: 'Scaling Opportunity',
        text: `Increasing traffic by 50% would add $${(data.revenue * 0.5).toFixed(0)}/month. Focus on SEO and content marketing.`
      });

      return insights;
    },

    roiInsights(data) {
      const insights = [];

      if (data.roi < 0) {
        insights.push({
          type: 'danger',
          title: 'Negative ROI',
          text: `You're losing $${Math.abs(data.profit).toFixed(0)} per period. Re-evaluate your strategy or reduce investment.`
        });
      } else if (data.roi < 20) {
        insights.push({
          type: 'warning',
          title: 'Low ROI',
          text: `Your ${data.roi.toFixed(1)}% ROI is below the healthy benchmark of 30%+. Consider optimizing your funnel.`
        });
      } else {
        insights.push({
          type: 'success',
          title: 'Strong ROI',
          text: `Your ${data.roi.toFixed(1)}% ROI is excellent. Every $1 invested returns $${data.multiplier.toFixed(2)}.`
        });
      }

      return insights;
    },

    saasMRRInsights(data) {
      const insights = [];

      if (data.churnRate > 5) {
        insights.push({
          type: 'warning',
          title: 'High Churn Rate',
          text: `Your ${data.churnRate}% monthly churn is above the healthy SaaS benchmark of 3-5%. Focus on retention strategies.`
        });
      }

      insights.push({
        type: 'info',
        title: 'LTV Insight',
        text: `Your customer LTV is $${data.ltv.toFixed(0)}. Ensure your customer acquisition cost stays below 1/3 of this number.`
      });

      if (data.netGrowth > 0) {
        insights.push({
          type: 'success',
          title: 'Positive Net Growth',
          text: `You're growing by ${data.netGrowth.toFixed(0)} customers/month. At this rate, you'll reach $${data.yearEndARR.toFixed(0)} ARR by year-end.`
        });
      }

      return insights;
    },

    freelanceInsights(data) {
      const insights = [];

      if (data.hourlyRate < 50) {
        insights.push({
          type: 'warning',
          title: 'Rate Below Market',
          text: `Your calculated rate of $${data.hourlyRate.toFixed(0)}/hr is below market average for skilled freelancers ($75-150/hr).`
        });
      } else if (data.hourlyRate > 200) {
        insights.push({
          type: 'success',
          title: 'Premium Rate',
          text: `Your rate of $${data.hourlyRate.toFixed(0)}/hr positions you in the premium tier. Ensure your portfolio reflects this.`
        });
      }

      insights.push({
        type: 'info',
        title: 'Value-Based Pricing',
        text: 'Consider value-based pricing over hourly rates. Clients often pay more for outcomes than time.'
      });

      return insights;
    },

    shopifyInsights(data) {
      const insights = [];

      if (data.profitMargin < 20) {
        insights.push({
          type: 'warning',
          title: 'Low Profit Margin',
          text: `Your ${data.profitMargin.toFixed(1)}% margin is thin. Aim for 25-40% by reducing COGS or increasing prices.`
        });
      }

      if (data.roas < 3) {
        insights.push({
          type: 'warning',
          title: 'Low ROAS',
          text: `Your ROAS of ${data.roas.toFixed(1)}x is below the healthy 3-4x benchmark. Optimize your ad campaigns.`
        });
      } else {
        insights.push({
          type: 'success',
          title: 'Strong ROAS',
          text: `Your ${data.roas.toFixed(1)}x ROAS is excellent. You're getting $${data.roas.toFixed(2)} back for every $1 spent on ads.`
        });
      }

      return insights;
    },

    breakEvenInsights(data) {
      const insights = [];

      if (!data.isViable) {
        insights.push({
          type: 'danger',
          title: 'Not Viable',
          text: 'Your variable costs exceed your price. You lose money on every unit sold. Revise your pricing or reduce costs immediately.'
        });
      } else {
        insights.push({
          type: 'info',
          title: 'Break-Even Analysis',
          text: `You need to sell ${data.breakEvenUnits.toFixed(0)} units to break even. That's $${data.breakEvenRevenue.toFixed(0)} in revenue.`
        });

        insights.push({
          type: 'success',
          title: 'Contribution Margin',
          text: `Each unit contributes $${data.contributionMargin.toFixed(2)} toward fixed costs. Your margin ratio is ${data.contributionMarginRatio.toFixed(1)}%.`
        });
      }

      return insights;
    }
  };

  // ── Benchmark Engine ────────────────────────────────────
  const BenchmarkEngine = {
    getYouTubeCPMBenchmarks() {
      return {
        niches: [
          { name: 'Finance', cpm: 25, rpm: 13.75 },
          { name: 'Business', cpm: 18, rpm: 9.9 },
          { name: 'Real Estate', cpm: 20, rpm: 11 },
          { name: 'Technology', cpm: 15, rpm: 8.25 },
          { name: 'Health', cpm: 12, rpm: 6.6 },
          { name: 'Education', cpm: 10, rpm: 5.5 },
          { name: 'Travel', cpm: 8, rpm: 4.4 },
          { name: 'Gaming', cpm: 5, rpm: 2.75 },
          { name: 'Entertainment', cpm: 4, rpm: 2.2 },
          { name: 'Music', cpm: 3, rpm: 1.65 }
        ],
        countries: [
          { name: 'United States', multiplier: 1.0 },
          { name: 'United Kingdom', multiplier: 0.85 },
          { name: 'Canada', multiplier: 0.9 },
          { name: 'Australia', multiplier: 0.88 },
          { name: 'Germany', multiplier: 0.7 },
          { name: 'France', multiplier: 0.65 }
        ]
      };
    },

    getTikTokBenchmarks() {
      return {
        niches: [
          { name: 'Finance', rpm: 1.2 },
          { name: 'Business', rpm: 1.0 },
          { name: 'Education', rpm: 0.9 },
          { name: 'Technology', rpm: 0.85 },
          { name: 'Beauty', rpm: 0.65 },
          { name: 'Fitness', rpm: 0.7 },
          { name: 'Gaming', rpm: 0.55 },
          { name: 'Entertainment', rpm: 0.5 }
        ]
      };
    },

    getCreatorTiers() {
      return {
        tiers: [
          { name: 'Nano', followers: '1K-10K', avgIncome: 15000 },
          { name: 'Micro', followers: '10K-50K', avgIncome: 45000 },
          { name: 'Mid-Tier', followers: '50K-250K', avgIncome: 120000 },
          { name: 'Macro', followers: '250K-1M', avgIncome: 350000 },
          { name: 'Mega', followers: '1M+', avgIncome: 1200000 }
        ]
      };
    },

    calculatePercentile(value, dataset) {
      const sorted = [...dataset].sort((a, b) => a - b);
      const index = sorted.findIndex(v => v >= value);
      if (index === -1) return 100;
      return Math.round((index / sorted.length) * 100);
    }
  };

  // ── Forecast Engine ─────────────────────────────────────
  const ForecastEngine = {
    generateRevenueForecast(currentRevenue, growthRates, months = 12) {
      const scenarios = {
        conservative: [],
        realistic: [],
        optimistic: []
      };

      let conservative = currentRevenue;
      let realistic = currentRevenue;
      let optimistic = currentRevenue;

      for (let i = 0; i < months; i++) {
        conservative *= (1 + growthRates.conservative / 100);
        realistic *= (1 + growthRates.realistic / 100);
        optimistic *= (1 + growthRates.optimistic / 100);

        scenarios.conservative.push({ month: i + 1, value: conservative });
        scenarios.realistic.push({ month: i + 1, value: realistic });
        scenarios.optimistic.push({ month: i + 1, value: optimistic });
      }

      return scenarios;
    },

    generateAudienceGrowth(currentAudience, growthRates, months = 12) {
      return this.generateRevenueForecast(currentAudience, growthRates, months);
    }
  };

  // ── Chart Engine ────────────────────────────────────────
  const ChartEngine = {
    defaults: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            font: { family: "'Inter', sans-serif", size: 12 },
            color: 'var(--text-secondary)',
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          backgroundColor: 'var(--bg-card)',
          titleColor: 'var(--text-primary)',
          bodyColor: 'var(--text-secondary)',
          borderColor: 'var(--border-color)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 12,
          displayColors: true,
          boxPadding: 4
        }
      },
      scales: {
        x: {
          grid: { color: 'var(--chart-grid)', drawBorder: false },
          ticks: { color: 'var(--text-tertiary)', font: { family: "'Inter', sans-serif", size: 11 } }
        },
        y: {
          grid: { color: 'var(--chart-grid)', drawBorder: false },
          ticks: { color: 'var(--text-tertiary)', font: { family: "'Inter', sans-serif", size: 11 } }
        }
      }
    },

    createBarChart(ctx, labels, datasets, options = {}) {
      return new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: { ...this.defaults, ...options }
      });
    },

    createLineChart(ctx, labels, datasets, options = {}) {
      return new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
          ...this.defaults,
          elements: { line: { tension: 0.4 }, point: { radius: 4, hoverRadius: 6 } },
          ...options
        }
      });
    },

    createDoughnutChart(ctx, labels, data, colors, options = {}) {
      return new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          ...this.defaults,
          cutout: '65%',
          ...options
        }
      });
    },

    createRadarChart(ctx, labels, datasets, options = {}) {
      return new Chart(ctx, {
        type: 'radar',
        data: { labels, datasets },
        options: {
          ...this.defaults,
          scales: {
            r: {
              grid: { color: 'var(--chart-grid)' },
              angleLines: { color: 'var(--chart-grid)' },
              pointLabels: { color: 'var(--text-secondary)', font: { family: "'Inter', sans-serif", size: 11 } },
              ticks: { display: false }
            }
          },
          ...options
        }
      });
    }
  };

  // ── Public API ──────────────────────────────────────────
  return {
    init() {
      ThemeManager.init();
      NavManager.init();
      AnimationManager.init();
      ToastManager.init();
      console.log('🚀 Internet Money OS initialized');
    },

    // Expose modules
    Utils,
    Storage: StorageManager,
    Toast: ToastManager,
    Calculator: CalculatorEngine,
    Insights: InsightEngine,
    Benchmarks: BenchmarkEngine,
    Forecast: ForecastEngine,
    Charts: ChartEngine,

    // Theme
    toggleTheme: () => ThemeManager.toggle(),
    getTheme: () => state.theme,

    // State
    getState: () => ({ ...state })
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  IMOS.init();
});
