export function getAppName() {
  return process.env.NEXT_PUBLIC_APP_NAME || 'Gram Kushal';
}

export function getAcademyName() {
  return `${getAppName()} Academy`;
}
