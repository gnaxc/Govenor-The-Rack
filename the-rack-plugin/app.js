const API_URL = 'http://' + window.location.hostname + ':3000/api/v1/assets';

// --- NEW VALIDATION FEATURE ---
// This function handles the visual success/error banners
function showNotification(message, isError = false) {
    const banner = document.getElementById('notificationBanner');
    banner.textContent = message;
    banner.style.display = 'block';
    
    // Use PatternFly green for success, red for errors
    banner.style.backgroundColor = isError ? '#c9190b' : '#3e8635'; 
    
    // Automatically hide the banner after 4 seconds
    setTimeout(() => { banner.style.display = 'none'; }, 4000);
}

// Function to pull data from Mongo and populate the table
async function fetchAssets() {
    try {
        const response = await fetch(API_URL);
        const assets = await response.json();
        const tableBody = document.getElementById('assetTableBody');
        tableBody.innerHTML = '';
        
        assets.forEach(asset => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${asset.hostname}</td><td>${asset.ipAddress}</td><td>${asset.osVersion}</td><td>${asset.rackPosition}</td>`;
            tableBody.appendChild(row);
        });
    } catch (error) { 
        console.error('Failed to fetch:', error); 
        showNotification('❌ Could not load assets. Is the Node backend running?', true);
    }
}

// Function to handle form submission and JWT Authentication
document.getElementById('assetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('saveBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';

    const password = document.getElementById('adminPassword').value;
    
    try {
        // STEP 1: Attempt to Login and get a JWT
        const loginResponse = await fetch('http://' + window.location.hostname + ':3000/api/v1/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: password })
        });

        if (!loginResponse.ok) {
            showNotification('❌ Authentication Failed: Invalid Password', true);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Asset';
            return; // Stop the process here
        }

        const loginData = await loginResponse.json();
        const jwtToken = loginData.token; // We successfully got the secure token!

        // STEP 2: Use the token to save the new hardware asset
        submitBtn.textContent = 'Saving to Database...';
        const newAsset = {
            hostname: document.getElementById('hostname').value,
            ipAddress: document.getElementById('ipAddress').value,
            osVersion: document.getElementById('osVersion').value,
            rackPosition: document.getElementById('rackPosition').value
        };
        
        const saveResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + jwtToken // Passing the token as a Bearer header
            },
            body: JSON.stringify(newAsset)
        });
        
        if (saveResponse.ok) {
            document.getElementById('assetForm').reset();
            fetchAssets(); 
            showNotification('✅ Asset successfully saved securely to Governor!');
        } else {
            showNotification('❌ Failed to save. Database rejected request.', true);
        }
    } catch (error) { 
        console.error('Network Error:', error); 
        showNotification('❌ Network Error: Could not reach backend.', true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Asset';
    }
});

// Load table data when the page first opens
fetchAssets();