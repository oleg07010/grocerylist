import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccountMenu from "./AccountMenu";

// The LIVE privacy policy — Google Play's account-deletion rule asks for an in-app path to
// the same web page the Data safety form names (PLAYSTORE.md § Account deletion).
const PRIVACY_URL = "https://grocerylist-virid.vercel.app/privacy.html";

const openMenu = () => fireEvent.click(screen.getByRole("button", { name: "Account options" }));

test("links to the live privacy policy and to its account-deletion section", () => {
  render(<AccountMenu />);
  openMenu();

  expect(screen.getByRole("menuitem", { name: "Privacy policy" })).toHaveAttribute("href", PRIVACY_URL);
  expect(screen.getByRole("menuitem", { name: "Delete account…" })).toHaveAttribute(
    "href",
    `${PRIVACY_URL}#delete`
  );
});

test("both links leave the app: a new tab on the web, the phone's browser in the native apps", () => {
  render(<AccountMenu />);
  openMenu();

  for (const name of ["Privacy policy", "Delete account…"]) {
    const link = screen.getByRole("menuitem", { name });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("choosing an item closes the menu", async () => {
  render(<AccountMenu />);
  openMenu();

  fireEvent.click(screen.getByRole("menuitem", { name: "Delete account…" }));

  await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
});
