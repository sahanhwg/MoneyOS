/* ============================================================
   INTERNET MONEY OS — Calculator Module
   Handles all calculator page logic, inputs, charts, insights
   ============================================================ */

/**
 * Calculator Module - Individual calculator implementations
 */
const Calculators = (function() {
  'use strict';

  // ── Shared UI Helpers ───────────────────────────────────
  const UI = {
    formatCurrency: (v) => IMOS.Utils.formatCurrency(v),
    formatNumber: (v) => IMOS.Utils.formatNumber(v),
    formatPercent: (v) => IMOS.Utils.formatPercent(v),

    updateSliderValue(slider, display, formatter = (v) => v) {
      slider.addEventListener('input', () => {
        display.textContent = formatter(slider.value);
        this.triggerCalculation();
      });
    },

    triggerCalculation() {
      // Debounced calculation trigger
      clearTimeout(this._calcTimeout);
      this._calcTimeout = setTimeout(() => {
        document.dispatchEvent(new CustomEvent('calculate'));
      }, 50);
    },

    renderInsights(container, insights) {
      container.innerHTML = insights.map(i => `
        <div class="insight-card ${i.type}">
          <div class="insight-title">
            <span>${i.type === 'success' ? '✓' : i.type === 'warning' ? '⚠' : i.type === 'danger' ? '✕' : 'ℹ'}</span>
            ${i.title}
          </div>
          <div class="insight-text">${i.text}</div>
        </div>
      `).join('');
    },

    renderBenchmarks(container, benchmarks, userValue, label) {
      const maxVal = Math.max(...benchmarks.map(b => b.value), userValue);

      container.innerHTML = benchmarks.map(b => {
        const pct = (b.value / maxVal) * 100;
        const isUser = b.isUser;
        return `
          <div class="benchmark-item">
            <div class="benchmark-header">
              <span class="benchmark-label">${b.name} ${isUser ? '(You)' : ''}</span>
              <span class="benchmark-value">${b.display || b.value}</span>
            </div>
            <div class="benchmark-bar">
              <div class="benchmark-bar-fill" style="width: ${pct}%; background: ${isUser ? 'var(--gradient-hero)' : 'var(--color-gray-400)'};"></div>
            </div>
          </div>
        `;
      }).join('');
    },

    animateValue(el, start, end, duration = 600, formatter = (v) => v) {
      const startTime = performance.now();
      const update = (t) => {
        const p = Math.min((t - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = formatter(start + (end - start) * eased);
        if (p < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    }
  };

  // ── YouTube CPM Calculator ────────────────────────────────
  function initYouTubeCPM() {
    const viewsSlider = document.getElementById('cpm-views');
    const cpmSlider = document.getElementById('cpm-rate');
    const countrySelect = document.getElementById('cpm-country');
    const nicheSelect = document.getElementById('cpm-niche');

    if (!viewsSlider) return;

    const viewsDisplay = document.getElementById('cpm-views-display');
    const cpmDisplay = document.getElementById('cpm-rate-display');
    const resultRevenue = document.getElementById('cpm-result-revenue');
    const resultCPM = document.getElementById('cpm-result-cpm');
    const resultRPM = document.getElementById('cpm-result-rpm');
    const resultYearly = document.getElementById('cpm-result-yearly');
    const insightsContainer = document.getElementById('cpm-insights');
    const benchmarksContainer = document.getElementById('cpm-benchmarks');

    UI.updateSliderValue(viewsSlider, viewsDisplay, (v) => IMOS.Utils.formatNumber(v));
    UI.updateSliderValue(cpmSlider, cpmDisplay, (v) => '$' + v);

    [countrySelect, nicheSelect].forEach(el => {
      el.addEventListener('change', () => UI.triggerCalculation());
    });

    function calculate() {
      const views = parseInt(viewsSlider.value);
      const cpm = parseFloat(cpmSlider.value);
      const country = countrySelect.value;
      const niche = nicheSelect.value;

      const result = IMOS.Calculator.calculateYouTubeCPM(views, cpm, country, niche);

      UI.animateValue(resultRevenue, 0, result.creatorRevenue, 600, UI.formatCurrency);
      UI.animateValue(resultCPM, 0, result.adjustedCPM, 600, (v) => '$' + v.toFixed(2));
      UI.animateValue(resultRPM, 0, result.rpm, 600, (v) => '$' + v.toFixed(2));
      UI.animateValue(resultYearly, 0, result.creatorRevenue * 12, 600, UI.formatCurrency);

      // Insights
      const insights = IMOS.Insights.generate('youtube_cpm', result);
      UI.renderInsights(insightsContainer, insights);

      // Benchmarks
      const benchmarks = IMOS.Benchmarks.getYouTubeCPMBenchmarks().niches.map(n => ({
        name: n.name,
        value: n.cpm,
        display: '$' + n.cpm.toFixed(2),
        isUser: false
      }));
      benchmarks.push({
        name: 'Your Channel',
        value: result.adjustedCPM,
        display: '$' + result.adjustedCPM.toFixed(2),
        isUser: true
      });
      UI.renderBenchmarks(benchmarksContainer, benchmarks, result.adjustedCPM, 'CPM');

      // Chart
      updateCPMChart(result, views);

      // Save
      IMOS.Storage.push('calculations', {
        type: 'youtube_cpm',
        inputs: { views, cpm, country, niche },
        result: { revenue: result.creatorRevenue, cpm: result.adjustedCPM }
      });
    }

    document.addEventListener('calculate', calculate);
    calculate();
  }

  function updateCPMChart(result, views) {
    const ctx = document.getElementById('cpm-chart');
    if (!ctx) return;

    const chartData = {
      labels: ['YouTube (45%)', 'Creator (55%)'],
      datasets: [{
        data: [result.youtubeCut, result.creatorRevenue],
        backgroundColor: ['#94a3b8', '#6366f1'],
        borderWidth: 0
      }]
    };

    if (window._cpmChart) window._cpmChart.destroy();
    window._cpmChart = IMOS.Charts.createDoughnutChart(ctx, chartData.labels, chartData.datasets[0].data, chartData.datasets[0].backgroundColor, {
      plugins: { legend: { position: 'bottom' } }
    });
  }

  // ── YouTube RPM Calculator ────────────────────────────────
  function initYouTubeRPM() {
    const viewsSlider = document.getElementById('rpm-views');
    const revenueSlider = document.getElementById('rpm-revenue');

    if (!viewsSlider) return;

    const viewsDisplay = document.getElementById('rpm-views-display');
    const revenueDisplay = document.getElementById('rpm-revenue-display');
    const resultRPM = document.getElementById('rpm-result-rpm');
    const resultMonthly = document.getElementById('rpm-result-monthly');
    const resultYearly = document.getElementById('rpm-result-yearly');
    const insightsContainer = document.getElementById('rpm-insights');

    UI.updateSliderValue(viewsSlider, viewsDisplay, (v) => IMOS.Utils.formatNumber(v));
    UI.updateSliderValue(revenueSlider, revenueDisplay, (v) => '$' + v);

    function calculate() {
      const views = parseInt(viewsSlider.value);
      const revenue = parseFloat(revenueSlider.value);

      const result = IMOS.Calculator.calculateYouTubeRPM(views, revenue);

      UI.animateValue(resultRPM, 0, result.rpm, 600, (v) => '$' + v.toFixed(2));
      UI.animateValue(resultMonthly, 0, result.estimatedMonthly, 600, UI.formatCurrency);
      UI.animateValue(resultYearly, 0, result.estimatedYearly, 600, UI.formatCurrency);

      const insights = IMOS.Insights.generate('youtube_rpm', result);
      UI.renderInsights(insightsContainer, insights);

      // Save
      IMOS.Storage.push('calculations', {
        type: 'youtube_rpm',
        inputs: { views, revenue },
        result: { rpm: result.rpm, yearly: result.estimatedYearly }
      });
    }

    document.addEventListener('calculate', calculate);
    calculate();
  }

  // ── TikTok Earnings Calculator ────────────────────────────
  function initTikTok() {
    const viewsSlider = document.getElementById('tt-views');
    const programSelect = document.getElementById('tt-program');
    const nicheSelect = document.getElementById('tt-niche');

    if (!viewsSlider) return;

    const viewsDisplay = document.getElementById('tt-views-display');
    const resultEarnings = document.getElementById('tt-result-earnings');
    const resultMin = document.getElementById('tt-result-min');
    const resultMax = document.getElementById('tt-result-max');
    const resultPer1M = document.getElementById('tt-result-per1m');
    const insightsContainer = document.getElementById('tt-insights');
    const benchmarksContainer = document.getElementById('tt-benchmarks');

    UI.updateSliderValue(viewsSlider, viewsDisplay, (v) => IMOS.Utils.formatNumber(v));
    [programSelect, nicheSelect].forEach(el => el.addEventListener('change', () => UI.triggerCalculation()));

    function calculate() {
      const views = parseInt(viewsSlider.value);
      const program = programSelect.value;
      const niche = nicheSelect.value;

      const result = IMOS.Calculator.calculateTikTokEarnings(views, program, niche);

      UI.animateValue(resultEarnings, 0, result.estimatedEarnings, 600, UI.formatCurrency);
      UI.animateValue(resultMin, 0, result.minEarnings, 600, UI.formatCurrency);
      UI.animateValue(resultMax, 0, result.maxEarnings, 600, UI.formatCurrency);
      UI.animateValue(resultPer1M, 0, result.per1MViews, 600, (v) => '$' + v.toFixed(0));

      const insights = IMOS.Insights.generate('tiktok', result);
      UI.renderInsights(insightsContainer, insights);

      // Benchmarks
      const benchmarks = IMOS.Benchmarks.getTikTokBenchmarks().niches.map(n => ({
        name: n.name,
        value: n.rpm,
        display: '$' + n.rpm.toFixed(2),
        isUser: false
      }));
      benchmarks.push({
        name: 'Your Content',
        value: result.rpm,
        display: '$' + result.rpm.toFixed(2),
        isUser: true
      });
      UI.renderBenchmarks(benchmarksContainer, benchmarks, result.rpm, 'RPM');

      // Save
      IMOS.Storage.push('calculations', {
        type: 'tiktok',
        inputs: { views, program, niche },
        result: { earnings: result.estimatedEarnings }
      });
    }

    document.addEventListener('calculate', calculate);
    calculate();
  }

  // ── Sponsorship Estimator ─────────────────────────────────
  function initSponsorship() {
    const followersSlider = document.getElementById('sp-followers');
    const engagementSlider = document.getElementById('sp-engagement');
    const nicheSelect = document.getElementById('sp-niche');
    const postsSlider = document.getElementById('sp-posts');

    if (!followersSlider) return;

    const followersDisplay = document.getElementById('sp-followers-display');
    const engagementDisplay = document.getElementById('sp-engagement-display');
    const postsDisplay = document.getElementById('sp-posts-display');
    const resultPerPost = document.getElementById('sp-result-perpost');
    const resultMonthly = document.getElementById('sp-result-monthly');
    const resultYearly = document.getElementById('sp-result-yearly');
    const resultTier = document.getElementById('sp-result-tier');
    const insightsContainer = document.getElementById('sp-insights');

    UI.updateSliderValue(followersSlider, followersDisplay, (v) => IMOS.Utils.formatNumber(v));
    UI.updateSliderValue(engagementSlider, engagementDisplay, (v) => v + '%');
    UI.updateSliderValue(postsSlider, postsDisplay, (v) => v);
    nicheSelect.addEventListener('change', () => UI.triggerCalculation());

    function calculate() {
      const followers = parseInt(followersSlider.value);
      const engagement = parseFloat(engagementSlider.value);
      const niche = nicheSelect.value;
      const posts = parseInt(postsSlider.value);

      const result = IMOS.Calculator.calculateSponsorship(followers, engagement, niche, posts);

      UI.animateValue(resultPerPost, 0, result.avgPerPost, 600, UI.formatCurrency);
      UI.animateValue(resultMonthly, 0, result.monthlyEstimate, 600, UI.formatCurrency);
      UI.animateValue(resultYearly, 0, result.yearlyEstimate, 600, UI.formatCurrency);
      resultTier.textContent = result.tier.charAt(0).toUpperCase() + result.tier.slice(1);

      const insights = IMOS.Insights.generate('sponsorship', result);
      UI.renderInsights(insightsContainer, insights);

      // Save
      IMOS.Storage.push('calculations', {
        type: 'sponsorship',
        inputs: { followers, engagement, niche, posts },
        result: { perPost: result.avgPerPost, yearly: result.yearlyEstimate }
      });
    }

    document.addEventListener('calculate', calculate);
    calculate();
  }

  // ── Affiliate Revenue Calculator ──────────────────────────
  function initAffiliate() {
    const visitorsSlider = document.getElementById('af-visitors');
    const conversionSlider = document.getElementById('af-conversion');
    const commissionSlider = document.getElementById('af-commission');
    const aovSlider = document.getElementById('af-aov');

    if (!visitorsSlider) return;

    const visitorsDisplay = document.getElementById('af-visitors-display');
    const conversionDisplay = document.getElementById('af-conversion-display');
    const commissionDisplay = document.getElementById('af-commission-display');
    const aovDisplay = document.getElementById('af-aov-display');
    const resultRevenue = document.getElementById('af-result-revenue');
    const resultConversions = document.getElementById('af-result-conversions');
    const resultPerVisitor = document.getElementById('af-result-pervisitor');
    const resultYearly = document.getElementById('af-result-yearly');
    const insightsContainer = document.getElementById('af-insights');

    UI.updateSliderValue(visitorsSlider, visitorsDisplay, (v) => IMOS.Utils.formatNumber(v));
    UI.updateSliderValue(conversionSlider, conversionDisplay, (v) => v + '%');
    UI.updateSliderValue(commissionSlider, commissionDisplay, (v) => '$' + v);
    UI.updateSliderValue(aovSlider, aovDisplay, (v) => '$' + v);

    function calculate() {
      const visitors = parseInt(visitorsSlider.value);
      const conversion = parseFloat(conversionSlider.value);
      const commission = parseFloat(commissionSlider.value);
      const aov = parseFloat(aovSlider.value);

      const result = IMOS.Calculator.calculateAffiliate(visitors, conversion, commission, aov);

      UI.animateValue(resultRevenue, 0, result.revenue, 600, UI.formatCurrency);
      UI.animateValue(resultConversions, 0, result.conversions, 600, (v) => v.toFixed(0));
      UI.animateValue(resultPerVisitor, 0, result.revenuePerVisitor, 600, (v) => '$' + v.toFixed(2));
      UI.animateValue(resultYearly, 0, result.yearlyRevenue, 600, UI.formatCurrency);

      const insights = IMOS.Insights.generate('affiliate', result);
      UI.renderInsights(insightsContainer, insights);

      // Save
      IMOS.Storage.push('calculations', {
        type: 'affiliate',
        inputs: { visitors, conversion, commission, aov },
        result: { revenue: result.revenue, yearly: result.yearlyRevenue }
      });
    }

    document.addEventListener('calculate', calculate);
    calculate();
  }

  // ── ROI Calculator ────────────────────────────────────────
  function initROI() {
    const investmentSlider = document.getElementById('roi-investment');
    const revenueSlider = document.getElementById('roi-revenue');
    const timeframeSelect = document.getElementById('roi-timeframe');

    if (!investmentSlider) return;

    const investmentDisplay = document.getElementById('roi-investment-display');
    const revenueDisplay = document.getElementById('roi-revenue-display');
    const resultProfit = document.getElementById('roi-result-profit');
    const resultROI = document.getElementById('roi-result-roi');
    const resultMultiplier = document.getElementById('roi-result-multiplier');
    const resultYearly = document.getElementById('roi-result-yearly');
    const insightsContainer = document.getElementById('roi-insights');

    UI.updateSliderValue(investmentSlider, investmentDisplay, (v) => '$' + v);
    UI.updateSliderValue(revenueSlider, revenueDisplay, (v) => '$' + v);
    timeframeSelect.addEventListener('change', () => UI.triggerCalculation());

    function calculate() {
      const investment = parseFloat(investmentSlider.value);
      const revenue = parseFloat(revenueSlider.value);
      const timeframe = timeframeSelect.value;

      const result = IMOS.Calculator.calculateROI(investment, revenue, timeframe);

      UI.animateValue(resultProfit, 0, result.profit, 600, UI.formatCurrency);
      UI.animateValue(resultROI, 0, result.roi, 600, (v) => v.toFixed(1) + '%');
      UI.animateValue(resultMultiplier, 0, result.multiplier, 600, (v) => v.toFixed(2) + 'x');
      UI.animateValue(resultYearly, 0, result.yearlyROI, 600, (v) => v.toFixed(0) + '%');

      const insights = IMOS.Insights.generate('roi', result);
      UI.renderInsights(insightsContainer, insights);

      // Save
      IMOS.Storage.push('calculations', {
        type: 'roi',
        inputs: { investment, revenue, timeframe },
        result: { profit: result.profit, roi: result.roi }
      });
    }

    document.addEventListener('calculate', calculate);
    calculate();
  }

  // ── SaaS MRR Calculator ───────────────────────────────────
  function initSaaSMRR() {
    const customersSlider = document.getElementById('saas-customers');
    const arpuSlider = document.getElementById('saas-arpu');
    const churnSlider = document.getElementById('saas-churn');
    const growthSlider = document.getElementById('saas-growth');

    if (!customersSlider) return;

    const customersDisplay = document.getElementById('saas-customers-display');
    const arpuDisplay = document.getElementById('saas-arpu-display');
    const churnDisplay = document.getElementById('saas-churn-display');
    const growthDisplay = document.getElementById('saas-growth-display');
    const resultMRR = document.getElementById('saas-result-mrr');
    const resultARR = document.getElementById('saas-result-arr');
    const resultLTV = document.getElementById('saas-result-ltv');
    const resultYearEnd = document.getElementById('saas-result-yearend');
    const insightsContainer = document.getElementById('saas-insights');

    UI.updateSliderValue(customersSlider, customersDisplay, (v) => v);
    UI.updateSliderValue(arpuSlider, arpuDisplay, (v) => '$' + v);
    UI.updateSliderValue(churnSlider, churnDisplay, (v) => v + '%');
    UI.updateSliderValue(growthSlider, growthDisplay, (v) => v + '%');

    function calculate() {
      const customers = parseInt(customersSlider.value);
      const arpu = parseFloat(arpuSlider.value);
      const churn = parseFloat(churnSlider.value);
      const growth = parseFloat(growthSlider.value);

      const result = IMOS.Calculator.calculateSaaSMRR(customers, arpu, churn, growth);

      UI.animateValue(resultMRR, 0, result.mrr, 600, UI.formatCurrency);
      UI.animateValue(resultARR, 0, result.arr, 600, UI.formatCurrency);
      UI.animateValue(resultLTV, 0, result.ltv, 600, UI.formatCurrency);
      UI.animateValue(resultYearEnd, 0, result.yearEndARR, 600, UI.formatCurrency);

      const insights = IMOS.Insights.generate('saas_mrr', result);
      UI.renderInsights(insightsContainer, insights);

      // Update projection chart
      updateSaaSChart(result.projections);

      // Save
      IMOS.Storage.push('calculations', {
        type: 'saas_mrr',
        inputs: { customers, arpu, churn, growth },
        result: { mrr: result.mrr, arr: result.arr }
      });
    }

    document.addEventListener('calculate', calculate);
    calculate();
  }

  function updateSaaSChart(projections) {
    const ctx = document.getElementById('saas-chart');
    if (!ctx) return;

    const labels = projections.map(p => 'M' + p.month);
    const data = projections.map(p => p.mrr);

    if (window._saasChart) window._saasChart.destroy();
    window._saasChart = IMOS.Charts.createLineChart(ctx, labels, [{
      label: 'Projected MRR',
      data: data,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4
    }]);
  }

  // ── Freelance Rate Calculator ───────────────────────────
  function initFreelance() {
    const goalSlider = document.getElementById('fl-goal');
    const hoursSlider = document.getElementById('fl-hours');
    const weeksSlider = document.getElementById('fl-weeks');
    const expensesSlider = document.getElementById('fl-expenses');

    if (!goalSlider) return;

    const goalDisplay = document.getElementById('fl-goal-display');
    const hoursDisplay = document.getElementById('fl-hours-display');
    const weeksDisplay = document.getElementById('fl-weeks-display');
    const expensesDisplay = document.getElementById('fl-expenses-display');
    const resultHourly = document.getElementById('fl-result-hourly');
    const resultDaily = document.getElementById('fl-result-daily');
    const resultWeekly = document.getElementById('fl-result-weekly');
    const resultMonthly = document.getElementById('fl-result-monthly');
    const insightsContainer = document.getElementById('fl-insights');

    UI.updateSliderValue(goalSlider, goalDisplay, (v) => '$' + IMOS.Utils.formatNumber(v));
    UI.updateSliderValue(hoursSlider, hoursDisplay, (v) => v + ' hrs');
    UI.updateSliderValue(weeksSlider, weeksDisplay, (v) => v + ' weeks');
    UI.updateSliderValue(expensesSlider, expensesDisplay, (v) => '$' + IMOS.Utils.formatNumber(v));

    function calculate() {
      const goal = parseFloat(goalSlider.value);
      const hours = parseInt(hoursSlider.value);
      const weeks = parseInt(weeksSlider.value);
      const expenses = parseFloat(expensesSlider.value);

      const result = IMOS.Calculator.calculateFreelanceRate(goal, hours, weeks, expenses);

      UI.animateValue(resultHourly, 0, result.hourlyRate, 600, (v) => '$' + v.toFixed(0) + '/hr');
      UI.animateValue(resultDaily, 0, result.dailyRate, 600, UI.formatCurrency);
      UI.animateValue(resultWeekly, 0, result.weeklyRate, 600, UI.formatCurrency);
      UI.animateValue(resultMonthly, 0, result.monthlyRate, 600, UI.formatCurrency);

      const insights = IMOS.Insights.generate('freelance', result);
      UI.renderInsights(insightsContainer, insights);

      // Save
      IMOS.Storage.push('calculations', {
        type: 'freelance',
        inputs: { goal, hours, weeks, expenses },
        result: { hourlyRate: result.hourlyRate, yearly: result.effectiveAnnualIncome }
      });
    }

    document.addEventListener('calculate', calculate);
    calculate();
  }

  // ── Shopify Profit Calculator ───────────────────────────
  function initShopify() {
    const revenueSlider = document.getElementById('sh-revenue');
    const cogsSlider = document.getElementById('sh-cogs');
    const adSpendSlider = document.getElementById('sh-adspend');
    const planSelect = document.getElementById('sh-plan');
    const feesSlider = document.getElementById('sh-fees');

    if (!revenueSlider) return;

    const revenueDisplay = document.getElementById('sh-revenue-display');
    const cogsDisplay = document.getElementById('sh-cogs-display');
    const adSpendDisplay = document.getElementById('sh-adspend-display');
    const feesDisplay = document.getElementById('sh-fees-display');
    const resultProfit = document.getElementById('sh-result-profit');
    const resultMargin = document.getElementById('sh-result-margin');
    const resultROAS = document.getElementById('sh-result-roas');
    const resultYearly = document.getElementById('sh-result-yearly');
    const insightsContainer = document.getElementById('sh-insights');

    UI.updateSliderValue(revenueSlider, revenueDisplay, (v) => '$' + IMOS.Utils.formatNumber(v));
    UI.updateSliderValue(cogsSlider, cogsDisplay, (v) => '$' + IMOS.Utils.formatNumber(v));
    UI.updateSliderValue(adSpendSlider, adSpendDisplay, (v) => '$' + IMOS.Utils.formatNumber(v));
    UI.updateSliderValue(feesSlider, feesDisplay, (v) => v + '%');
    planSelect.addEventListener('change', () => UI.triggerCalculation());

    function calculate() {
      const revenue = parseFloat(revenueSlider.value);
      const cogs = parseFloat(cogsSlider.value);
      const adSpend = parseFloat(adSpendSlider.value);
      const plan = planSelect.value;
      const fees = parseFloat(feesSlider.value);

      const result = IMOS.Calculator.calculateShopifyProfit(revenue, cogs, adSpend, plan, fees);

      UI.animateValue(resultProfit, 0, result.profit, 600, UI.formatCurrency);
      UI.animateValue(resultMargin, 0, result.profitMargin, 600, (v) => v.toFixed(1) + '%');
      UI.animateValue(resultROAS, 0, result.roas, 600, (v) => v.toFixed(1) + 'x');
      UI.animateValue(resultYearly, 0, result.yearlyProfit, 600, UI.formatCurrency);

      const insights = IMOS.Insights.generate('shopify', result);
      UI.renderInsights(insightsContainer, insights);

      // Update breakdown chart
      updateShopifyChart(result);

      // Save
      IMOS.Storage.push('calculations', {
        type: 'shopify',
        inputs: { revenue, cogs, adSpend, plan, fees },
        result: { profit: result.profit, margin: result.profitMargin }
      });
    }

    document.addEventListener('calculate', calculate);
    calculate();
  }

  function updateShopifyChart(result) {
    const ctx = document.getElementById('sh-chart');
    if (!ctx) return;

    if (window._shopifyChart) window._shopifyChart.destroy();
    window._shopifyChart = IMOS.Charts.createDoughnutChart(ctx,
      ['Profit', 'COGS', 'Ad Spend', 'Transaction Fees', 'Plan'],
      [result.profit, result.cogs, result.adSpend, result.transactionFees, result.planCost],
      ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'],
      { plugins: { legend: { position: 'bottom' } } }
    );
  }

  // ── Break-even Calculator ─────────────────────────────────
  function initBreakEven() {
    const fixedSlider = document.getElementById('be-fixed');
    const variableSlider = document.getElementById('be-variable');
    const priceSlider = document.getElementById('be-price');

    if (!fixedSlider) return;

    const fixedDisplay = document.getElementById('be-fixed-display');
    const variableDisplay = document.getElementById('be-variable-display');
    const priceDisplay = document.getElementById('be-price-display');
    const resultUnits = document.getElementById('be-result-units');
    const resultRevenue = document.getElementById('be-result-revenue');
    const resultMargin = document.getElementById('be-result-margin');
    const resultRatio = document.getElementById('be-result-ratio');
    const insightsContainer = document.getElementById('be-insights');

    UI.updateSliderValue(fixedSlider, fixedDisplay, (v) => '$' + IMOS.Utils.formatNumber(v));
    UI.updateSliderValue(variableSlider, variableDisplay, (v) => '$' + v);
    UI.updateSliderValue(priceSlider, priceDisplay, (v) => '$' + v);

    function calculate() {
      const fixed = parseFloat(fixedSlider.value);
      const variable = parseFloat(variableSlider.value);
      const price = parseFloat(priceSlider.value);

      const result = IMOS.Calculator.calculateBreakEven(fixed, variable, price);

      UI.animateValue(resultUnits, 0, result.breakEvenUnits, 600, (v) => v.toFixed(0) + ' units');
      UI.animateValue(resultRevenue, 0, result.breakEvenRevenue, 600, UI.formatCurrency);
      UI.animateValue(resultMargin, 0, result.contributionMargin, 600, (v) => '$' + v.toFixed(2));
      UI.animateValue(resultRatio, 0, result.contributionMarginRatio, 600, (v) => v.toFixed(1) + '%');

      const insights = IMOS.Insights.generate('breakeven', result);
      UI.renderInsights(insightsContainer, insights);

      // Save
      IMOS.Storage.push('calculations', {
        type: 'breakeven',
        inputs: { fixed, variable, price },
        result: { units: result.breakEvenUnits, revenue: result.breakEvenRevenue }
      });
    }

    document.addEventListener('calculate', calculate);
    calculate();
  }

  // ── Dashboard ───────────────────────────────────────────
  function initDashboard() {
    const dashboardEl = document.getElementById('dashboard');
    if (!dashboardEl) return;

    const calculations = IMOS.Storage.get('calculations') || [];

    // Stats cards
    const totalCalculations = calculations.length;
    const uniqueTypes = new Set(calculations.map(c => c.type)).size;
    const lastCalculation = calculations[calculations.length - 1];

    document.getElementById('dash-total-calc').textContent = totalCalculations;
    document.getElementById('dash-unique-tools').textContent = uniqueTypes;

    if (lastCalculation) {
      document.getElementById('dash-last-calc').textContent = lastCalculation.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      document.getElementById('dash-last-time').textContent = new Date(lastCalculation.timestamp).toLocaleDateString();
    }

    // Recent activity
    const activityList = document.getElementById('dash-activity');
    if (activityList) {
      const recent = calculations.slice(-10).reverse();
      activityList.innerHTML = recent.map(c => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
          <div>
            <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${c.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            <div style="font-size: 12px; color: var(--text-tertiary);">${new Date(c.timestamp).toLocaleString()}</div>
          </div>
          <div style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary); font-size: 14px;">
            ${c.result && Object.values(c.result)[0] ? '$' + IMOS.Utils.formatNumber(Object.values(c.result)[0]) : ''}
          </div>
        </div>
      `).join('');
    }

    // Calculator usage chart
    const typeCounts = {};
    calculations.forEach(c => {
      typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
    });

    const ctx = document.getElementById('dash-chart');
    if (ctx && Object.keys(typeCounts).length > 0) {
      if (window._dashChart) window._dashChart.destroy();
      window._dashChart = IMOS.Charts.createBarChart(ctx,
        Object.keys(typeCounts).map(t => t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
        [{
          label: 'Calculations',
          data: Object.values(typeCounts),
          backgroundColor: '#6366f1',
          borderRadius: 8
        }]
      );
    }
  }

  // ── Public API ────────────────────────────────────────────
  return {
    init() {
      initYouTubeCPM();
      initYouTubeRPM();
      initTikTok();
      initSponsorship();
      initAffiliate();
      initROI();
      initSaaSMRR();
      initFreelance();
      initShopify();
      initBreakEven();
      initDashboard();
    }
  };
})();

// Initialize calculators on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for IMOS to be ready
  const checkIMOS = setInterval(() => {
    if (typeof IMOS !== 'undefined') {
      clearInterval(checkIMOS);
      Calculators.init();
    }
  }, 100);
});
