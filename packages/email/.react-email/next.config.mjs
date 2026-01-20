
import path from 'path';
const emailsDirRelativePath = path.normalize('./src/emails');
const userProjectLocation = '/Users/rodrigoburigo/Documents/Projects/JavaScript/ss-gas/packages/email';
const previewServerLocation = '/Users/rodrigoburigo/Documents/Projects/JavaScript/ss-gas/packages/email/.react-email';
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_IS_BUILDING: 'true',
    EMAILS_DIR_RELATIVE_PATH: emailsDirRelativePath,
    EMAILS_DIR_ABSOLUTE_PATH: path.resolve(userProjectLocation, emailsDirRelativePath),
    PREVIEW_SERVER_LOCATION: previewServerLocation,
    USER_PROJECT_LOCATION: userProjectLocation
  },
  outputFileTracingRoot: previewServerLocation,
  serverExternalPackages: ['esbuild'],
  typescript: {
    ignoreBuildErrors: true
  },
  staticPageGenerationTimeout: 600,
}

export default nextConfig