import { confirmSignUp, signIn, signUp } from "aws-amplify/auth";

export async function signInWithEmail(email: string, password: string) {
  return signIn({ username: email, password });
}

export async function signUpWithEmail({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) {
  return signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        name,
      },
    },
  });
}

export async function confirmEmailSignUp(email: string, confirmationCode: string) {
  return confirmSignUp({ username: email, confirmationCode });
}
