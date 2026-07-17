import {
  autoSignIn,
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";

const logError = (operation: string, error: unknown): void => {
  console.error(`[auth] ${operation} failed`, {
    name: error instanceof Error ? error.name : "UnknownAuthError",
    message: error instanceof Error ? error.message : String(error),
  });
};

export async function signInWithEmail(email: string, password: string) {
  console.info("[auth] signIn started", { username: email });
  try {
    const response = await signIn({ username: email, password });
    console.info("[auth] signIn completed", { isSignedIn: response.isSignedIn, nextStep: response.nextStep.signInStep });
    return response;
  } catch (error: unknown) {
    logError("signIn", error);
    throw error;
  }
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
  console.info("[auth] signUp started", { username: email });
  try {
    const response = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
        autoSignIn: true,
      },
    });
    console.info("[auth] signUp completed", {
      isSignUpComplete: response.isSignUpComplete,
      nextStep: response.nextStep.signUpStep,
      userId: response.userId,
    });
    return response;
  } catch (error: unknown) {
    logError("signUp", error);
    throw error;
  }
}

export async function confirmEmailSignUp(email: string, confirmationCode: string) {
  console.info("[auth] confirmSignUp started", { username: email });
  try {
    const response = await confirmSignUp({ username: email, confirmationCode });
    console.info("[auth] confirmSignUp completed", { isSignUpComplete: response.isSignUpComplete, nextStep: response.nextStep.signUpStep });
    return response;
  } catch (error: unknown) {
    logError("confirmSignUp", error);
    throw error;
  }
}

export async function completeAutoSignIn() {
  console.info("[auth] autoSignIn started");
  try {
    const response = await autoSignIn();
    console.info("[auth] autoSignIn completed", { isSignedIn: response.isSignedIn, nextStep: response.nextStep.signInStep });
    return response;
  } catch (error: unknown) {
    logError("autoSignIn", error);
    throw error;
  }
}

export async function currentSession() {
  console.info("[auth] currentSession started");
  try {
    const session = await fetchAuthSession();
    console.info("[auth] currentSession completed", { hasTokens: Boolean(session.tokens), hasIdentityId: Boolean(session.identityId) });
    return session;
  } catch (error: unknown) {
    logError("currentSession", error);
    throw error;
  }
}

export async function getSession() {
  console.info("[auth] fetchAuthSession started");
  try {
    const session = await fetchAuthSession();
    console.info("[auth] fetchAuthSession completed", { hasTokens: Boolean(session.tokens), hasIdentityId: Boolean(session.identityId) });
    return session;
  } catch (error: unknown) {
    logError("fetchAuthSession", error);
    throw error;
  }
}

export async function getAuthenticatedUser() {
  console.info("[auth] getCurrentUser started");
  try {
    const user = await getCurrentUser();
    console.info("[auth] getCurrentUser completed", { username: user.username, userId: user.userId });
    return user;
  } catch (error: unknown) {
    logError("getCurrentUser", error);
    throw error;
  }
}

export async function signOutUser() {
  console.info("[auth] signOut started");
  try {
    await signOut();
    console.info("[auth] signOut completed");
  } catch (error: unknown) {
    logError("signOut", error);
    throw error;
  }
}
