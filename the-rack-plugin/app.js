const API_URL = 'http://' + window.location.hostname + ':3000/api/v1/assets';

function showNotification(message, isError = false) {
    const banner = document.getElementById('notificationBanner');
    banner.textContent = message;
    banner.style.display = 'block';
    banner.style.backgroundColor = isError ? '#c9190b' : '#3e8635'; 
    setTimeout(() => { banner.style.display = 'none'; }, 5000);
}

async function fetchAssets() {
    try {
        const response = await fetch(API_URL);
        const assets = await response.json();
        const tableBody = document.getElementById('assetTableBody');
        tableBody.innerHTML = '';
        
        assets.forEach(asset => {
            const row = document.createElement('tr');
            
            // NEW: A strict sanitizer. If a server drops offline and returns blank/null strings, it looks clean.
            const cleanStr = (str) => {
                if (!str || str === 'null' || str.trim() === '') return '-';
                return str;
            };

            const os = cleanStr(asset.osVersion);
            const kernel = cleanStr(asset.kernel);
            const hwModel = cleanStr(asset.hardwareModel);
            const cores = cleanStr(asset.coreCount);
            const ram = cleanStr(asset.ramMB);
            const dc = cleanStr(asset.datacenter);
            const rack = cleanStr(asset.rackPosition);

            // Formatting specifically for Package Versions
            const formatPkg = (pkg) => {
                if (!pkg || pkg === 'Not Installed' || pkg === 'null' || pkg.trim() === '') return '<span style="color:#8a8d90;">Not Installed</span>';
                return `<span style="color:#4cb140; font-weight:600;">v${pkg}</span>`;
            };

            // 1:1 Mapping to the Database
            row.innerHTML = `
                <td><strong>${asset.hostname}</strong><br><span style="font-size: 11px; color: #8a8d90;">${hwModel}</span></td>
                <td>${asset.ipAddress}</td>
                <td>${os}</td>
                <td>${kernel}</td>
                <td>${cores}</td>
                <td>${ram}</td>
                <td>${dc}</td>
                <td>${rack}</td>
                <td>${formatPkg(asset.vlcPluginNotify)}</td>
                <td>${formatPkg(asset.vlcGuiQt)}</td>
                <td>${formatPkg(asset.vlcGuiSkins2)}</td>
            `;
            
            tableBody.appendChild(row);
        });
    } catch (error) { 
        console.error('Failed to fetch:', error); 
        showNotification('❌ Could not load assets. Ensure Governor API is running.', true);
    }
}

document.getElementById('assetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('saveBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';

    const password = document.getElementById('adminPassword').value;
    
    try {
        const loginResponse = await fetch('http://' + window.location.hostname + ':3000/api/v1/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: password })
        });

        if (!loginResponse.ok) {
            showNotification('❌ Authentication Failed: Invalid API Password', true);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Override';
            return;
        }

        const loginData = await loginResponse.json();
        const jwtToken = loginData.token; 

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
                'Authorization': 'Bearer ' + jwtToken
            },
            body: JSON.stringify(newAsset)
        });
        
        if (saveResponse.ok) {
            document.getElementById('assetForm').reset();
            fetchAssets(); 
            showNotification('✅ Manual override securely saved to Governor DB.');
        } else {
            showNotification('❌ Failed to save data. Database rejected request.', true);
        }
    } catch (error) { 
        console.error('Network Error:', error); 
        showNotification('❌ Network Error: Could not reach backend.', true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Override';
    }
});

document.getElementById('syncForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const syncBtn = document.getElementById('syncBtn');
    syncBtn.disabled = true;
    syncBtn.textContent = 'Authenticating...';

    const adminPass = document.getElementById('syncAdminPassword').value;
    const ansiblePass = document.getElementById('syncAnsiblePassword').value;
    
    try {
        const loginResponse = await fetch('http://' + window.location.hostname + ':3000/api/v1/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: adminPass })
        });

        if (!loginResponse.ok) {
            showNotification('❌ Authentication Failed: Invalid Governor Admin Password', true);
            syncBtn.disabled = false;
            syncBtn.textContent = 'Run Ansible Sync';
            return; 
        }

        const loginData = await loginResponse.json();
        const jwtToken = loginData.token; 

        syncBtn.textContent = 'Running Ansible Playbook...';
        
        const syncResponse = await fetch('http://' + window.location.hostname + ':3000/api/v1/sync', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + jwtToken
            },
            body: JSON.stringify({ ansiblePassword: ansiblePass })
        });
        
        if (syncResponse.ok) {
            document.getElementById('syncForm').reset();
            fetchAssets(); 
            showNotification('✅ Ansible Sync Complete: Cluster telemetry updated.');
        } else {
            showNotification('❌ Ansible Execution Failed. Check server logs.', true);
        }
    } catch (error) { 
        console.error('Network Error:', error); 
        showNotification('❌ Network Error: Could not reach backend.', true);
    } finally {
        syncBtn.disabled = false;
        syncBtn.textContent = 'Run Ansible Sync';
    }
});

fetchAssets();