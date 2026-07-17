import { Amplify } from "aws-amplify";

const region = process.env.NEXT_PUBLIC_AWS_REGION;
const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

export const authEnvironment = {
  NEXT_PUBLIC_AWS_REGION: Boolean(region),
  NEXT_PUBLIC_COGNITO_USER_POOL_ID: Boolean(userPoolId),
  NEXT_PUBLIC_COGNITO_CLIENT_ID: Boolean(userPoolClientId),
} as const;

export const isCognitoConfigured = Object.values(authEnvironment).every(Boolean);

let configured = false;
let initializationLogged = false;

export function getAuthEnvironmentDiagnostics() {
  const userPoolRegion = userPoolId?.split("_")[0];
  return {
    loadedVariables: Object.entries(authEnvironment)
      .filter(([, loaded]) => loaded)
      .map(([name]) => name),
    missingVariables: Object.entries(authEnvironment)
      .filter(([, loaded]) => !loaded)
      .map(([name]) => name),
    userPoolRegionMatchesConfiguredRegion: Boolean(region && userPoolRegion && region === userPoolRegion),
  };
}

/** Configures Amplify once, only when the browser has complete Cognito settings. */
export function configureAmplify(): boolean {
  if (!initializationLogged) {
    console.info("[auth] Amplify initialization environment", getAuthEnvironmentDiagnostics());
    initializationLogged = true;
  }

  if (configured) {
    return true;
  }

  if (!isCognitoConfigured) {
    console.error("[auth] Amplify initialization skipped: required public Cognito configuration is missing.", getAuthEnvironmentDiagnostics());
    return false;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: userPoolId!,
        userPoolClientId: userPoolClientId!,
        loginWith: {
          email: true,
        },
        signUpVerificationMethod: "code",
        userAttributes: {
          email: { required: true },
        },
      },
    },
  });

  configured = true;
  console.info("[auth] Amplify configured", getAuthEnvironmentDiagnostics());
  return true;
}
