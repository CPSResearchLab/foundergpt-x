import { Amplify } from "aws-amplify";

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

export const isCognitoConfigured = Boolean(userPoolId && userPoolClientId);

let configured = false;

/** Configures Amplify once, only when the browser has complete Cognito settings. */
export function configureAmplify() {
  if (configured || !isCognitoConfigured) {
    return;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: userPoolId!,
        userPoolClientId: userPoolClientId!,
        loginWith: {
          email: true,
        },
      },
    },
  });

  configured = true;
}
