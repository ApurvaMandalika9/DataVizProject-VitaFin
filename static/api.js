// Handles API communication (GET/POST requests)

// Adding Reusable API functions for now

// GET request
async function getData(endpoint) {
    const res = await fetch(endpoint);
    return await res.json();
  }
  
  // POST request
  async function postData(endpoint, data) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    return await res.json();
  }
  