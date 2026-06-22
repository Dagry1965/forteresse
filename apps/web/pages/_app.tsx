import type { AppProps } from 'next/app';
import Head from 'next/head'; // On ajoute Head
import { AuthProvider } from '../context/AuthContext';
import Layout from '../components/Layout';

// ON SUPPRIME l'import CSS habituel ici (import '../styles/...')

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        {/* On charge le CSS directement depuis le dossier public */}
        <link rel="stylesheet" href="/theme.css" />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
