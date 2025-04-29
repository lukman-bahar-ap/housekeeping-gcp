const { google } = require('googleapis');
const functions = require('@google-cloud/functions-framework');

const projectID = process.env.PROJECT_ID;
const serviceName = process.env.APP_SERVICE_NAME;

async function getAppEngineVersions() {
    const auth = await google.auth.getClient({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const appengine = google.appengine({ version: 'v1', auth });

    const res = await appengine.apps.services.versions.list({
        appsId: projectID,
        servicesId: serviceName
    });

    return res.data.versions.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
}

async function deleteOldVersions() {
    const auth = await google.auth.getClient({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const appengine = google.appengine({ version: 'v1', auth });
    const versions = await getAppEngineVersions();
    if (versions.length <= 10) return;

    const oldVersions = versions.slice(10);
    for (const version of oldVersions) {
        console.log(`Deleting version: ${version.id}`);
        try {
            await appengine.apps.services.versions.delete({
                appsId: projectID,
                servicesId: serviceName,
                versionsId: version.id
            });
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1s
        } catch (error) {
            console.error(`Failed to delete ${version.id}:`, error);
        }
    }
}

functions.http('cleanupAppEngineVersions', async (req, res) => {
    try {
        await deleteOldVersions();
        res.status(200).send('Cleanup completed');
    } catch (error) {
        console.error('Error cleaning up versions:', error);
        res.status(500).send('Failed to clean up versions');
    }
});