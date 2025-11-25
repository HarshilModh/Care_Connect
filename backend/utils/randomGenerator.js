export const createRandomPassword = () => {
  const length = 8;
  const lowerCase = "abcdefghijklmnopqrstuvwxyz";
  const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specials = "@$!%*?&";
  const availableChars = lowerCase + upperCase + digits + specials;

  let password = [];

  password.push(lowerCase.charAt(Math.floor(Math.random() * lowerCase.length)));
  password.push(upperCase.charAt(Math.floor(Math.random() * upperCase.length)));
  password.push(digits.charAt(Math.floor(Math.random() * digits.length)));
  password.push(specials.charAt(Math.floor(Math.random() * specials.length)));

  for (let i = password.length; i < length; i++) {
    password.push(
      availableChars.charAt(Math.floor(Math.random() * availableChars.length))
    );
  }

  // Shuffle the array
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
};
