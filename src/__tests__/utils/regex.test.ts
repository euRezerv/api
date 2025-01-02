import { isEmailFormat } from "@utils/regex";

describe("isEmailFormat", () => {
  it("should return true for valid email addresses", () => {
    expect(isEmailFormat("email@provider.com")).toBe(true);
    expect(isEmailFormat("abc-d@mail.com")).toBe(true);
    expect(isEmailFormat("abc.def@mail.com")).toBe(true);
    expect(isEmailFormat("abc_def@mail.com")).toBe(true);
    expect(isEmailFormat("abc.def@mail-archive.com")).toBe(true);
    expect(isEmailFormat("abc.def@mail.org")).toBe(true);
    expect(isEmailFormat("plosnitapufoasa2000@gmail.com")).toBe(true);
  });

  it("should return false for invalid email addresses", () => {
    expect(isEmailFormat("email")).toBe(false);
    expect(isEmailFormat("email@")).toBe(false);
    expect(isEmailFormat("email.com")).toBe(false);
    expect(isEmailFormat("@provider")).toBe(false);
    expect(isEmailFormat("@provider.com")).toBe(false);
    expect(isEmailFormat("@.com")).toBe(false);
    expect(isEmailFormat(" @.com")).toBe(false);
    expect(isEmailFormat("email@provider")).toBe(false);
    expect(isEmailFormat("email@provider.")).toBe(false);
    expect(isEmailFormat("email@provider..com")).toBe(false);
    expect(isEmailFormat("email@@provider.com")).toBe(false);
    expect(isEmailFormat("email @provider.com")).toBe(false);
    expect(isEmailFormat("email@ provider.com")).toBe(false);
    expect(isEmailFormat("email@provider .com")).toBe(false);
    expect(isEmailFormat("email@provider. com")).toBe(false);
    expect(isEmailFormat("abc.def@mail#archive.com")).toBe(false);
    expect(isEmailFormat(" ")).toBe(false);
    expect(isEmailFormat("0123567890")).toBe(false);
    expect(isEmailFormat("0123 567 890")).toBe(false);
    expect(isEmailFormat("+40123567890")).toBe(false);
    expect(isEmailFormat("+40 123 567 890")).toBe(false);
  });
});
