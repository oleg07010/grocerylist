import { configureNativeUI } from "./nativeSetup";

// Toggle the platform per-test; mock the two native plugins so we can assert the
// calls without a real device. (Mirrors the Firestore/plugin mocking style in
// App.test.jsx.)
const mockIsNative = jest.fn();
const mockSetStyle = jest.fn(() => Promise.resolve());
const mockHide = jest.fn(() => Promise.resolve());

jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => mockIsNative() },
}));

jest.mock("@capacitor/status-bar", () => ({
  StatusBar: { setStyle: (...a) => mockSetStyle(...a) },
  // Capacitor's enum is inverted: Style.Light = dark content for light backgrounds.
  Style: { Light: "LIGHT", Dark: "DARK" },
}));

jest.mock("@capacitor/splash-screen", () => ({
  SplashScreen: { hide: (...a) => mockHide(...a) },
}));

beforeEach(() => {
  mockIsNative.mockReset();
  mockSetStyle.mockClear();
  mockHide.mockClear();
});

test("is a no-op on the web (no native plugin calls)", async () => {
  mockIsNative.mockReturnValue(false);

  await configureNativeUI();

  expect(mockSetStyle).not.toHaveBeenCalled();
  expect(mockHide).not.toHaveBeenCalled();
});

test("on native: sets dark status-bar content and hides the splash", async () => {
  mockIsNative.mockReturnValue(true);

  await configureNativeUI();

  expect(mockSetStyle).toHaveBeenCalledWith({ style: "LIGHT" });
  expect(mockHide).toHaveBeenCalledTimes(1);
});

test("still hides the splash even if styling the status bar fails", async () => {
  // A status-bar failure must never leave the app stuck behind the splash.
  mockIsNative.mockReturnValue(true);
  mockSetStyle.mockRejectedValueOnce(new Error("no status bar"));

  await expect(configureNativeUI()).resolves.toBeUndefined();

  expect(mockHide).toHaveBeenCalledTimes(1);
});
