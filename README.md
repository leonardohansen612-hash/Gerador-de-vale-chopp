# TEX Vale-Chope — Neon + Vercel

## Instalação
1. No Neon, abra SQL Editor e execute `neon.sql` (uma vez).
2. Na Vercel, em Settings > Environment Variables, defina:
   - `DATABASE_URL`: conexão completa do Neon (segredo; não publicar).
   - `ADMIN_PASSWORD`: senha forte exclusiva para entrar no Vale-Chope.
   - `SESSION_SECRET`: segredo aleatório de no mínimo 32 caracteres, diferente da senha de login.
3. Suba TODOS os arquivos desta pasta na **raiz** do repositório GitHub (index.html, app.js, style.css, neon.sql, package.json, vercel.json e pasta api/). Não suba a pasta externa como subdiretório.
4. Faça novo deploy de produção na Vercel, após salvar as variáveis.
5. Acesse o site, entre com ADMIN_PASSWORD, emita um voucher de teste, consulte, resgate e confira os relatórios. Não utilize com clientes até testar impressão e persistência.

## Segurança e operação
- Não coloque DATABASE_URL, ADMIN_PASSWORD ou SESSION_SECRET no GitHub ou no navegador.
- A autenticação é uma senha compartilhada, com cookie HttpOnly e expiração em 12h; ideal para piloto restrito, não para contas individuais ou auditoria de operadores.
- Os nomes Leo/Jefferson/Luiz no formulário são identificações operacionais, não autenticação individual.
- A impressão usa window.print(); teste no computador do caixa e configure o software de impressão já instalado.
- A exportação é CSV com separador `;`, abre no Excel.
- A data de validade é calculada como 30 dias corridos a partir da emissão.
- Relatório: os detalhes filtram por emissão; o card de consumo no retorno usa data do resgate.
