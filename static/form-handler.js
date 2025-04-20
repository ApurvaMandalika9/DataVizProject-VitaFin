// Handling health form submissions

// Adding click event listener to the health form submit button
document.getElementById('healthSubmitBtn')?.addEventListener('click', () => {
    const form = document.getElementById('health-data-form');

    // Extracting and parsing form input values
    const weight = parseFloat(document.getElementById('weight').value);
    const heightCm = parseFloat(document.getElementById('height').value);
    const heightM = heightCm / 100; // convert to meters

    // Calculating BMI and round to 2 decimal places
    const bmi = +(weight / (heightM * heightM)).toFixed(2); // round to 2 decimals
    
    // Creating a healthData object containing all the extracted values
    const healthData = {
        date: document.getElementById('health-date').value,
        steps: parseInt(document.getElementById('steps').value),
        heart_rate: parseInt(document.getElementById('heartrate').value),
        sleep_hours: parseFloat(document.getElementById('sleep').value),
        bmi : bmi

    };
    
    // Sending the health data to the server via a POST request
    fetch('/add-health', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(healthData)
    })
    .then(response => response.json())
    .then(data => {
        alert('Health data submitted successfully!');
        form.reset();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error submitting health data');
    });
});

// For handling budget form submissions
document.getElementById('budgetSubmitBtn')?.addEventListener('click', () => {
    const form = document.getElementById('budget-data-form');

    const type = document.getElementById('budget-type').value;
    const category = type === 'income' 
        ? 'salary' 
        : document.getElementById('category').value;

    const budgetData = {
        date: document.getElementById('budget-date').value,
        type: type,
        category: category,
        description: document.getElementById('description').value || "No description",
        amount: parseFloat(document.getElementById('amount').value)
    };

    fetch('/add-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData)
    })
    .then(response => response.json())
    .then(data => {
        alert('Budget data submitted successfully!');
        form.reset();
        document.getElementById('category').disabled = true;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error submitting budget data');
    });
});