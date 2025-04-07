// visualization logic for health page


async function fetchHeartRateTrend(startDate, endDate, view = 'daily') {
    const url = `api/health/heart-rate-trend?start=${startDate}&end=${endDate}&view=${view}`;
    const response = await fetch(url);
    return await response.json();
}

async function renderHeartRateTrend() {
    const data = await fetchHeartRateTrend(startDate, endDate, view);
    
    //console.log('Heart rate trend:', data);
}
