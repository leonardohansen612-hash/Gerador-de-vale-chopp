# TEX Vale-Chope — versão 1.0

Sistema independente do Saipos para emissão, impressão, resgate e acompanhamento de vale-chopes.

## Instalação

1. Crie um projeto no Supabase (ou use um projeto existente, se quiser compartilhar a infraestrutura).
2. No **SQL Editor**, execute o conteúdo de `supabase.sql` uma única vez. Se já existir uma tabela `vouchers` de outro sistema, use outro projeto ou ajuste os nomes antes.
3. Em **Authentication > Users**, crie contas de e-mail/senha apenas para os responsáveis autorizados. Desative cadastro público no Supabase Auth.
4. Em **Project Settings > API**, copie a URL do projeto e a chave **publishable/anon** (nunca a `service_role` ou `secret`) para `config.js`.
5. Envie os arquivos do projeto para um repositório GitHub e faça deploy estático na Vercel (Framework Preset: Other; sem build). Alternativamente, teste em servidor local (`python -m http.server 8000`).
6. Abra a página no computador do caixa e entre com a conta criada.

## Impressão Bematech

O botão de emissão chama a **impressão do navegador** (`window.print()`) e produz um comprovante promocional de 80 mm. Configure a Bematech como impressora padrão e ajuste o Chrome/Edge e o driver para bobina térmica. Se a instalação existente usa QZ Tray ou outra ponte de impressão silenciosa, é necessária uma integração específica adicional: esta versão abre a janela de impressão e **não garante impressão automática silenciosa**. Faça um teste real antes de operar.

## Operação

- Emissão: valor obrigatório, nome opcional, responsável selecionável. Data, validade de 30 dias e código aleatório único automáticos.
- Reimpressão usa o mesmo código e não gera novo registro.
- Resgate: consulta por código, mostra validade e tempo decorrido. Vales vencidos podem ser autorizados; vales já utilizados não podem ser resgatados novamente.
- Retorno: valor da segunda visita obrigatório (pode ser zero).
- Relatório: período de **emissão**, indicadores e exportação CSV compatível com Excel em português. O relatório considera os resgates desses vales, mesmo se ocorrerem em outro mês. Para apurar todos os resgates feitos *em determinado mês*, independentemente da emissão, será necessário um relatório adicional.

## Segurança e observações

- As credenciais públicas ficam no navegador; o acesso aos dados depende do Supabase Auth + RLS. Não compartilhe contas.
- A função SQL de resgate é atômica, impedindo dupla validação simultânea.
- O campo `issued_by` é uma seleção operacional, não uma prova da identidade de quem emitiu; o banco registra também `created_by` (ID autenticado).
- A validade é calculada como 30 períodos de 24 horas após a emissão.
- Para auditoria financeira, o valor informado é manual e não é conciliado com o Saipos.
- A exportação é CSV para abrir no Excel, não um arquivo `.xlsx` nativo.
