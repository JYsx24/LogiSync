const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { Storage } = require('@google-cloud/storage');

initializeApp();

// Runs every Sunday at 02:00 UTC — exports the entire Firestore database to GCS.
// Prerequisites:
//   1. Enable the Cloud Firestore API and Cloud Storage API in GCP.
//   2. Create a GCS bucket: gs://logisync-66bed-backups
//   3. Grant the default App Engine service account the
//      "Cloud Datastore Import Export Admin" role in IAM.
//   4. Deploy: firebase deploy --only functions
exports.scheduledFirestoreBackup = onSchedule('every sunday 02:00', async () => {
  const projectId = process.env.GCLOUD_PROJECT || 'logisync-66bed';
  const bucket = `gs://${projectId}-backups`;
  const timestamp = new Date().toISOString().split('T')[0];
  const outputUriPrefix = `${bucket}/${timestamp}`;

  const client = new (require('@google-cloud/firestore').v1.FirestoreAdminClient)();
  const name = client.databasePath(projectId, '(default)');

  await client.exportDocuments({ name, outputUriPrefix, collectionIds: [] });
  console.log(`Firestore backup started → ${outputUriPrefix}`);
});
