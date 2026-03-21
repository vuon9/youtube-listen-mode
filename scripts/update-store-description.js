const fs = require('fs');

async function updateStoreDescription() {
    const extensionId = process.env.EXTENSION_ID;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const refreshToken = process.env.REFRESH_TOKEN;

    if (!extensionId || !clientId || !clientSecret || !refreshToken) {
        console.error('Missing required environment variables');
        process.exit(1);
    }

    try {
        console.log('Fetching access token...');
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
        }

        const accessToken = tokenData.access_token;
        const description = fs.readFileSync('STORE_DESCRIPTION.txt', 'utf8');

        console.log('Updating store description...');
        const updateResponse = await fetch(`https://www.googleapis.com/chromewebstore/v1.1/items/${extensionId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'x-goog-api-version': '2'
            },
            body: JSON.stringify({
                detailed_description: description
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Google API returned status ${updateResponse.status}: ${errorText}`);
        }

        const updateData = await updateResponse.json();
        if (updateData.uploadState === 'FAILURE' || updateData.error_code) {
             console.error('Update response details:', JSON.stringify(updateData, null, 2));
             // Sometimes it returns a success status but with an error list
             if (updateData.error_detail) {
                console.error('Error detail:', updateData.error_detail);
             }
             throw new Error('Update failed');
        }

        console.log('✅ Store description updated successfully!');
    } catch (error) {
        console.error('❌ Error updating store description:', error.message);
        process.exit(1);
    }
}

updateStoreDescription();
