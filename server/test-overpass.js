const axios = require('axios');

async function test() {
  const query = `
[out:json][timeout:30];
(
  node["amenity"~"restaurant|cafe|fast_food"](around:3000,28.6208,77.3639);
);
out center body;
  `.trim();

  try {
    // Attempt 1: Raw POST
    console.log('Attempt 1: Raw POST');
    let res = await axios.post('https://overpass-api.de/api/interpreter', query, {
      headers: { 
        'Content-Type': 'text/plain',
        'User-Agent': 'RestaurantFinder/1.0 (Student Project)'
      }
    });
    console.log('Success 1:', res.data.elements?.length);
  } catch (err) {
    console.error('Error 1:', err.response?.status, err.message);
  }

  try {
    // Attempt 2: Form POST
    console.log('\nAttempt 2: Form POST');
    const params = new URLSearchParams();
    params.append('data', query);
    let res = await axios.post('https://overpass-api.de/api/interpreter', params.toString(), {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RestaurantFinder/1.0 (Student Project)'
      }
    });
    console.log('Success 2:', res.data.elements?.length);
  } catch (err) {
    console.error('Error 2:', err.response?.status, err.message);
  }

  try {
    // Attempt 3: GET
    console.log('\nAttempt 3: GET');
    let res = await axios.get('https://overpass-api.de/api/interpreter', {
      params: { data: query },
      headers: { 
        'User-Agent': 'RestaurantFinder/1.0 (Student Project)'
      }
    });
    console.log('Success 3:', res.data.elements?.length);
  } catch (err) {
    console.error('Error 3:', err.response?.status, err.message);
  }
}

test();
