import { signInWithGoogle } from "./googleSignIn";

const mockIsNative = jest.fn();
jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => mockIsNative() },
}));
const mockNativeGoogle = jest.fn();
jest.mock("@capacitor-firebase/authentication", () => ({
  FirebaseAuthentication: { signInWithGoogle: (...a) => mockNativeGoogle(...a) },
}));
const mockCredential = jest.fn((idToken) => ({ idToken }));
const mockSignInWithCredential = jest.fn(() => Promise.resolve("cred-result"));
const mockSignInWithPopup = jest.fn(() => Promise.resolve("popup-result"));
jest.mock("firebase/auth", () => {
  function GoogleAuthProvider() {}
  GoogleAuthProvider.credential = (...a) => mockCredential(...a);
  return {
    GoogleAuthProvider,
    signInWithCredential: (...a) => mockSignInWithCredential(...a),
    signInWithPopup: (...a) => mockSignInWithPopup(...a),
    browserPopupRedirectResolver: "RESOLVER",
  };
});
jest.mock("../firebase", () => ({ auth: "AUTH" }));

// CRA sets resetMocks: true, which wipes jest.fn implementations before each test.
beforeEach(() => {
  mockCredential.mockImplementation((idToken) => ({ idToken }));
  mockSignInWithCredential.mockResolvedValue("cred-result");
  mockSignInWithPopup.mockResolvedValue("popup-result");
});

test("web: uses the Firebase popup with the explicit resolver", async () => {
  mockIsNative.mockReturnValue(false);
  await expect(signInWithGoogle()).resolves.toBe("popup-result");
  expect(mockSignInWithPopup).toHaveBeenCalledWith("AUTH", expect.anything(), "RESOLVER");
  expect(mockNativeGoogle).not.toHaveBeenCalled();
});

test("native: signs in with the native Google sheet, then hands the ID token to the JS SDK", async () => {
  mockIsNative.mockReturnValue(true);
  mockNativeGoogle.mockResolvedValue({ credential: { idToken: "tok" } });
  await expect(signInWithGoogle()).resolves.toBe("cred-result");
  expect(mockCredential).toHaveBeenCalledWith("tok");
  expect(mockSignInWithCredential).toHaveBeenCalledWith("AUTH", { idToken: "tok" });
  expect(mockSignInWithPopup).not.toHaveBeenCalled();
});

test("native: fails clearly when Google returns no ID token", async () => {
  mockIsNative.mockReturnValue(true);
  mockNativeGoogle.mockResolvedValue({ credential: null });
  await expect(signInWithGoogle()).rejects.toThrow(/no id token/i);
  expect(mockSignInWithCredential).not.toHaveBeenCalled();
});
