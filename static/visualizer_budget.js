// This file defines and runs the logic for the Budget Tracking Dashboard using Vue.js and Chart.js
const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        // Initialize the date to today at 12:00 PM to avoid timezone issues
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        // Set the default selected date to today
        const selectedDate = ref(today);
        // format it to YYYY-MM-DD for the calendar input
        const calendarValue = ref(today.toISOString().split('T')[0]);
        // Initialize chart instances to null
        // These will be used to destroy and recreate the charts when data is fetched
        const incomeInstance = ref(null);
        const categoryInstance = ref(null);
        const lineInstance = ref(null);

        const onCalendarChange = (e) => {
            // Parse date and set to 12:00 to avoid timezone offset errors
            const selected = new Date(e.target.value + 'T12:00:00');
            selectedDate.value = selected;
        };

        // Function to format the date range based on the selected view type (month/year)
        const formatRange = (viewType) => {
            const date = selectedDate.value;
            let start = new Date(date);
            let end = new Date(date);
            // Adjust the start and end dates based on the view type
            if (viewType === 'month') {
                start = new Date(date.getFullYear(), date.getMonth(), 1);
                end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            } else if (viewType === 'year') {
                start = new Date(date.getFullYear(), 0, 1);
                end = new Date(date.getFullYear(), 11, 31);
            }
            // This function will return the start and end dates in YYYY-MM-DD format
            return {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
            };
        };

        // Function to fetch budget data based on the selected view type (month/year)
        // It will fetch data for income vs expense, expense categories, and net trend
        const fetchBudgetData = (viewType) => {
            // Get the start and end dates for the selected view type from formatRange function
            // This will be used to filter the data from the API
            const { start, end } = formatRange(viewType);
            console.log("Fetching data for:", viewType, "from", start, "to", end);

            // Income vs Expense: Fetch the total income and expense for the selected date range
            // This will be used to create a pie chart showing the ratio of income to expense
            fetch(`/api/budget/income-vs-expense?start=${start}&end=${end}`)
                .then(res => res.json())
                .then(data => {
                    const income = data.find(d => d.type === 'income')?.total || 0;
                    const expense = data.find(d => d.type === 'expense')?.total || 0;
                    renderIncomeExpenseChart(income, expense);
                })
                .catch(err => console.error("Error fetching income vs expense:", err));

            // Expense Categories: Fetch the total expense for each category in the selected date range
            // This will be used to create a pie chart showing the distribution of expenses by category
            fetch(`/api/budget/expense-categories?start=${start}&end=${end}`)
                .then(res => res.json())
                .then(data => {
                    const categoryData = {};
                    data.forEach(item => {
                        categoryData[item.category] = item.total;
                    });
                    renderCategoryExpenseChart(categoryData);
                })
                .catch(err => console.error("Error fetching category data:", err));

            // Net Trend: Fetch the net balance trend over time for the selected date range
            // This will be used to create a line chart showing the net balance over time
            fetch(`/api/budget/net-trend?start=${start}&end=${end}&view=${viewType}`)
                .then(res => res.json())
                .then(data => {
                    const labels = data.map(d => d[viewType]);
                    const values = data.map(d => d.net_balance);
                    renderLineChart(labels, values);
                })
                .catch(err => console.error("Error fetching trend:", err));
        };

        // Function to render the income vs expense pie chart using Chart.js
        const renderIncomeExpenseChart = (income, expense) => {
            const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
            // destroy the previous chart instance if it exists to avoid memory leaks
            // Create a new pie chart with the provided income and expense data
            // This will show the ratio of income to expense in a pie chart format
            if (incomeInstance.value) incomeInstance.value.destroy();
            incomeInstance.value = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Income', 'Expense'],
                    datasets: [{
                        data: [income, expense],
                        backgroundColor: ['#4CAF50', '#FF6384']
                    }]
                },
                // Chart.js options to customize the chart appearance
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Income vs Expense',
                            font: { size: 16 }
                        },
                        legend: {
                            position: 'bottom',
                            labels: { boxWidth: 20, padding: 15 }
                        }
                    }
                }
            });
        };

        // Function to render the expense categories pie chart using Chart.js - Category data is passed as a parameter
        const renderCategoryExpenseChart = (categoryData) => {
            const ctx = document.getElementById('categoryExpenseChart').getContext('2d');
            // destroy the previous chart instance if it exists to avoid memory leaks
            // Create a new pie chart with the provided category data
            if (categoryInstance.value) categoryInstance.value.destroy();
            categoryInstance.value = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: Object.keys(categoryData),
                    datasets: [{
                        data: Object.values(categoryData),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56',
                            '#8E44AD', '#4BC0C0', '#E7E9ED', '#2ECC71', '#F39C12'
                        ]
                    }]
                },
                // Chart.js options to customize the chart appearance
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Expenses by Category',
                            font: { size: 16 }
                        },
                        legend: {
                            position: 'bottom',
                            labels: { boxWidth: 12, padding: 15 }
                        }
                    }
                }
            });
        };

        // Function to render the net balance line chart using Chart.js - Labels and values are passed as parameters
        const renderLineChart = (labels, values) => {
            const ctx = document.getElementById('lineChart').getContext('2d');
            //Destroy the previous chart instance if it exists to avoid memory leaks
            // Create a new line chart with the provided labels and values
            if (lineInstance.value) lineInstance.value.destroy();
            lineInstance.value = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Net Balance',
                        data: values,
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }]
                },
                // Chart.js options to customize the chart appearance
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Net Amount Over Time',
                            font: { size: 16 }
                        },
                        legend: {
                            position: 'top'
                        }
                    },
                    // Define the scales for the x and y axes
                    // Customize the grid lines and ticks for better readability
                    scales: {
                        x: {
                            grid: { display: true, color: 'rgba(0,0,0,0.05)' },
                            ticks: { maxRotation: 45, minRotation: 45 }
                        },
                        y: {
                            grid: { display: true, color: 'rgba(0,0,0,0.05)' },
                            beginAtZero: false
                        }
                    }
                }
            });
        };

        // Fetch the initial data when the component is mounted - loading the data for the current month by default
        onMounted(() => {
            fetchBudgetData('month');
        });

        return {
            calendarValue,
            onCalendarChange,
            fetchBudgetData
        };
    }
}).mount('#app');
