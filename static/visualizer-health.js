// visualization logic for health page


async function fetchHeartRateTrend(startDate, endDate, view = 'daily') {
    const url = `/health/heart-rate-trend?start=${startDate}&end=${endDate}&view=${view}`;
    const response = await fetch(url);
    return await response.json();
  }

async function renderHeartRateTrend(startDate, endDate, view = 'daily') {
    const data = await fetchHeartRateTrend(startDate, endDate, view);
    // use this data for the chart
}