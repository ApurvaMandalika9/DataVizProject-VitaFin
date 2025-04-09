const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        const selectedDate = ref(today);
        const calendarValue = ref(today.toISOString().split('T')[0]);

        const incomeInstance = ref(null);
        const categoryInstance = ref(null);
        const lineInstance = ref(null);

        const onCalendarChange = (e) => {
            // Parse date and set to 12:00 to avoid timezone offset errors
            const selected = new Date(e.target.value + 'T12:00:00');
            selectedDate.value = selected;
        };

        const formatRange = (viewType) => {
            const date = selectedDate.value;
            let start = new Date(date);
            let end = new Date(date);

            if (viewType === 'month') {
                start = new Date(date.getFullYear(), date.getMonth(), 1);
                end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            } else if (viewType === 'year') {
                start = new Date(date.getFullYear(), 0, 1);
                end = new Date(date.getFullYear(), 11, 31);
            }

            return {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
            };
        };

        const fetchBudgetData = (viewType) => {
            const { start, end } = formatRange(viewType);
            console.log("Fetching data for:", viewType, "from", start, "to", end);

            // Income vs Expense
            fetch(`/api/budget/income-vs-expense?start=${start}&end=${end}`)
                .then(res => res.json())
                .then(data => {
                    const income = data.find(d => d.type === 'income')?.total || 0;
                    const expense = data.find(d => d.type === 'expense')?.total || 0;
                    renderIncomeExpenseChart(income, expense);
                })
                .catch(err => console.error("Error fetching income vs expense:", err));

            // Expense Categories
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

            // Net Trend
            fetch(`/api/budget/net-trend?start=${start}&end=${end}&view=${viewType}`)
                .then(res => res.json())
                .then(data => {
                    const labels = data.map(d => d[viewType]);
                    const values = data.map(d => d.net_balance);
                    renderLineChart(labels, values);
                })
                .catch(err => console.error("Error fetching trend:", err));
        };

        const renderIncomeExpenseChart = (income, expense) => {
            const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
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

        const renderCategoryExpenseChart = (categoryData) => {
            const ctx = document.getElementById('categoryExpenseChart').getContext('2d');
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

        const renderLineChart = (labels, values) => {
            const ctx = document.getElementById('lineChart').getContext('2d');
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
