const { google } = require('googleapis');
const functions = require('@google-cloud/functions-framework');
const { ArtifactRegistryClient } = require('@google-cloud/artifact-registry');

const projectId = process.env.PROJECT_ID;
const location = process.env.LOCATION; // 'asia-southeast2'
const repository = process.env.REPOSITORY;

async function cleanupArtifactImages() {
    const client = new ArtifactRegistryClient();

    const parent = `projects/${projectId}/locations/${location}/repositories/${repository}`;
    const [packages] = await client.listPackages({ parent });

    for (const pkg of packages) {
        const [versions] = await client.listVersions({ parent: pkg.name, orderBy: 'updateTime desc' });

        if (versions.length <= 10) continue;

        const oldVersions = versions.slice(10);
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
        await cleanupArtifactImages();
        res.status(200).send('Artifact Registry cleanup completed');
    } catch (error) {
        console.error('Error cleaning Artifact Registry:', error);
        res.status(500).send('Failed to clean Artifact Registry');
    }
});