const { google } = require('googleapis');
const functions = require('@google-cloud/functions-framework');
const { ArtifactRegistryClient } = require('@google-cloud/artifact-registry');

const NUMBER_OF_KEEPING = 10;

async function cleanupArtifactImages(projectId, location, repository) {
    const client = new ArtifactRegistryClient();

    const parent = `projects/${projectId}/locations/${location}/repositories/${repository}`;
    const [packages] = await client.listPackages({ parent });

    for (const pkg of packages) {
        const [versions] = await client.listVersions({ parent: pkg.name, orderBy: 'updateTime desc' });

        if (versions.length <= NUMBER_OF_KEEPING) continue;

        const oldVersions = versions.slice(NUMBER_OF_KEEPING);
        for (const version of oldVersions) {
            console.log(`Deleting version: ${version.name}`);
            try {
                await client.deleteVersion({ name: version.name, force: true });
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Failed to delete version ${version.name}:`, error);
            }
        }
    }
}

functions.http('cleanupArtifactRegistryImages', async (req, res) => {
    try {
        if (req.method !== 'GET') {
            return res.status(405).send('Method Not Allowed');
        }
        const getProjectId = req.query.projectId;
        const getLocation = req.query.location;
        const getRepository = req.query.repository;

        if (!getProjectId || !getLocation || !getRepository) {
            return res.status(400).send('Missing required query parameters');
        }
    

    await cleanupArtifactImages(getProjectId, getLocation, getRepository);
    res.status(200).send(`Cleanup completed for ${getRepository}`);
    } catch (error) {
        console.error('Error cleaning Artifact Registry:', error);
        res.status(500).send('Failed to clean Artifact Registry');
    }
});