import { authenticate } from '@google-cloud/local-auth';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const credentialsPath = resolve('credentials.json');
const tokenPath = resolve('token.json');

const credentials = JSON.parse(
  await readFile(credentialsPath, 'utf8'),
);

const clientConfig = credentials.installed ?? credentials.web;

if (!clientConfig) {
  throw new Error(
    'Le fichier credentials.json ne contient pas de configuration OAuth valide.',
  );
}

const auth = await authenticate({
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  keyfilePath: credentialsPath,
});

if (!auth.credentials.refresh_token) {
  throw new Error(
    'Aucun refresh_token reçu. Révoque éventuellement l’autorisation Google puis recommence.',
  );
}

await writeFile(
  tokenPath,
  JSON.stringify(
    {
      type: 'authorized_user',
      client_id: clientConfig.client_id,
      client_secret: clientConfig.client_secret,
      refresh_token: auth.credentials.refresh_token,
    },
    null,
    2,
  ),
  'utf8',
);

console.log(`Jeton Google Drive créé : ${tokenPath}`);
