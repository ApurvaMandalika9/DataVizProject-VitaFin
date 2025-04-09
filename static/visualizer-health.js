// visualization logic for health page

let selectedDate = new Date();
let currentView = 'monthly';
let chartInstances = {
    steps: null,
    heartRate: null,
    sleep: null,
    bmi: null
};

// Set today's date as default in the calendar
document.getElementById("calendar").valueAsDate = selectedDate;

document.getElementById("calendar").addEventListener("change", function () {
    selectedDate = new Date(this.value);
    showCharts(currentView);
});

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDateRange(view) {
    const today = selectedDate;
    let startDate, endDate;
    
    if (view === 'daily') {
        // For daily view, show ±15 days
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 15);
        endDate = new Date(today);
        endDate.setDate(today.getDate() + 15);
    } else if (view === 'monthly') {
        // For monthly view, show the selected month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (view === 'yearly') {
        // For yearly view, show the entire year
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
    }
    
    return {
        start: formatDate(startDate),
        end: formatDate(endDate)
    };
}

function showCharts(view) {
    currentView = view;
    const dateRange = getDateRange(view);

    // Fetch data for each metric and update charts
    fetchHealthData('steps-trend', dateRange.start, dateRange.end, view, updateStepsChart);
    fetchHealthData('heart-rate-trend', dateRange.start, dateRange.end, view, updateHeartRateChart);
    fetchHealthData('sleep-trend', dateRange.start, dateRange.end, view, updateSleepChart);
    fetchHealthData('bmi-trend', dateRange.start, dateRange.end, view, updateBmiChart);
}

function fetchHealthData(endpoint, start, end, view, callback) {
    const url = `/api/health/${endpoint}?start=${start}&end=${end}&view=${view}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            callback(data, view);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function updateStepsChart(data, view) {
    const ctx = document.getElementById('stepsChart').getContext('2d');
    
    // Update summary stat
    const latestData = data.trend.length > 0 ? data.trend[data.trend.length - 1] : null;
    if (latestData) {
        const stepsValue = view === 'yearly' ? latestData.average_steps : latestData.steps;
        document.getElementById('steps-value').textContent = Math.round(stepsValue).toLocaleString();
        
        // Update card color based on comparison with reference
        const cardElement = document.getElementById('steps-value').closest('.stat-card');
        if (data.reference_average) {
            if (stepsValue >= data.reference_average) {
                cardElement.classList.add('positive');
                cardElement.classList.remove('negative');
            } else if (stepsValue < data.reference_average) {
                cardElement.classList.add('negative');
                cardElement.classList.remove('positive');
            } else {
                cardElement.classList.remove('positive', 'negative');
            }
        }
    } else {
        document.getElementById('steps-value').textContent = '-';
    }
    
    if (data.reference_average) {
        document.getElementById('steps-reference').textContent = `Ref: ${Math.round(data.reference_average).toLocaleString()}`;
    }
    
    // Prepare chart data
    const labels = data.trend.map(item => view === 'yearly' ? item.month : item.date);
    const values = data.trend.map(item => view === 'yearly' ? item.average_steps : item.steps);
    
    // Destroy previous chart instance if it exists
    if (chartInstances.steps) {
        chartInstances.steps.destroy();
    }
    
    // Create new chart
    chartInstances.steps = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: view === 'yearly' ? 'Average Steps' : 'Steps',
                data: values,
                fill: false,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Steps Trend',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function updateHeartRateChart(data, view) {
    const ctx = document.getElementById('heartRateChart').getContext('2d');
    
    // Update summary stat
    const latestData = data.trend.length > 0 ? data.trend[data.trend.length - 1] : null;
    if (latestData) {
        const hrValue = view === 'yearly' ? latestData.average_heart_rate : latestData.heart_rate;
        document.getElementById('heart-rate-value').textContent = Math.round(hrValue);
        
        // Update card color based on comparison with reference
        // For heart rate, being too high OR too low is generally negative
        const cardElement = document.getElementById('heart-rate-value').closest('.stat-card');
        if (data.reference_average) {
            // Use a 10% margin for acceptable heart rate range
            const lowerBound = data.reference_average * 0.9;
            const upperBound = data.reference_average * 1.1;
            
            if (hrValue >= lowerBound && hrValue <= upperBound) {
                cardElement.classList.add('positive');
                cardElement.classList.remove('negative');
            } else {
                cardElement.classList.add('negative');
                cardElement.classList.remove('positive');
            }
        }
    } else {
        document.getElementById('heart-rate-value').textContent = '-';
    }
    
    if (data.reference_average) {
        document.getElementById('heart-rate-reference').textContent = `Ref: ${Math.round(data.reference_average)}`;
    }
    
    // Prepare chart data
    const labels = data.trend.map(item => view === 'yearly' ? item.month : item.date);
    const values = data.trend.map(item => view === 'yearly' ? item.average_heart_rate : item.heart_rate);
    
    // Destroy previous chart instance if it exists
    if (chartInstances.heartRate) {
        chartInstances.heartRate.destroy();
    }
    
    // Create new chart
    chartInstances.heartRate = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: view === 'yearly' ? 'Average Heart Rate' : 'Heart Rate',
                data: values,
                fill: false,
                borderColor: '#FF6384',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Heart Rate Trend',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

function updateSleepChart(data, view) {
    const ctx = document.getElementById('sleepChart').getContext('2d');
    
    // Update summary stat
    const latestData = data.trend.length > 0 ? data.trend[data.trend.length - 1] : null;
    if (latestData) {
        const sleepValue = view === 'yearly' ? latestData.average_sleep_hours : latestData.sleep_hours;
        document.getElementById('sleep-value').textContent = sleepValue.toFixed(1) + 'h';
        
        // Update card color based on comparison with reference
        // For sleep, we want to be close to the reference (not too much, not too little)
        const cardElement = document.getElementById('sleep-value').closest('.stat-card');
        if (data.reference_average) {
            // Use a 15% margin for acceptable sleep range
            const lowerBound = data.reference_average * 0.85;
            const upperBound = data.reference_average * 1.15;
            
            if (sleepValue >= lowerBound && sleepValue <= upperBound) {
                cardElement.classList.add('positive');
                cardElement.classList.remove('negative');
            } else {
                cardElement.classList.add('negative');
                cardElement.classList.remove('positive');
            }
        }
    } else {
        document.getElementById('sleep-value').textContent = '-';
    }
    
    if (data.reference_average) {
        document.getElementById('sleep-reference').textContent = `Ref: ${data.reference_average.toFixed(1)}h`;
    }
    
    // Prepare chart data
    const labels = data.trend.map(item => view === 'yearly' ? item.month : item.date);
    const values = data.trend.map(item => view === 'yearly' ? item.average_sleep_hours : item.sleep_hours);
    
    // Destroy previous chart instance if it exists
    if (chartInstances.sleep) {
        chartInstances.sleep.destroy();
    }
    
    // Create new chart
    chartInstances.sleep = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: view === 'yearly' ? 'Average Sleep Hours' : 'Sleep Hours',
                data: values,
                fill: false,
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Sleep Hours Trend',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

function updateBmiChart(data, view) {
    const ctx = document.getElementById('bmiChart').getContext('2d');
    
    // Update summary stat
    const latestData = data.trend.length > 0 ? data.trend[data.trend.length - 1] : null;
    if (latestData) {
        const bmiValue = view === 'yearly' ? latestData.average_bmi : latestData.bmi;
        document.getElementById('bmi-value').textContent = bmiValue.toFixed(1);
        
        // Update card color based on comparison with reference
        // For BMI, we want to be close to the reference (not too high, not too low)
        const cardElement = document.getElementById('bmi-value').closest('.stat-card');
        if (data.reference_average) {
            // Use a 10% margin for acceptable BMI range
            const lowerBound = data.reference_average * 0.9;
            const upperBound = data.reference_average * 1.1;
            
            if (bmiValue >= lowerBound && bmiValue <= upperBound) {
                cardElement.classList.add('positive');
                cardElement.classList.remove('negative');
            } else {
                cardElement.classList.add('negative');
                cardElement.classList.remove('positive');
            }
        }
    } else {
        document.getElementById('bmi-value').textContent = '-';
    }
    
    if (data.reference_average) {
        document.getElementById('bmi-reference').textContent = `Ref: ${data.reference_average.toFixed(1)}`;
    }
    
    // Prepare chart data
    const labels = data.trend.map(item => view === 'yearly' ? item.month : item.date);
    const values = data.trend.map(item => view === 'yearly' ? item.average_bmi : item.bmi);
    
    // Destroy previous chart instance if it exists
    if (chartInstances.bmi) {
        chartInstances.bmi.destroy();
    }
    
    // Create new chart
    chartInstances.bmi = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: view === 'yearly' ? 'Average BMI' : 'BMI',
                data: values,
                fill: false,
                borderColor: '#FFCE56',
                backgroundColor: 'rgba(255, 206, 86, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'BMI Trend',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    },
                    beginAtZero: false
                }
            }
        }
    });
}

window.onload = function() {
    showCharts('monthly');
};