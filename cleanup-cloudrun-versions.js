const functions = require('@google-cloud/functions-framework');
const { google } = require('googleapis');

const projectID = process.env.PROJECT_ID;
const region = process.env.REGION;
const serviceName = process.env.CLOUD_RUN_SERVICE_NAME;
const NUMBER_OF_KEEPING = 10;

async function getRevisions() {
    const auth = await google.auth.getClient({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const run = google.run('v2');
    const parent = `projects/${projectID}/locations/${region}/services/${serviceName}`;

    const res = await run.projects.locations.services.revisions.list({
        auth,
        parent
    });
    return res.data.revisions.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
}

async function deleteOldRevisions() {
    const auth = await google.auth.getClient({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const run = google.run('v2');
    const revisions = await getRevisions();
    if (revisions.length <= NUMBER_OF_KEEPING) return;

    const oldRevisions = revisions.slice(NUMBER_OF_KEEPING);
    for (const revision of oldRevisions) {
        console.log(`Deleting revision: ${revision.name}`);
        try {
            await run.projects.locations.services.revisions.delete({
                auth,
                name: revision.name
            });
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1s
        } catch (error) {
            console.error(`Failed to delete ${revision.name}:`, error);
        }
    }
}

functions.http('cleanupCloudRunVersions', async (req, res) => {
    try {
        await deleteOldRevisions();
        res.status(200).send('Cleanup completed');
    } catch (error) {
        console.error('Error cleaning up revisions:', error);
        res.status(500).send('Failed to clean up revisions');
    }
});