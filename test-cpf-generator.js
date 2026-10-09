/**
 * Teste do gerador de CPF
 */

function gerarCpfValido() {
  // Gera um CPF válido aleatório
  let cpf = '';
  
  // Gera os primeiros 9 dígitos aleatoriamente
  for (let i = 0; i < 9; i++) {
    cpf += Math.floor(Math.random() * 10);
  }
  
  // Calcula o primeiro dígito verificador
  let soma = 0;
  let multiplicador = 10;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * multiplicador;
    multiplicador--;
  }
  let resto = soma % 11;
  let primeiroDigito = resto < 2 ? 0 : 11 - resto;
  
  // Calcula o segundo dígito verificador
  cpf += primeiroDigito;
  soma = 0;
  multiplicador = 11;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * multiplicador;
    multiplicador--;
  }
  resto = soma % 11;
  let segundoDigito = resto < 2 ? 0 : 11 - resto;
  
  cpf += segundoDigito;
  return cpf;
}

console.log("✅ CPFs Válidos Gerados:");
for (let i = 0; i < 10; i++) {
  const cpf = gerarCpfValido();
  console.log(`${i + 1}. ${cpf}`);
}
