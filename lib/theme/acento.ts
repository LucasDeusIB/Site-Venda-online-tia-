// Teste de bordas coloridas: cicla a paleta de acento do site para que, dentro de
// uma mesma seção, os cards alternem as cores (vermelho, amarelo, azul).
// Os nomes de classe ficam literais aqui de propósito — é o que o Tailwind escaneia
// para gerar o CSS dessas cores arbitrárias.
export const CORES_BORDA = [
  'border-[#E63946]', // vermelho
  'border-[#F5B700]', // amarelo
  'border-[#2D6CDF]', // azul
] as const

export const corBorda = (i: number): string => CORES_BORDA[i % CORES_BORDA.length]
