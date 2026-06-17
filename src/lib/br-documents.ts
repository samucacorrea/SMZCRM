function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeCpfCnpj(value: string) {
  return onlyDigits(value);
}

export function normalizeCep(value: string) {
  return onlyDigits(value).slice(0, 8);
}

function hasRepeatedDigits(value: string) {
  return /^(\d)\1+$/.test(value);
}

export function isValidCpf(value: string) {
  const digits = normalizeCpfCnpj(value);

  if (digits.length !== 11 || hasRepeatedDigits(digits)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits[index]) * (10 - index);
  }

  const firstCheck = ((sum * 10) % 11) % 10;
  if (firstCheck !== Number(digits[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits[index]) * (11 - index);
  }

  const secondCheck = ((sum * 10) % 11) % 10;
  return secondCheck === Number(digits[10]);
}

export function isValidCnpj(value: string) {
  const digits = normalizeCpfCnpj(value);

  if (digits.length !== 14 || hasRepeatedDigits(digits)) {
    return false;
  }

  const calculateCheckDigit = (base: string, factors: number[]) => {
    const sum = base
      .split("")
      .reduce((accumulator, digit, index) => accumulator + Number(digit) * factors[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstFactor = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondFactor = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const firstCheck = calculateCheckDigit(digits.slice(0, 12), firstFactor);
  if (firstCheck !== Number(digits[12])) {
    return false;
  }

  const secondCheck = calculateCheckDigit(digits.slice(0, 13), secondFactor);
  return secondCheck === Number(digits[13]);
}

export function isValidCpfCnpj(value: string) {
  const digits = normalizeCpfCnpj(value);

  if (digits.length === 11) {
    return isValidCpf(digits);
  }

  if (digits.length === 14) {
    return isValidCnpj(digits);
  }

  return false;
}

export function formatCpfCnpj(value: string) {
  const digits = normalizeCpfCnpj(value);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatCep(value: string) {
  const digits = normalizeCep(value);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}
