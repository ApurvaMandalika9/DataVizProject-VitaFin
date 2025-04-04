// For handling form submissions
document.getElementById('healthSubmitBtn')?.addEventListener('click', () => {
    const form = document.getElementById('health-data-form');

    const weight = parseFloat(document.getElementById('weight').value);
    const heightCm = parseFloat(document.getElementById('height').value);
    const heightM = heightCm / 100; // convert to meters

    const bmi = +(weight / (heightM * heightM)).toFixed(2); // round to 2 decimals
    
    const healthData = {
        date: document.getElementById('health-date').value,
        steps: parseInt(document.getElementById('steps').value),
        heart_rate: parseInt(document.getElementById('heartrate').value),
        sleep_hours: parseFloat(document.getElementById('sleep').value),
        bmi : bmi

    };
    
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